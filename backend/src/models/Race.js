const sql = require('mssql');
const db = require('../config/db');

class Race {
  static async create(nom, nourriture, vente, oeuf, poussin) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('nom', sql.NVarChar(50), nom);
      request.input('nourriture', sql.Decimal(10, 2), nourriture);
      request.input('vente', sql.Decimal(10, 2), vente);
      request.input('oeuf', sql.Decimal(10, 2), oeuf);
      request.input('poussin', sql.Decimal(10, 2), poussin);

      const result = await request.query(
        `INSERT INTO Race (Nom, Nourriture, Vente, Oeuf, Poussin)
         VALUES (@nom, @nourriture, @vente, @oeuf, @poussin);
         SELECT @@IDENTITY as id;`
      );
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async getAll() {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request().query('SELECT * FROM Race');
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
        .query('SELECT * FROM Race WHERE Id = @id');
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async update(id, nom, nourriture, vente, oeuf, poussin) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('id', sql.Int, parseInt(id));
      request.input('nom', sql.NVarChar(50), nom);
      request.input('nourriture', sql.Decimal(10, 2), nourriture);
      request.input('vente', sql.Decimal(10, 2), vente);
      request.input('oeuf', sql.Decimal(10, 2), oeuf);
      request.input('poussin', sql.Decimal(10, 2), poussin);

      await request.query(
        `UPDATE Race SET Nom = @nom, Nourriture = @nourriture, Vente = @vente,
         Oeuf = @oeuf, Poussin = @poussin WHERE Id = @id`
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
        .query('DELETE FROM Race WHERE Id = @id');
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }
}

module.exports = Race;
