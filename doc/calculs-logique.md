# Resume des calculs et logique

## 1) Cout poussin
- Prix unitaire pousse par lot: `ISNULL(Lot.PrixPoussinUnit, Race.Poussin)`.
- Cout total poussins du lot: `PrixPoussin = NombreLot * PrixPoussinUnitaire`.
- Logique:
  - lot achete: `PrixPoussinUnit` est `NULL` => on prend `Race.Poussin`.
  - lot issu d'incubation: `PrixPoussinUnit = 0` => cout poussin = 0.

## 2) Cout nourriture
- Calcul journalier jusqu'a la date demandee.
- Formule jour par jour: `coutJour = VivantsJour * NourritureJour(g) * PrixNourritureGramme`.
- Cout total: somme de tous les `coutJour`.
- Logique:
  - la nourriture change par semaine selon `Croissance.Nourriture`.
  - la mortalite reduit `VivantsJour` a partir du jour de l'evenement.

## 3) Poids moyen (poids vif)
- `AgeSemaines = floor(AgeJours / 7)`.
- `PoidsMoyen = somme(Croissance.Poids)` de la semaine 0 a `AgeSemaines`.

## 4) Valeur estimee poulet
- `Vivants = NombreLot - MortCumul`.
- `ValeurEstimeePoulet = Vivants * PoidsMoyen * PrixVenteGramme`.

## 5) Stock d'oeufs et valeur oeufs
- `StockOeuf = TotalPondu - OeufsIncubes - OeufsVendus`.
- `ValeurEstimeeOeuf = StockOeuf * Race.Oeuf`.
- Logique incubation: quand un pondage est couve, tous les oeufs du pondage sont retires du stock.

## 6) Depenses, valeurs et benefices
- `Depense = PrixPoussin + PrixNourriture`.
- `ValeurEstimee = ValeurEstimeePoulet + ValeurEstimeeOeuf`.
- `ValeurCommerciale = VentePouletCumulee + VenteOeufCumulee`.
- `BeneficeEstime = ValeurEstimee - Depense`.
- `BeneficeCommercial = ValeurCommerciale - Depense`.

## 7) Meilleur moment de vente (simulation)
- Simulation par semaine (un poulet):
  - `CoutCumule` part de `PrixPoussin`, puis ajoute la nourriture hebdo.
  - `Valeur = PoidsCumule * PrixVenteGramme`.
  - `Profit = Valeur - CoutCumule`.
  - `GainMarginal = Profit(semaine) - Profit(semaine-1)`.
- Regles:
  - si `GainMarginal < 0` => vendre la semaine precedente.
  - si `GainMarginal < 5%` du profit courant (profit > 0) => vendre cette semaine.
  - sinon: profit encore croissant.
