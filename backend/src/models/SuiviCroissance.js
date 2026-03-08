const sql = require('mssql');
const db = require('../config/db');
const Lot = require('./Lot');

class SuiviCroissance {
  static async create(semaine, idRace, poidsMoyen, consommationNourriture) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('semaine', sql.Int, semaine);
      request.input('idRace', sql.Int, idRace);
      request.input('poids', sql.Decimal(10, 2), poidsMoyen);
      request.input('nourriture', sql.Decimal(10, 2), consommationNourriture);

      const result = await request.query(
        `INSERT INTO Croissance (Semaine, IdRace, Poids, Nourriture)
         VALUES (@semaine, @idRace, @poids, @nourriture);
         SELECT @@IDENTITY as id;`
      );
      
      await Lot.updateAllPoidsMoyen();
      
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async getAll() {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request().query('SELECT * FROM Croissance');
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
        .input('id', sql.Int, parseInt(id))
        .query('SELECT * FROM Croissance WHERE Id = @id');
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async update(id, semaine, idRace, poidsMoyen, consommationNourriture) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('id', sql.Int, parseInt(id));
      request.input('semaine', sql.Int, semaine);
      request.input('idRace', sql.Int, idRace);
      request.input('poids', sql.Decimal(10, 2), poidsMoyen);
      request.input('nourriture', sql.Decimal(10, 2), consommationNourriture);

      await request.query(
        `UPDATE Croissance SET Semaine = @semaine, IdRace = @idRace,
         Poids = @poids, Nourriture = @nourriture WHERE Id = @id`
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
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('DELETE FROM Croissance WHERE Id = @id');
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async getByRaceAndSemaine(idRace, semaine) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idRace', sql.Int, idRace)
        .input('semaine', sql.Int, semaine)
        .query('SELECT * FROM Croissance WHERE IdRace = @idRace AND Semaine = @semaine');
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async getByRaceAndMaxSemaine(idRace, maxSemaine) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idRace', sql.Int, idRace)
        .input('maxSemaine', sql.Int, maxSemaine)
        .query(`
          SELECT TOP 1 * 
          FROM Croissance 
          WHERE IdRace = @idRace AND Semaine <= @maxSemaine
          ORDER BY Semaine DESC
        `);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async getSumPoidsByRaceAndAge(idRace, ageJours) {
    const ageSemaines = Math.floor(ageJours / 7);
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idRace', sql.Int, idRace)
        .input('maxSemaine', sql.Int, ageSemaines)
        .query(`
          SELECT ISNULL(SUM(Poids), 0) AS PoidsCumule
          FROM Croissance
          WHERE IdRace = @idRace AND Semaine <= @maxSemaine
        `);
      return result.recordset[0]?.PoidsCumule || 0;
    } finally {
      await pool.close();
    }
  }

  static async getAllByRace(idRace) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idRace', sql.Int, idRace)
        .query('SELECT * FROM Croissance WHERE IdRace = @idRace ORDER BY Semaine ASC');
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getPoidsByRaceAndAge(idRace, ageJours) {
    return await SuiviCroissance.getSumPoidsByRaceAndAge(idRace, ageJours);
  }

  static async getNourritureByRaceAndAge(idRace, ageJours) {
    const ageSemaines = Math.floor(ageJours / 7);
    const croissance = await SuiviCroissance.getByRaceAndMaxSemaine(idRace, ageSemaines);
    return croissance?.Nourriture || 0;
  }
}

module.exports = SuiviCroissance;
