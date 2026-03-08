CREATE TABLE Race(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nom NVARCHAR(50) NOT NULL,
    Nourriture DECIMAL(10,2) NOT NULL CHECK(Nourriture >= 0),
    Vente DECIMAL(10,2) NOT NULL CHECK(Vente >= 0),
    Oeuf DECIMAL(10,2) NOT NULL CHECK(Oeuf >= 0),
    Poussin DECIMAL(10,2) NOT NULL CHECK(Poussin >= 0)
);

CREATE TABLE Lot(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nom NVARCHAR(50) NOT NULL,
    IdRace INT NOT NULL,
    Nombre INT NOT NULL CHECK(Nombre >= 0),
    Arriver DATE NOT NULL,
    Sortie DATE,
    PoidsMoyen DECIMAL(10,2) DEFAULT 0 CHECK(PoidsMoyen >= 0), -- somme poids ao am croissance
    PrixPoussinUnit DECIMAL(10,2) NULL, -- prix unitaire poussin (NULL = Race.Poussin, sinon valeur calculée pour incubation)
    FOREIGN KEY (IdRace) REFERENCES Race(Id),
    CHECK (Sortie IS NULL OR Sortie >= Arriver)
);

CREATE TABLE Mortalite(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL,
    IdLot INT NOT NULL,
    Nombre INT NOT NULL CHECK(Nombre > 0),
    FOREIGN KEY (IdLot) REFERENCES Lot(Id)
);

CREATE TABLE Croissance(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Semaine INT NOT NULL CHECK(Semaine >= 0),
    IdRace INT NOT NULL,
    Poids DECIMAL(10,2) NOT NULL CHECK(Poids >= 0),
    Nourriture DECIMAL(10,2) NOT NULL CHECK(Nourriture >= 0),
    FOREIGN KEY (IdRace) REFERENCES Race(Id),
    UNIQUE(Semaine, IdRace)
);

CREATE TABLE Pondage(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL,
    IdLot INT NOT NULL,
    Oeufs INT NOT NULL CHECK(Oeufs > 0),
    FOREIGN KEY (IdLot) REFERENCES Lot(Id)
);

CREATE TABLE StockOeuf(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL,
    IdLot INT NOT NULL,
    StockTotal INT NOT NULL CHECK(StockTotal >= 0),
    ValeurEstimee DECIMAL(10,2) NOT NULL CHECK(ValeurEstimee >= 0),
    FOREIGN KEY (IdLot) REFERENCES Lot(Id),
    UNIQUE(Date, IdLot)
);

CREATE TABLE Incubation(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL,
    IdPondage INT NOT NULL,
    Poussins INT DEFAULT 0 CHECK(Poussins >= 0),
    FOREIGN KEY (IdPondage) REFERENCES Pondage(Id)
);

CREATE TABLE VentePoulet(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL,
    IdLot INT NOT NULL,
    Nombre INT NOT NULL CHECK(Nombre > 0),
    Montant DECIMAL(10,2) NOT NULL CHECK(Montant >= 0),
    FOREIGN KEY (IdLot) REFERENCES Lot(Id)
);

CREATE TABLE VenteOeuf(
    Id INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL,
    IdPondage INT NOT NULL,
    Nombre INT NOT NULL CHECK(Nombre > 0),
    Montant DECIMAL(10,2) NOT NULL CHECK(Montant >= 0),
    FOREIGN KEY (IdPondage) REFERENCES Pondage(Id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IX_Lot_IdRace ON Lot(IdRace);
CREATE INDEX IX_Lot_Arriver ON Lot(Arriver);
CREATE INDEX IX_Mortalite_Date ON Mortalite(Date);
CREATE INDEX IX_Mortalite_IdLot ON Mortalite(IdLot);
CREATE INDEX IX_Croissance_IdRace ON Croissance(IdRace);
CREATE INDEX IX_Pondage_Date ON Pondage(Date);
CREATE INDEX IX_Pondage_IdLot ON Pondage(IdLot);
CREATE INDEX IX_Incubation_Date ON Incubation(Date);
CREATE INDEX IX_Incubation_IdPondage ON Incubation(IdPondage);
CREATE INDEX IX_StockOeuf_Date ON StockOeuf(Date);
CREATE INDEX IX_StockOeuf_IdLot ON StockOeuf(IdLot);
CREATE INDEX IX_VentePoulet_Date ON VentePoulet(Date);
CREATE INDEX IX_VentePoulet_IdLot ON VentePoulet(IdLot);
CREATE INDEX IX_VenteOeuf_Date ON VenteOeuf(Date);
CREATE INDEX IX_VenteOeuf_IdPondage ON VenteOeuf(IdPondage);