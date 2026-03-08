const sql = require('mssql');
const db = require('../config/db');
const Incubation = require('./Incubation');

class Dashboard {
  static toMap(rows, key = 'IdLot') {
    return rows.reduce((acc, row) => {
      acc[row[key]] = row;
      return acc;
    }, {});
  }

  static async query(pool, queryText, inputs = []) {
    const request = pool.request();
    for (const input of inputs) {
      request.input(input.name, input.type, input.value);
    }
    const result = await request.query(queryText);
    return result.recordset;
  }

  // Calcul du coût nourriture pour un lot (utilise le pool partagé)
  static calculerCoutNourriture(lot, ageJours, croissanceByRace, mortaliteByLot) {
    if (ageJours <= 0) return 0;

    const croissanceData = croissanceByRace[lot.IdRace] || [];
    if (croissanceData.length === 0) return 0;

    const mortaliteEvents = mortaliteByLot[lot.Id] || [];

    // Index mortalité par jour
    const mortaliteByDay = {};
    for (const m of mortaliteEvents) {
      mortaliteByDay[m.DayOffset] = (mortaliteByDay[m.DayOffset] || 0) + m.Nombre;
    }

    // Index nourriture par semaine
    const nourritureAtWeek = new Map();
    for (const c of croissanceData) {
      nourritureAtWeek.set(c.Semaine, Number(c.Nourriture));
    }

    // Calcul exact jour par jour
    let vivants = lot.Nombre;
    let currentNourriture = nourritureAtWeek.get(0) || 0;
    let coutTotal = 0;

    for (let day = 0; day < ageJours; day++) {
      if (mortaliteByDay[day]) {
        vivants = Math.max(0, vivants - mortaliteByDay[day]);
      }
      if (day % 7 === 0) {
        const week = day / 7;
        if (nourritureAtWeek.has(week)) {
          currentNourriture = nourritureAtWeek.get(week);
        }
      }
      coutTotal += vivants * currentNourriture * lot.PrixNourritureGramme;
    }

    return coutTotal;
  }

  // Le poids moyen (poids vif) = semaine 0 (poussin) + gains hebdomadaires jusqu'a l'age courant
  static getPoidsMoyen(idRace, ageJours, croissanceByRace) {
    const croissanceData = croissanceByRace[idRace] || [];
    const ageSemaines = Math.floor(ageJours / 7);
    let poids = 0;
    for (const c of croissanceData) {
      if (c.Semaine <= ageSemaines) {
        poids += Number(c.Poids);
      }
    }
    return poids;
  }

  // Calcul du profit cumulé par semaine pour un poulet
  // Retourne un tableau [{semaine, poidsCumul, coutCumul, valeur, profit, gainMarginal}]
  static calculerProfitParSemaine(croissanceData, prixPoussin, prixNourritureGramme, prixVenteGramme) {
    let poidsCumul = 0;
    let coutCumul = prixPoussin;
    const resultats = [];

    for (const c of croissanceData) {
      const semaine = c.Semaine;
      poidsCumul += Number(c.Poids);

      if (semaine > 0) {
        coutCumul += Number(c.Nourriture) * 7 * prixNourritureGramme;
      }

      const valeur = poidsCumul * prixVenteGramme;
      const profit = valeur - coutCumul;
      const profitPrecedent = resultats.length > 0 ? resultats[resultats.length - 1].profit : 0;
      const gainMarginal = semaine === 0 ? 0 : profit - profitPrecedent;

      resultats.push({ semaine, poidsCumul, coutCumul, valeur, profit, gainMarginal });
    }

    return resultats;
  }

