const sql = require('mssql');
const db = require('../config/db');

class StockOeuf {
  // Resume: stock calculé en temps réel par lot
  static async getStockResume() {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request().query(`
        SELECT
          l.Id        AS IdLot,
          l.Nom       AS NomLot,
          r.Nom       AS NomRace,
          r.Oeuf      AS PrixOeuf,
          ISNULL(pond.TotalPondu, 0)   AS TotalPondu,
          ISNULL(inc.OeufsIncubes, 0)  AS OeufsIncubes,
          ISNULL(vente.OeufsVendus, 0) AS OeufsVendus,
          ISNULL(pond.TotalPondu, 0)
            - ISNULL(inc.OeufsIncubes, 0)
            - ISNULL(vente.OeufsVendus, 0) AS StockDisponible,
          (ISNULL(pond.TotalPondu, 0)
            - ISNULL(inc.OeufsIncubes, 0)
            - ISNULL(vente.OeufsVendus, 0)) * r.Oeuf AS ValeurEstimee
        FROM Lot l
        INNER JOIN Race r ON r.Id = l.IdRace
        LEFT JOIN (
          SELECT IdLot, SUM(Oeufs) AS TotalPondu
          FROM Pondage GROUP BY IdLot
        ) pond ON pond.IdLot = l.Id
        LEFT JOIN (
          SELECT p.IdLot, SUM(p.Oeufs) AS OeufsIncubes
          FROM Pondage p
          INNER JOIN Incubation i ON i.IdPondage = p.Id
          GROUP BY p.IdLot
        ) inc ON inc.IdLot = l.Id
        LEFT JOIN (
          SELECT p.IdLot, SUM(vo.Nombre) AS OeufsVendus
          FROM VenteOeuf vo
          INNER JOIN Pondage p ON p.Id = vo.IdPondage
          GROUP BY p.IdLot
        ) vente ON vente.IdLot = l.Id
        WHERE ISNULL(pond.TotalPondu, 0) > 0
        ORDER BY l.Nom
      `);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  // Détail des mouvements pour un lot
  static async getStockDetail(idLot) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();

      const pondages = await pool.request()
        .input('idLot', sql.Int, idLot)
        .query(`
          SELECT p.Id, p.Date, p.Oeufs,
            CASE WHEN EXISTS (SELECT 1 FROM Incubation i WHERE i.IdPondage = p.Id)
              THEN 1 ELSE 0 END AS Incube,
            (SELECT ISNULL(SUM(vo.Nombre),0) FROM VenteOeuf vo WHERE vo.IdPondage = p.Id) AS OeufsVendus
          FROM Pondage p
          WHERE p.IdLot = @idLot
          ORDER BY p.Date DESC
        `);

      const incubations = await pool.request()
        .input('idLot', sql.Int, idLot)
        .query(`
          SELECT i.Id, i.Date, i.Poussins, p.Oeufs AS OeufsUtilises, p.Date AS DatePondage
          FROM Incubation i
          INNER JOIN Pondage p ON p.Id = i.IdPondage
          WHERE p.IdLot = @idLot
          ORDER BY i.Date DESC
        `);

      const ventes = await pool.request()
        .input('idLot', sql.Int, idLot)
        .query(`
          SELECT vo.Id, vo.Date, vo.Nombre, vo.Montant, p.Date AS DatePondage
          FROM VenteOeuf vo
          INNER JOIN Pondage p ON p.Id = vo.IdPondage
          WHERE p.IdLot = @idLot
          ORDER BY vo.Date DESC
        `);

      return {
        pondages: pondages.recordset,
        incubations: incubations.recordset,
        ventes: ventes.recordset
      };
    } finally {
      await pool.close();
    }
  }

  // Recalcule et met à jour le StockOeuf pour un lot à la date du jour
  static async recalculateStock(idLot) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const today = new Date().toISOString().slice(0, 10);

      const result = await pool.request()
        .input('idLot', sql.Int, idLot)
        .query(`
          SELECT
            ISNULL(
              (SELECT SUM(Oeufs) FROM Pondage WHERE IdLot = @idLot), 0
            )
            - ISNULL(
              (SELECT SUM(p.Oeufs)
               FROM Pondage p INNER JOIN Incubation i ON i.IdPondage = p.Id
               WHERE p.IdLot = @idLot), 0
            )
            - ISNULL(
              (SELECT SUM(vo.Nombre)
               FROM VenteOeuf vo INNER JOIN Pondage p ON p.Id = vo.IdPondage
               WHERE p.IdLot = @idLot), 0
            ) AS StockDisponible,
            ISNULL((SELECT r.Oeuf FROM Race r INNER JOIN Lot l ON l.IdRace = r.Id WHERE l.Id = @idLot), 0) AS PrixOeuf
        `);

      const stock = Math.max(0, result.recordset[0].StockDisponible);
      const prix = result.recordset[0].PrixOeuf;
      const valeur = Number((stock * prix).toFixed(2));

      await pool.request()
        .input('date', sql.Date, today)
        .input('idLot', sql.Int, idLot)
        .input('stockTotal', sql.Int, stock)
        .input('valeurEstimee', sql.Decimal(10, 2), valeur)
        .query(`
          IF EXISTS (SELECT 1 FROM StockOeuf WHERE Date = @date AND IdLot = @idLot)
          BEGIN
            UPDATE StockOeuf
            SET StockTotal = @stockTotal, ValeurEstimee = @valeurEstimee
            WHERE Date = @date AND IdLot = @idLot;
          END
          ELSE
          BEGIN
            INSERT INTO StockOeuf (Date, IdLot, StockTotal, ValeurEstimee)
            VALUES (@date, @idLot, @stockTotal, @valeurEstimee);
          END
        `);

      return { idLot, stockTotal: stock, valeurEstimee: valeur };
    } finally {
      await pool.close();
    }
  }

  static async getAll() {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request().query(`
        SELECT s.*, l.Nom as NomLot, r.Nom as NomRace
        FROM StockOeuf s
        LEFT JOIN Lot l ON l.Id = s.IdLot
        LEFT JOIN Race r ON r.Id = l.IdRace
        ORDER BY s.Date DESC, s.Id DESC
      `);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getLastByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT TOP 1 * FROM StockOeuf WHERE IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      query += ` ORDER BY Date DESC, Id DESC`;
      const result = await request.query(query);
      return result.recordset[0] || { StockTotal: 0, ValeurEstimee: 0 };
    } finally {
      await pool.close();
    }
  }

  static async getByLotAndDate(idLot, date) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idLot', sql.Int, idLot)
        .input('date', sql.Date, date)
        .query(`
          SELECT TOP 1 * FROM StockOeuf 
          WHERE IdLot = @idLot AND Date = @date
          ORDER BY Id DESC
        `);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }
}

module.exports = StockOeuf;
