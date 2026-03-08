const sql = require('mssql');
const db = require('../config/db');
const StockOeuf = require('./StockOeuf');

class Pondage{
    static async create(date, idLot, oeufs){
        const pool = new sql.ConnectionPool(db);
        let connection = null;
        try{
            connection = await pool.connect();
            const request = connection.request();
            request.input('date', sql.Date, date);
            request.input('idLot', sql.Int, idLot);
            request.input('oeufs', sql.Int, oeufs);
            const result = await request.query(
                `INSERT INTO Pondage (Date, IdLot, Oeufs) 
                 VALUES (@date, @idLot, @oeufs);
                 SELECT @@IDENTITY as id;`
            );
            // Recalcul du stock après ajout d'un pondage
            await StockOeuf.recalculateStock(idLot);
            return result.recordset[0];
        } catch (error) {
            console.error('Error in Pondage.create:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }

    static async getAll() {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            const result = await pool.request().query('SELECT * FROM Pondage');
            return result.recordset;
        } finally {
            await pool.close();
        }
    }

    static async getById(id) {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM Pondage WHERE Id = @id');
            return result.recordset[0];
        } finally {
            await pool.close();
        }
    }

    static async delete(id) {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            // Récupérer le IdLot avant suppression pour recalculer le stock
            const pondage = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT IdLot FROM Pondage WHERE Id = @id');
            const idLot = pondage.recordset[0]?.IdLot;

            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Pondage WHERE Id = @id');

            if (idLot) {
                await StockOeuf.recalculateStock(idLot);
            }
            return { success: true, id };
        } finally {
            await pool.close();
        }
    }