  // Identifier le meilleur moment de vente
  // Logique : vendre quand le gain marginal d'une semaine supplémentaire devient trop faible
  static calculerMeilleurMomentVente(croissanceData, prixPoussin, prixNourritureGramme, prixVenteGramme) {
    if (!croissanceData || croissanceData.length <= 1) {
      return { semaineOptimale: 0, raison: 'Aucune donnée' };
    }

    const profils = Dashboard.calculerProfitParSemaine(
      croissanceData, prixPoussin, prixNourritureGramme, prixVenteGramme
    );

    let semaineOptimale = profils[profils.length - 1].semaine;
    let raison = 'Profit croissant';
    let details = '';

    for (let i = 1; i < profils.length; i++) {
      const p = profils[i];
      const pPrec = profils[i - 1];

      // Gain marginal négatif = on perd de l'argent, vendre la semaine d'avant
      if (p.gainMarginal < 0) {
        semaineOptimale = pPrec.semaine;
        raison = 'Coût > gain';
        details = `S${p.semaine}: perte de ${Math.abs(Math.round(p.gainMarginal))} Ar`;
        break;
      }

      // Gain marginal < 5% du profit actuel et profit positif = ça ne vaut plus la peine
      if (p.profit > 0 && p.gainMarginal < p.profit * 0.05) {
        semaineOptimale = p.semaine;
        raison = 'Gain marginal faible';
        details = `S${p.semaine}: +${Math.round(p.gainMarginal)} Ar (${(p.gainMarginal / p.profit * 100).toFixed(1)}%)`;
        break;
      }
    }

    // Ajouter le profit estimé à la semaine optimale
    const profilOptimal = profils.find(p => p.semaine === semaineOptimale);
    if (profilOptimal) {
      const poidsInfo = `${profilOptimal.poidsCumul}g`;
      const profitInfo = `${Math.round(profilOptimal.profit)} Ar`;
      details = details
        ? `${details} | Poids: ${poidsInfo}, Profit: ${profitInfo}`
        : `Poids: ${poidsInfo}, Profit: ${profitInfo}`;
    }

    return { semaineOptimale, raison, details };
  }

  static async getLotReportByDate(date) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const [lots, allCroissance, allMortaliteEvents, mortTotals, ventePouletTotals, venteOeufTotals, stockOeufRows] = await Promise.all([
        Dashboard.query(pool, `
          SELECT l.Id, l.Nom, l.Nombre, l.Arriver, l.Sortie, l.IdRace,
                 r.Nom AS NomRace, ISNULL(l.PrixPoussinUnit, r.Poussin) AS PrixPoussinsUnitaire,
                 r.Nourriture AS PrixNourritureGramme,
                 r.Vente AS PrixVenteGramme, r.Oeuf AS PrixOeufPiece,
                 DATEDIFF(DAY, l.Arriver, @date) AS AgeJours
          FROM Lot l
          INNER JOIN Race r ON r.Id = l.IdRace
          ORDER BY l.Id
        `, [{ name: 'date', type: sql.Date, value: date }]),

        Dashboard.query(pool, `SELECT * FROM Croissance ORDER BY IdRace, Semaine ASC`),

        Dashboard.query(pool, `
          SELECT m.IdLot, DATEDIFF(DAY, l.Arriver, m.Date) AS DayOffset, m.Nombre
          FROM Mortalite m
          INNER JOIN Lot l ON l.Id = m.IdLot
          WHERE m.Date <= @date
          ORDER BY m.Date
        `, [{ name: 'date', type: sql.Date, value: date }]),

        Dashboard.query(pool, `
          SELECT IdLot, ISNULL(SUM(Nombre), 0) AS Mort
          FROM Mortalite WHERE Date <= @date
          GROUP BY IdLot
        `, [{ name: 'date', type: sql.Date, value: date }]),

        Dashboard.query(pool, `
          SELECT IdLot, ISNULL(SUM(Montant), 0) AS PrixVente
          FROM VentePoulet WHERE Date <= @date
          GROUP BY IdLot
        `, [{ name: 'date', type: sql.Date, value: date }]),

        Dashboard.query(pool, `
          SELECT p.IdLot, ISNULL(SUM(v.Montant), 0) AS VenteOeuf
          FROM VenteOeuf v
          INNER JOIN Pondage p ON p.Id = v.IdPondage
          WHERE v.Date <= @date
          GROUP BY p.IdLot
        `, [{ name: 'date', type: sql.Date, value: date }]),

        Dashboard.query(pool, `
          SELECT
            l.Id AS IdLot,
            (ISNULL(pond.TotalPondu, 0)
              - ISNULL(inc.OeufsIncubes, 0)
              - ISNULL(vente.OeufsVendus, 0)) * r.Oeuf AS ValeurEstimee
          FROM Lot l
          INNER JOIN Race r ON r.Id = l.IdRace
          LEFT JOIN (
            SELECT IdLot, SUM(Oeufs) AS TotalPondu
            FROM Pondage WHERE Date <= @date GROUP BY IdLot
          ) pond ON pond.IdLot = l.Id
          LEFT JOIN (
            SELECT p.IdLot, SUM(p.Oeufs) AS OeufsIncubes
            FROM Pondage p
            INNER JOIN Incubation i ON i.IdPondage = p.Id
            WHERE i.Date <= @date
            GROUP BY p.IdLot
          ) inc ON inc.IdLot = l.Id
          LEFT JOIN (
            SELECT p.IdLot, SUM(vo.Nombre) AS OeufsVendus
            FROM VenteOeuf vo
            INNER JOIN Pondage p ON p.Id = vo.IdPondage
            WHERE vo.Date <= @date
            GROUP BY p.IdLot
          ) vente ON vente.IdLot = l.Id
        `, [{ name: 'date', type: sql.Date, value: date }]),
      ]);

