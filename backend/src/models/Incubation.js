const sql = require('mssql');
const db = require('../config/db');

class Incubation {
  static async create(date, idPondage, nombrePoussins) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      connection = await pool.connect();
      const request = connection.request();
      request.input('date', sql.Date, date);
      request.input('idPondage', sql.Int, idPondage);
      request.input('nombrePoussins', sql.Int, nombrePoussins);

      const result = await request.query(
        `INSERT INTO Incubation (Date, IdPondage, Poussins)
         VALUES (@date, @idPondage, @nombrePoussins);
         SELECT @@IDENTITY as id;`
      );
      return result.recordset[0];
    } catch (error) {
      console.error('Error in Incubation.create:', error);
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
        SELECT i.*, p.Oeufs as nombreOeufs, p.Date as datePondage, p.IdLot,
               r.Poussin as PrixPoussin
        FROM Incubation i
        LEFT JOIN Pondage p ON i.IdPondage = p.Id
        LEFT JOIN Lot l ON p.IdLot = l.Id
        LEFT JOIN Race r ON l.IdRace = r.Id
        ORDER BY i.Date DESC
      `);
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
        .query(`
          SELECT i.*, p.Oeufs as nombreOeufs, p.Date as datePondage, p.IdLot,
                 r.Poussin as PrixPoussin
          FROM Incubation i
          LEFT JOIN Pondage p ON i.IdPondage = p.Id
          LEFT JOIN Lot l ON p.IdLot = l.Id
          LEFT JOIN Race r ON l.IdRace = r.Id
          WHERE i.Id = @id
        `);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async update(id, date, idPondage, nombrePoussins) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      connection = await pool.connect();
      const request = connection.request();
      request.input('id', sql.Int, id);
      request.input('date', sql.Date, date);
      request.input('idPondage', sql.Int, idPondage);
      request.input('nombrePoussins', sql.Int, nombrePoussins);

      await request.query(
        `UPDATE Incubation SET Date = @date, IdPondage = @idPondage, 
         Poussins = @nombrePoussins
         WHERE Id = @id`
      );
      return { success: true, id };
    } catch (error) {
      console.error('Error in Incubation.update:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  static async delete(id) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Incubation WHERE Id = @id');
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async getByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT i.*, p.Oeufs as nombreOeufs, p.Date as datePondage, p.IdLot
                   FROM Incubation i
                   INNER JOIN Pondage p ON i.IdPondage = p.Id
                   WHERE p.IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND i.Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      query += ` ORDER BY i.Date DESC`;
      const result = await request.query(query);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getIncubationDetails(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT
                     ISNULL(COUNT(1), 0) AS NbIncubations,
                     ISNULL(SUM(i.Poussins), 0) AS TotalPoussinsEclos,
                     ISNULL(SUM(p.Oeufs), 0) AS TotalOeufsIncubes
                   FROM Incubation i
                   INNER JOIN Pondage p ON p.Id = i.IdPondage
                   WHERE p.IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND i.Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      const result = await request.query(query);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

}

module.exports = Incubation;
