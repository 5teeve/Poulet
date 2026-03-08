
-- ============================================================
-- SEED DATA - Elevage de poulets (Devise: Ar, Poids: g, Année: 2026)
-- ============================================================

-- Races avec prix réalistes en Ariary
-- Nourriture = coût par gramme de nourriture (Ar/g)
-- Vente = prix de vente par gramme de poulet vivant (Ar/g)
-- Oeuf = prix unitaire d'un oeuf (Ar)
-- Poussin = prix d'achat d'un poussin d'un jour (Ar)
INSERT INTO Race (Nom, Nourriture, Vente, Oeuf, Poussin) VALUES
('Poulet de chair', 3.00, 12.00, 600.00, 3500.00),
('Poulet pondeuse', 2.50, 10.00, 500.00, 4000.00),
('Poulet gasy', 2.00, 18.00, 800.00, 5000.00);

-- Lots d'élevage en 2026
INSERT INTO Lot (Nom, IdRace, Nombre, Arriver, Sortie, PoidsMoyen) VALUES
('Lot A - Chair', 1, 200, '2026-01-05', NULL, NULL),
('Lot B - Pondeuse', 2, 150, '2026-01-15', NULL, NULL),
('Lot C - Gasy', 3, 80, '2026-02-01', NULL, NULL);

-- Suivi de croissance par race
-- Poids = gain de poids hebdomadaire par poulet (g)
-- Semaine 0 = poids du poussin (g)
-- Nourriture = quantite de nourriture mangee par poulet par jour (g/jour)
INSERT INTO Croissance (Semaine, IdRace, Poids, Nourriture) VALUES
-- Poulet de chair (Race 1)
(0, 1, 42, 0),
(1, 1, 118, 22),
(2, 1, 190, 38),
(3, 1, 250, 55),
(4, 1, 300, 75),
(5, 1, 300, 95),
(6, 1, 300, 110),
(7, 1, 250, 125),
(8, 1, 250, 135),
-- Poulet pondeuse (Race 2)
(0, 2, 38, 0),
(1, 2, 82, 18),
(2, 2, 130, 28),
(3, 2, 150, 40),
(4, 2, 180, 52),
(5, 2, 180, 65),
(6, 2, 190, 78),
(7, 2, 200, 90),
(8, 2, 250, 100),
-- Poulet gasy (Race 3)
(0, 3, 35, 0),
(1, 3, 75, 15),
(2, 3, 120, 24),
(3, 3, 170, 34),
(4, 3, 200, 45),
(5, 3, 220, 58),
(6, 3, 230, 70),
(7, 3, 250, 82),
(8, 3, 300, 95);

