const sql = require('mssql');
const db = require('../config/db');

class VentePoulet {
  static async getPrixVenteByRace(idRace) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idRace', sql.Int, idRace)
        .query(`
          SELECT Vente as PrixVente 
          FROM Race 
          WHERE Id = @idRace
        `);
      return result.recordset[0]?.PrixVente || 8.00;
    } finally {
      await pool.close();
    }
  }

  static async calculateMontantVente(nombre, prixVente) {
    return nombre * prixVente;
  }

  static async create(date, idLot, idRace, nombre) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      connection = await pool.connect();
      const request = connection.request();
      request.input('date', sql.Date, date);
      request.input('idLot', sql.Int, idLot);
      request.input('idRace', sql.Int, idRace);
      request.input('nombre', sql.Int, nombre);

      const prixVente = await VentePoulet.getPrixVenteByRace(idRace);

      const poidsResult = await connection.request()
        .input('idLot2', sql.Int, idLot)
        .input('date2', sql.Date, date)
        .query(`
          SELECT TOP 1 c.Poids
          FROM Croissance c
          INNER JOIN Lot l ON l.IdRace = c.IdRace
          WHERE l.Id = @idLot2
            AND c.Semaine <= DATEDIFF(DAY, l.Arriver, @date2) / 7
          ORDER BY c.Semaine DESC
        `);
      const poidsMoyen = Number(poidsResult.recordset[0]?.Poids || 0);

      const montantCalcule = nombre * poidsMoyen * prixVente;

      request.input('montantCalcule', sql.Decimal(18,2), montantCalcule);

      const result = await request.query(
        `INSERT INTO VentePoulet (Date, IdLot, Nombre, Montant) 
         VALUES (@date, @idLot, @nombre, @montantCalcule);
         UPDATE Lot SET Nombre = Nombre - @nombre WHERE Id = @idLot;
         SELECT @@IDENTITY as id;`
      );
      return result.recordset[0];
    } catch (error) {
      console.error('Error in VentePoulet.create:', error);
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
        SELECT v.*, l.Nom as nomLot, r.Nom as nomRace
        FROM VentePoulet v
        LEFT JOIN Lot l ON v.IdLot = l.Id
        LEFT JOIN Race r ON l.IdRace = r.Id
        ORDER BY v.Date DESC
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
          SELECT v.*, l.Nom as nomLot, r.Nom as nomRace
          FROM VentePoulet v
          LEFT JOIN Lot l ON v.IdLot = l.Id
          LEFT JOIN Race r ON l.IdRace = r.Id
          WHERE v.Id = @id
        `);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async update(id, date, idLot, nombre, montantTotal) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      connection = await pool.connect();
      const request = connection.request();
      request.input('id', sql.Int, id);
      request.input('date', sql.Date, date);
      request.input('idLot', sql.Int, idLot);
      request.input('nombre', sql.Int, nombre);
      request.input('montantTotal', sql.Decimal(10,2), montantTotal);

      await request.query(
        `UPDATE VentePoulet SET Date = @date, IdLot = @idLot, 
         Nombre = @nombre, Montant = @montantTotal WHERE Id = @id`
      );
      return { success: true, id };
    } catch (error) {
      console.error('Error in VentePoulet.update:', error);
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
        .query('DELETE FROM VentePoulet WHERE Id = @id');
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async getByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT * FROM VentePoulet WHERE IdLot = @idLot`;
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

  static async getTotalByLot(idLot, date = null) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      let query = `SELECT ISNULL(SUM(Montant), 0) AS PrixVente FROM VentePoulet WHERE IdLot = @idLot`;
      const request = pool.request().input('idLot', sql.Int, idLot);
      
      if (date) {
        query += ` AND Date <= @date`;
        request.input('date', sql.Date, date);
      }
      
      const result = await request.query(query);
      return result.recordset[0]?.PrixVente || 0;
    } finally {
      await pool.close();
    }
  }

  static async getVentePouletJourAndCumul(idLot, date) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idLot', sql.Int, idLot)
        .input('date', sql.Date, date)
        .query(
          `SELECT
             ISNULL(SUM(CASE WHEN Date = @date THEN Montant ELSE 0 END), 0) AS VentePouletJour,
             ISNULL(SUM(CASE WHEN Date <= @date THEN Montant ELSE 0 END), 0) AS VentePouletCumul
           FROM VentePoulet
           WHERE IdLot = @idLot AND Date <= @date`
        );
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }
}

module.exports = VentePoulet;