    static async getByLot(idLot) {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            const result = await pool.request()
                .input('idLot', sql.Int, idLot)
                .query('SELECT * FROM Pondage WHERE IdLot = @idLot');
            return result.recordset;
        } finally {
            await pool.close();
        }
    }

    static async getByDate(date) {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            const result = await pool.request()
                .input('date', sql.Date, date)
                .query('SELECT * FROM Pondage WHERE Date = @date');
            return result.recordset;
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
                .query('SELECT * FROM Pondage WHERE IdLot = @idLot AND Date = @date');
            return result.recordset[0];
        } finally {
            await pool.close();
        }
    }

    static async getDateRange(startDate, endDate) {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            const result = await pool.request()
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query('SELECT * FROM Pondage WHERE Date BETWEEN @startDate AND @endDate');
            return result.recordset;
        } finally {
            await pool.close();
        }
    }

    static async getTotalOeufsByLot(idLot, date = null) {
        const pool = new sql.ConnectionPool(db);
        try {
            await pool.connect();
            let query = `SELECT ISNULL(SUM(Oeufs), 0) AS TotalOeufs FROM Pondage WHERE IdLot = @idLot`;
            const request = pool.request().input('idLot', sql.Int, idLot);
            
            if (date) {
                query += ` AND Date <= @date`;
                request.input('date', sql.Date, date);
            }
            
            const result = await request.query(query);
            return result.recordset[0]?.TotalOeufs || 0;
        } finally {
            await pool.close();
        }
    }

    static async couver(idPondage, nombrePoussins, nomLot) {
        const pool = new sql.ConnectionPool(db);
        let connection = null;
        let transaction = null;

        try {
            if (!idPondage || !Number.isInteger(idPondage) || idPondage <= 0) {
                throw new Error('Pondage invalide');
            }
            if (!Number.isInteger(nombrePoussins) || nombrePoussins < 0) {
                throw new Error('Le nombre de poussins doit etre >= 0');
            }
            if (!nomLot || typeof nomLot !== 'string' || nomLot.trim().length < 2) {
                throw new Error('Le nom du lot est obligatoire');
            }

            connection = await pool.connect();
            transaction = new sql.Transaction(connection);
            await transaction.begin();

            const request = new sql.Request(transaction);
            request.input('idPondage', sql.Int, idPondage);

            const pondageResult = await request.query(`
                SELECT p.Id, p.IdLot, p.Date, p.Oeufs, l.IdRace
                FROM Pondage p
                INNER JOIN Lot l ON l.Id = p.IdLot
                WHERE p.Id = @idPondage
            `);

            if (pondageResult.recordset.length === 0) {
                throw new Error('Pondage introuvable');
            }

            const pondage = pondageResult.recordset[0];
            const oeufsPondage = Number(pondage.Oeufs) || 0;

            if (oeufsPondage <= 0) {
                throw new Error('Ce pondage ne contient aucun oeuf a incuber');
            }
            if (nombrePoussins > oeufsPondage) {
                throw new Error(`Le nombre de poussins ne peut pas depasser les oeufs du pondage (${oeufsPondage})`);
            }

            const dejaIncubeResult = await request.query(`
                SELECT COUNT(1) as total
                FROM Incubation
                WHERE IdPondage = @idPondage
            `);

            if ((dejaIncubeResult.recordset[0].total || 0) > 0) {
                throw new Error('Ce pondage a deja ete couve');
            }

            const stockReadRequest = new sql.Request(transaction);
            stockReadRequest.input('idLot', sql.Int, pondage.IdLot);
            const stockResult = await stockReadRequest.query(`
                SELECT TOP 1 s.StockTotal
                FROM StockOeuf s
                WHERE s.IdLot = @idLot
                ORDER BY s.Date DESC, s.Id DESC
            `);

            const currentStock = stockResult.recordset.length > 0
                ? Math.max(0, Number(stockResult.recordset[0].StockTotal) || 0)
                : oeufsPondage;

            const incubationDate = new Date().toISOString().slice(0, 10);
            const lotName = nomLot.trim();

            // Récupérer le prix de l'oeuf pour le stock
            const racePriceRequest = new sql.Request(transaction);
            racePriceRequest.input('idRace', sql.Int, pondage.IdRace);
            const racePriceResult = await racePriceRequest.query('SELECT Oeuf FROM Race WHERE Id = @idRace');
            const prixOeuf = racePriceResult.recordset.length > 0 ? Number(racePriceResult.recordset[0].Oeuf) : 0;

            // Poussins issus d'incubation = coût 0 (non achetés)
            const prixPoussinUnit = 0;

            const incubationRequest = new sql.Request(transaction);
            incubationRequest.input('date', sql.Date, incubationDate);
            incubationRequest.input('idPondage', sql.Int, idPondage);
            incubationRequest.input('poussins', sql.Int, nombrePoussins);
            const incubationInsert = await incubationRequest.query(`
                INSERT INTO Incubation (Date, IdPondage, Poussins)
                VALUES (@date, @idPondage, @poussins);
                SELECT @@IDENTITY as id;
            `);

            const lotRequest = new sql.Request(transaction);
            lotRequest.input('nom', sql.NVarChar(50), lotName);
            lotRequest.input('idRace', sql.Int, pondage.IdRace);
            lotRequest.input('nombre', sql.Int, nombrePoussins);
            lotRequest.input('arriver', sql.Date, incubationDate);
            lotRequest.input('prixPoussinUnit', sql.Decimal(10, 2), prixPoussinUnit);
            const lotInsert = await lotRequest.query(`
                INSERT INTO Lot (Nom, IdRace, Nombre, Arriver, Sortie, PrixPoussinUnit)
                VALUES (@nom, @idRace, @nombre, @arriver, NULL, @prixPoussinUnit);
                SELECT @@IDENTITY as id;
            `);

            const oeufsUtilises = oeufsPondage;
            const oeufsPerdus = oeufsUtilises - nombrePoussins;
            const nextStock = Math.max(0, currentStock - oeufsUtilises);

            const valeurEstimee = Number((nextStock * prixOeuf).toFixed(2));

            const stockWriteRequest = new sql.Request(transaction);
            stockWriteRequest.input('date', sql.Date, incubationDate);
            stockWriteRequest.input('idLot', sql.Int, pondage.IdLot);
            stockWriteRequest.input('stockTotal', sql.Int, nextStock);
            stockWriteRequest.input('valeurEstimee', sql.Decimal(10, 2), valeurEstimee);
            await stockWriteRequest.query(`
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

            await transaction.commit();

            return {
                incubationId: incubationInsert.recordset[0].id,
                newLotId: lotInsert.recordset[0].id,
                idPondage,
                nomLot: lotName,
                oeufsUtilises,
                oeufsPerdus,
                poussins: nombrePoussins,
                oeufsDisponiblesRestants: nextStock,
            };
        } catch (error) {
            if (transaction) {
                await transaction.rollback();
            }
            console.error('Error in Pondage.couver:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
}

module.exports = Pondage;