-- Pondage quotidien (production d'oeufs)
INSERT INTO Pondage (Date, IdLot, Oeufs) VALUES
-- Lot A - Chair : ponte faible (~15-25% de 200 poules)
('2026-02-16', 1, 35),
('2026-02-17', 1, 32),
('2026-02-18', 1, 38),
('2026-02-19', 1, 30),
('2026-02-20', 1, 34),
('2026-02-21', 1, 36),
('2026-02-22', 1, 33),
-- Lot B - Pondeuse : ponte élevée (~60-75% de 150 poules)
('2026-02-16', 2, 98),
('2026-02-17', 2, 105),
('2026-02-18', 2, 92),
('2026-02-19', 2, 110),
('2026-02-20', 2, 100),
('2026-02-21', 2, 95),
('2026-02-22', 2, 108),
-- Lot C - Gasy : ponte modérée (~20-30% de 80 poules)
('2026-02-16', 3, 18),
('2026-02-17', 3, 22),
('2026-02-18', 3, 16),
('2026-02-19', 3, 20),
('2026-02-20', 3, 24),
('2026-02-21', 3, 19),
('2026-02-22', 3, 21),
-- Mars 2026
('2026-03-01', 1, 37),
('2026-03-02', 1, 34),
('2026-03-03', 1, 31),
('2026-03-04', 1, 36),
('2026-03-05', 1, 33),
('2026-03-01', 2, 102),
('2026-03-02', 2, 108),
('2026-03-03', 2, 96),
('2026-03-04', 2, 112),
('2026-03-05', 2, 104),
('2026-03-01', 3, 20),
('2026-03-02', 3, 23),
('2026-03-03', 3, 17),
('2026-03-04', 3, 22),
('2026-03-05', 3, 19);

-- Incubation (certains oeufs mis en incubation)
INSERT INTO Incubation (Date, IdPondage, Poussins) VALUES
('2026-02-18', 1, 8),
('2026-02-18', 8, 25),
('2026-02-20', 17, 5),
('2026-03-02', 24, 10),
('2026-03-03', 30, 22);

-- Stock d'oeufs
INSERT INTO StockOeuf (Date, IdLot, StockTotal, ValeurEstimee) VALUES
('2026-02-22', 1, 180, 108000.00),
('2026-02-22', 2, 520, 260000.00),
('2026-02-22', 3, 105, 84000.00),
('2026-03-05', 1, 310, 186000.00),
('2026-03-05', 2, 890, 445000.00),
('2026-03-05', 3, 185, 148000.00);

-- Mortalité
INSERT INTO Mortalite (Date, IdLot, Nombre) VALUES
-- Lot A - Chair (200 initial) : ~3% mortalité les premières semaines
('2026-01-08', 1, 2),
('2026-01-15', 1, 1),
('2026-01-28', 1, 3),
('2026-02-10', 1, 1),
('2026-02-25', 1, 2),
('2026-03-05', 1, 1),
-- Lot B - Pondeuse (150 initial)
('2026-01-18', 2, 1),
('2026-01-30', 2, 2),
('2026-02-12', 2, 1),
('2026-02-28', 2, 1),
-- Lot C - Gasy (80 initial) : plus résistant
('2026-02-08', 3, 1),
('2026-02-22', 3, 1),
('2026-03-04', 3, 1);

-- Ventes de poulets
INSERT INTO VentePoulet (Date, IdLot, Nombre, Montant) VALUES
-- Lot A : poulets de chair vendus à ~2000g x 12 Ar/g = 24 000 Ar/poulet
('2026-03-01', 1, 20, 480000.00),
('2026-03-03', 1, 15, 360000.00),
('2026-03-05', 1, 30, 720000.00),
-- Lot C : poulets gasy vendus à ~1600g x 18 Ar/g = 28 800 Ar/poulet
('2026-03-02', 3, 10, 288000.00),
('2026-03-04', 3, 5, 144000.00);

-- Ventes d'oeufs
INSERT INTO VenteOeuf (Date, IdPondage, Nombre, Montant) VALUES
-- Oeufs de chair à 600 Ar/oeuf
('2026-02-20', 3, 30, 18000.00),
('2026-03-01', 24, 25, 15000.00),
-- Oeufs de pondeuse à 500 Ar/oeuf
('2026-02-20', 10, 60, 30000.00),
('2026-02-22', 14, 80, 40000.00),
('2026-03-02', 30, 50, 25000.00),
-- Oeufs gasy à 800 Ar/oeuf
('2026-02-21', 20, 15, 12000.00),
('2026-03-03', 34, 12, 9600.00);

-- Vérification des données
SELECT 'Races créées:' as Info;
SELECT * FROM Race;

SELECT 'Lots créés:' as Info;
SELECT l.*, r.Nom as NomRace FROM Lot l JOIN Race r ON l.IdRace = r.Id;

SELECT 'Croissance créée:' as Info;
SELECT sc.*, r.Nom as NomRace FROM Croissance sc JOIN Race r ON sc.IdRace = r.Id ORDER BY r.Nom, sc.Semaine;

SELECT 'Pondages créés:' as Info;
SELECT p.*, l.Nom as NomLot FROM Pondage p JOIN Lot l ON p.IdLot = l.Id ORDER BY p.Date;

SELECT 'Mortalité créée:' as Info;
SELECT m.*, l.Nom as NomLot FROM Mortalite m JOIN Lot l ON m.IdLot = l.Id ORDER BY l.Nom, m.Date;

SELECT 'Ventes poulet créées:' as Info;
SELECT v.*, l.Nom as NomLot FROM VentePoulet v JOIN Lot l ON v.IdLot = l.Id ORDER BY v.Date;

SELECT 'Ventes oeuf créées:' as Info;
SELECT vo.*, p.Date as DatePondage FROM VenteOeuf vo JOIN Pondage p ON vo.IdPondage = p.Id ORDER BY vo.Date;

SELECT 'Incubations créées:' as Info;
SELECT i.*, p.Date as DatePondage, p.Oeufs as NbOeufs FROM Incubation i JOIN Pondage p ON i.IdPondage = p.Id;

SELECT 'Stock oeufs créé:' as Info;
SELECT so.*, l.Nom as NomLot FROM StockOeuf so JOIN Lot l ON so.IdLot = l.Id ORDER BY so.Date;

PRINT 'Données réalistes insérées avec succès (Ar, g, 2026) !';