      const croissanceByRace = {};
      for (const c of allCroissance) {
        if (!croissanceByRace[c.IdRace]) croissanceByRace[c.IdRace] = [];
        croissanceByRace[c.IdRace].push(c);
      }

      // Index mortalité events par lot
      const mortaliteByLot = {};
      for (const m of allMortaliteEvents) {
        if (!mortaliteByLot[m.IdLot]) mortaliteByLot[m.IdLot] = [];
        mortaliteByLot[m.IdLot].push(m);
      }

      // Index les totaux
      const mortByLot = Dashboard.toMap(mortTotals);
      const ventePouletByLot = Dashboard.toMap(ventePouletTotals);
      const venteOeufByLot = Dashboard.toMap(venteOeufTotals);
      const stockByLot = Dashboard.toMap(stockOeufRows);

      // Calcul pour chaque lot (tout en mémoire, pas de requête supplémentaire)
      const results = lots.map((lot) => {
        const ageJours = Math.max(0, lot.AgeJours);
        const poidsMoyen = Dashboard.getPoidsMoyen(lot.IdRace, ageJours, croissanceByRace);
        const prixPoussin = lot.Nombre * lot.PrixPoussinsUnitaire;
        const prixNourriture = Dashboard.calculerCoutNourriture(lot, ageJours, croissanceByRace, mortaliteByLot);

        // Calcul du meilleur moment de vente (par poulet unitaire)
        const croissanceData = croissanceByRace[lot.IdRace] || [];
        const meilleurMoment = Dashboard.calculerMeilleurMomentVente(
          croissanceData,
          lot.PrixPoussinsUnitaire,
          lot.PrixNourritureGramme,
          lot.PrixVenteGramme
        );

        const mort = mortByLot[lot.Id] || {};
        const vp = ventePouletByLot[lot.Id] || {};
        const vo = venteOeufByLot[lot.Id] || {};
        const stock = stockByLot[lot.Id] || {};

        const totalMort = Number(mort.Mort || 0);
        const vivants = lot.Nombre - totalMort;
        const prixVente = Number(vp.PrixVente || 0);
        const prixOeuf = Number(stock.ValeurEstimee || 0);
        const venteOeufCommerciale = Number(vo.VenteOeuf || 0);
        const valeurEstimeePoulet = vivants * poidsMoyen * lot.PrixVenteGramme;
        const depense = prixPoussin + prixNourriture;
        const valeurEstimee = valeurEstimeePoulet + prixOeuf;
        const valeurCommerciale = prixVente + venteOeufCommerciale;
        const beneficeCommercial = valeurCommerciale - depense;
        const beneficeEstime = valeurEstimee - depense;

        return {
          Id: lot.Id,
          Lot: lot.Nom,
          PrixPoussin: prixPoussin,
          PrixNourriture: prixNourriture,
          Mort: totalMort,
          PoidsMoyen: poidsMoyen,
          Depense: depense,
          ValeurEstimeePoulet: valeurEstimeePoulet,
          ValeurEstimeeOeuf: prixOeuf,
          VentePoulet: prixVente,
          VenteOeuf: venteOeufCommerciale,
          BeneficeCommercial: beneficeCommercial,
          BeneficeEstime: beneficeEstime,
          MeilleurMomentVente: meilleurMoment.semaineOptimale,
          RaisonMeilleurMoment: meilleurMoment.raison,
        };
      });

