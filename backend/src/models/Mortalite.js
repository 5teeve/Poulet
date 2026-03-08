const sql = require('mssql');
const db = require('../config/db');

class Mortalite {
  static async create(date, idLot, nombre) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      connection = await pool.connect();
      const request = connection.request();
      request.input('date', sql.Date, date);
      request.input('idLot', sql.Int, idLot);
      request.input('nombre', sql.Int, nombre);

      const result = await request.query(
        `INSERT INTO Mortalite (Date, IdLot, Nombre)
         VALUES (@date, @idLot, @nombre);
         SELECT @@IDENTITY as id;`
      );
      return result.recordset[0];
    } catch (error) {
      console.error('Error in Mortalite.create:', error);
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
      const result = await pool.request().query(
        `SELECT m.*, l.Nom as NomLot
         FROM Mortalite m
         LEFT JOIN Lot l ON l.Id = m.IdLot
         ORDER BY m.Date DESC`
      );
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
        .query(
          `SELECT m.*, l.Nom as NomLot
           FROM Mortalite m
           LEFT JOIN Lot l ON l.Id = m.IdLot
           WHERE m.Id = @id`
        );
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async getByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT * FROM Mortalite WHERE IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      query += ` ORDER BY Date DESC`;
      const result = await request.query(query);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getTotalMortByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT ISNULL(SUM(Nombre), 0) AS TotalMort FROM Mortalite WHERE IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      const result = await request.query(query);
      return result.recordset[0]?.TotalMort || 0;
    } finally {
      await pool.close();
    }
  }

  static async getMortJourAndCumul(idLot, date) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idLot', sql.Int, idLot)
        .input('date', sql.Date, date)
        .query(
          `SELECT
             ISNULL(SUM(CASE WHEN Date = @date THEN Nombre ELSE 0 END), 0) AS MortJour,
             ISNULL(SUM(CASE WHEN Date <= @date THEN Nombre ELSE 0 END), 0) AS MortCumul
           FROM Mortalite
           WHERE IdLot = @idLot AND Date <= @date`
        );
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async delete(id) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Mortalite WHERE Id = @id');
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async update(id, date, idLot, nombre) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('id', sql.Int, id);
      request.input('date', sql.Date, date);
      request.input('idLot', sql.Int, idLot);
      request.input('nombre', sql.Int, nombre);

      await request.query(
        `UPDATE Mortalite SET Date = @date, IdLot = @idLot, Nombre = @nombre WHERE Id = @id`
      );
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }
}

module.exports = Mortalite;
