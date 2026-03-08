const sql = require('mssql');
const db = require('../config/db');
const StockOeuf = require('./StockOeuf');

class VenteOeuf {
  static async getPrixOeufByPondage(idPondage) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idPondage', sql.Int, idPondage)
        .query(`
          SELECT r.Oeuf as PrixOeuf 
          FROM Race r
          JOIN Pondage p ON r.Id = (
            SELECT IdRace 
            FROM Lot 
            WHERE Id = p.IdLot
          )
          WHERE p.Id = @idPondage
        `);
      return result.recordset[0]?.PrixOeuf || 1.50;
    } finally {
      await pool.close();
    }
  }

  static async calculateMontantVente(nombre, prixOeuf) {
    return nombre * prixOeuf;
  }

  static async create(date, idPondage, nombre) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      connection = await pool.connect();
      const request = connection.request();
      request.input('date', sql.Date, date);
      request.input('idPondage', sql.Int, idPondage);
      request.input('nombre', sql.Int, nombre);

      // Récupérer le prix des œufs et calculer le montant
      const prixOeuf = await VenteOeuf.getPrixOeufByPondage(idPondage);
      const montantCalcule = await VenteOeuf.calculateMontantVente(nombre, prixOeuf);

      request.input('montantCalcule', sql.Decimal(10,2), montantCalcule);

      const result = await request.query(
        `INSERT INTO VenteOeuf (Date, IdPondage, Nombre, Montant) 
         VALUES (@date, @idPondage, @nombre, @montantCalcule);
         SELECT @@IDENTITY as id;`
      );

      // Recalcul du stock après vente
      const pondageResult = await connection.request()
        .input('idPondage', sql.Int, idPondage)
        .query('SELECT IdLot FROM Pondage WHERE Id = @idPondage');
      if (pondageResult.recordset[0]) {
        await StockOeuf.recalculateStock(pondageResult.recordset[0].IdLot);
      }

      return result.recordset[0];
    } catch (error) {
      console.error('Error in VenteOeuf.create:', error);
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
      const result = await pool.request().query(`
        SELECT v.*, p.Oeufs as nombreOeufs, p.Date as datePondage, l.Id as idLot, l.Nom as nomLot
        FROM VenteOeuf v
        LEFT JOIN Pondage p ON v.IdPondage = p.Id
        LEFT JOIN Lot l ON p.IdLot = l.Id
        ORDER BY v.Date DESC
      `);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getById(id) {
    if (!id) {
      throw new Error('ID parameter is required');
    }
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT v.*, p.Oeufs as nombreOeufs, p.Date as datePondage, l.Id as idLot, l.Nom as nomLot
          FROM VenteOeuf v
          LEFT JOIN Pondage p ON v.IdPondage = p.Id
          LEFT JOIN Lot l ON p.IdLot = l.Id
          WHERE v.Id = @id
        `);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async update(id, date, idPondage, nombre, montantTotal) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('id', sql.Int, parseInt(id));
      request.input('date', sql.Date, date);
      request.input('idPondage', sql.Int, idPondage);
      request.input('nombre', sql.Int, nombre);
      request.input('montantTotal', sql.Decimal(10,2), montantTotal);

      await request.query(
        `UPDATE VenteOeuf SET Date = @date, IdPondage = @idPondage, Nombre = @nombre, 
         Montant = @montantTotal WHERE Id = @id`
      );
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async delete(id) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      // Récupérer le lot avant suppression
      const venteInfo = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`SELECT p.IdLot FROM VenteOeuf v
                INNER JOIN Pondage p ON p.Id = v.IdPondage
                WHERE v.Id = @id`);
      const idLot = venteInfo.recordset[0]?.IdLot;

      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('DELETE FROM VenteOeuf WHERE Id = @id');

      if (idLot) {
        await StockOeuf.recalculateStock(idLot);
      }
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async getByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT v.* FROM VenteOeuf v
                   INNER JOIN Pondage p ON p.Id = v.IdPondage
                   WHERE p.IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND v.Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      query += ` ORDER BY v.Date DESC`;
      const result = await request.query(query);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getTotalByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT ISNULL(SUM(v.Montant), 0) AS VenteOeuf FROM VenteOeuf v
                   INNER JOIN Pondage p ON p.Id = v.IdPondage
                   WHERE p.IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND v.Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      const result = await request.query(query);
      return result.recordset[0]?.VenteOeuf || 0;
    } finally {
      await pool.close();
    }
  }

  static async getVenteOeufJourAndCumul(idLot, date) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idLot', sql.Int, idLot)
        .input('date', sql.Date, date)
        .query(
          `SELECT
             ISNULL(SUM(CASE WHEN vo.Date = @date THEN vo.Montant ELSE 0 END), 0) AS VenteOeufJour,
             ISNULL(SUM(CASE WHEN vo.Date <= @date THEN vo.Montant ELSE 0 END), 0) AS VenteOeufCumul
           FROM VenteOeuf vo
           INNER JOIN Pondage p ON p.Id = vo.IdPondage
           WHERE p.IdLot = @idLot AND vo.Date <= @date`
        );
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }
}

module.exports = VenteOeuf;