      return results;
    } finally {
      await pool.close();
    }
  }


  static async getLotReportDetailByDate(lotId, date) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();

      const [lotRows, croissanceRows, mortaliteEvents, mortDetail, ventePouletDetail, venteOeufDetail, stockRows, incubation] = await Promise.all([
        Dashboard.query(pool, `
          SELECT l.Id, l.Nom AS Lot, l.Nombre, l.Arriver, l.IdRace,
                 r.Nom AS Race, ISNULL(l.PrixPoussinUnit, r.Poussin) AS PrixPoussinsUnitaire,
                 r.Nourriture AS PrixNourritureGramme,
                 r.Vente AS PrixVenteGramme,
                 DATEDIFF(DAY, l.Arriver, @date) AS AgeJours
          FROM Lot l
          INNER JOIN Race r ON r.Id = l.IdRace
          WHERE l.Id = @lotId
        `, [
          { name: 'lotId', type: sql.Int, value: lotId },
          { name: 'date', type: sql.Date, value: date },
        ]),

        Dashboard.query(pool, `
          SELECT Semaine, Poids, Nourriture FROM Croissance
          WHERE IdRace = (SELECT IdRace FROM Lot WHERE Id = @lotId)
          ORDER BY Semaine ASC
        `, [{ name: 'lotId', type: sql.Int, value: lotId }]),

        Dashboard.query(pool, `
          SELECT DATEDIFF(DAY, l.Arriver, m.Date) AS DayOffset, m.Nombre
          FROM Mortalite m
          INNER JOIN Lot l ON l.Id = m.IdLot
          WHERE m.IdLot = @lotId AND m.Date <= @date
          ORDER BY m.Date
        `, [
          { name: 'lotId', type: sql.Int, value: lotId },
          { name: 'date', type: sql.Date, value: date },
        ]),

        Dashboard.query(pool, `
          SELECT
            ISNULL(SUM(CASE WHEN Date = @date THEN Nombre ELSE 0 END), 0) AS MortJour,
            ISNULL(SUM(Nombre), 0) AS MortCumul
          FROM Mortalite
          WHERE IdLot = @lotId AND Date <= @date
        `, [
          { name: 'lotId', type: sql.Int, value: lotId },
          { name: 'date', type: sql.Date, value: date },
        ]),

        Dashboard.query(pool, `
          SELECT
            ISNULL(SUM(CASE WHEN Date = @date THEN Montant ELSE 0 END), 0) AS VentePouletJour,
            ISNULL(SUM(Montant), 0) AS VentePouletCumul
          FROM VentePoulet
          WHERE IdLot = @lotId AND Date <= @date
        `, [
          { name: 'lotId', type: sql.Int, value: lotId },
          { name: 'date', type: sql.Date, value: date },
        ]),

        Dashboard.query(pool, `
          SELECT
            ISNULL(SUM(CASE WHEN vo.Date = @date THEN vo.Montant ELSE 0 END), 0) AS VenteOeufJour,
            ISNULL(SUM(vo.Montant), 0) AS VenteOeufCumul
          FROM VenteOeuf vo
          INNER JOIN Pondage p ON p.Id = vo.IdPondage
          WHERE p.IdLot = @lotId AND vo.Date <= @date
        `, [
          { name: 'lotId', type: sql.Int, value: lotId },
          { name: 'date', type: sql.Date, value: date },
        ]),

        Dashboard.query(pool, `
          SELECT
            (ISNULL(pond.TotalPondu, 0)
              - ISNULL(inc.OeufsIncubes, 0)
              - ISNULL(vente.OeufsVendus, 0)) AS StockTotal,
            (ISNULL(pond.TotalPondu, 0)
              - ISNULL(inc.OeufsIncubes, 0)
              - ISNULL(vente.OeufsVendus, 0)) * r.Oeuf AS ValeurEstimee
          FROM Lot l
          INNER JOIN Race r ON r.Id = l.IdRace
          LEFT JOIN (
            SELECT IdLot, SUM(Oeufs) AS TotalPondu
            FROM Pondage WHERE IdLot = @lotId AND Date <= @date GROUP BY IdLot
          ) pond ON pond.IdLot = l.Id
          LEFT JOIN (
            SELECT p.IdLot, SUM(p.Oeufs) AS OeufsIncubes
            FROM Pondage p
            INNER JOIN Incubation i ON i.IdPondage = p.Id
            WHERE p.IdLot = @lotId AND i.Date <= @date
            GROUP BY p.IdLot
          ) inc ON inc.IdLot = l.Id
          LEFT JOIN (
            SELECT p.IdLot, SUM(vo.Nombre) AS OeufsVendus
            FROM VenteOeuf vo
            INNER JOIN Pondage p ON p.Id = vo.IdPondage
            WHERE p.IdLot = @lotId AND vo.Date <= @date
            GROUP BY p.IdLot
          ) vente ON vente.IdLot = l.Id
          WHERE l.Id = @lotId
        `, [
          { name: 'lotId', type: sql.Int, value: lotId },
          { name: 'date', type: sql.Date, value: date },
        ]),

        Incubation.getIncubationDetails(lotId, date),
      ]);

      const base = lotRows[0];
      if (!base) return null;

      const ageJours = Math.max(0, base.AgeJours);

      // Poids moyen = somme semaine 0 + gains hebdomadaires
      const croissanceByRace = { [base.IdRace]: croissanceRows };
      const poidsMoyen = Dashboard.getPoidsMoyen(base.IdRace, ageJours, croissanceByRace);

      // Meilleur moment de vente
      const meilleurMoment = Dashboard.calculerMeilleurMomentVente(
        croissanceRows,
        base.PrixPoussinsUnitaire,
        base.PrixNourritureGramme,
        base.PrixVenteGramme
      );

      // Coût nourriture
      const mortaliteByLot = { [base.Id]: mortaliteEvents };
      const prixNourriture = Dashboard.calculerCoutNourriture(base, ageJours, croissanceByRace, mortaliteByLot);

      const prixPoussin = base.Nombre * base.PrixPoussinsUnitaire;
      const depenseTotale = prixPoussin + prixNourriture;

      const mort = mortDetail[0] || {};
      const vp = ventePouletDetail[0] || {};
      const vo = venteOeufDetail[0] || {};
      const stock = stockRows[0] || {};

      const ventePouletCumul = Number(vp.VentePouletCumul || 0);
      const venteOeufCumul = Number(vo.VenteOeufCumul || 0);
      const prixOeuf = Number(stock.ValeurEstimee || 0);
      const totalPoussinsEclos = Number(incubation?.TotalPoussinsEclos || 0);
      const totalOeufsIncubes = Number(incubation?.TotalOeufsIncubes || 0);

      const mortCumul = Number(mort.MortCumul || 0);
      const vivants = base.Nombre - mortCumul;
      const valeurEstimeePoulet = vivants * poidsMoyen * (base.PrixVenteGramme || 0);
      const valeurEstimee = valeurEstimeePoulet + prixOeuf;
      const valeurCommerciale = ventePouletCumul + venteOeufCumul;

      return {
        Id: base.Id,
        Lot: base.Lot,
        Race: base.Race,
        PoidsMoyen: poidsMoyen,
        PrixPoussin: prixPoussin,
        PrixNourriture: prixNourriture,
        Depense: depenseTotale,
        MortJour: Number(mort.MortJour || 0),
        MortCumul: mortCumul,
        VentePouletJour: Number(vp.VentePouletJour || 0),
        VentePouletCumul: ventePouletCumul,
        VenteOeufJour: Number(vo.VenteOeufJour || 0),
        VenteOeufCumul: venteOeufCumul,
        StockOeufTotal: Number(stock.StockTotal || 0),
        PrixOeuf: prixOeuf,
        ValeurEstimeePoulet: valeurEstimeePoulet,
        ValeurEstimee: valeurEstimee,
        ValeurCommerciale: valeurCommerciale,
        NbIncubations: Number(incubation?.NbIncubations || 0),
        TotalPoussinsEclos: totalPoussinsEclos,
        OeufsPerdusIncubation: Math.max(0, totalOeufsIncubes - totalPoussinsEclos),
        BeneficeCommercial: valeurCommerciale - depenseTotale,
        BeneficeEstime: valeurEstimee - depenseTotale,
        MeilleurMomentVente: meilleurMoment.semaineOptimale,
        RaisonMeilleurMoment: meilleurMoment.raison,
        DetailsMeilleurMoment: meilleurMoment.details,
      };
    } finally {
      await pool.close();
    }
  }
}

module.exports = Dashboard;
