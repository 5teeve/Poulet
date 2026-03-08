const sql = require('mssql');
const db = require('../config/db');

class Lot {
  static async create(nom, idRace, nombre, arriver, sortie = null) {
    const pool = new sql.ConnectionPool(db);
    let connection = null;
    try {
      if (sortie === '') {
        sortie = null;
      }

      connection = await pool.connect();
      const request = connection.request();
      request.input('nom', sql.NVarChar(50), nom);
      request.input('idRace', sql.Int, idRace);
      request.input('nombre', sql.Int, nombre);
      request.input('arriver', sql.Date, arriver);
      request.input('sortie', sql.Date, sortie);

      const result = await request.query(
        `INSERT INTO Lot (Nom, IdRace, Nombre, Arriver, Sortie) 
         VALUES (@nom, @idRace, @nombre, @arriver, @sortie);
         SELECT @@IDENTITY as id;`
      );
      return result.recordset[0];
    } catch (error) {
      console.error('Error in Lot.create:', error);
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
      const result = await pool.request().query('SELECT * FROM Lot');
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
        .query('SELECT * FROM Lot WHERE Id = @id');
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async update(id, nom, idRace, nombre, arriver, sortie) {
    if (sortie === '') {
      sortie = null;
    }
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const request = pool.request();
      request.input('id', sql.Int, parseInt(id));
      request.input('nom', sql.NVarChar(50), nom);
      request.input('idRace', sql.Int, idRace);
      request.input('nombre', sql.Int, nombre);
      request.input('arriver', sql.Date, arriver);
      request.input('sortie', sql.Date, sortie);

      await request.query(
        `UPDATE Lot SET Nom = @nom, IdRace = @idRace, Nombre = @nombre, 
         Arriver = @arriver, Sortie = @sortie WHERE Id = @id`
      );
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async updatePoidsMoyenForLot(idLot) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      
      // Poids = gain par semaine, poids total = somme de semaine 0 à l'âge courant
      const result = await pool.request()
        .input('idLot', sql.Int, idLot)
        .query(`
          UPDATE Lot 
          SET PoidsMoyen = ISNULL((
            SELECT SUM(c.Poids)
            FROM Croissance c
            WHERE c.IdRace = Lot.IdRace
              AND c.Semaine <= DATEDIFF(DAY, Lot.Arriver, GETDATE()) / 7
          ), 0)
          WHERE Id = @idLot
        OUTPUT INSERTED.PoidsMoyen
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in Lot.updatePoidsMoyenForLot:', error);
      throw error;
    } finally {
      await pool.close();
    }
  }

  static async updateAllPoidsMoyen() {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      
      const result = await pool.request().query(`
        UPDATE Lot 
        SET PoidsMoyen = ISNULL((
          SELECT SUM(c.Poids)
          FROM Croissance c
          WHERE c.IdRace = Lot.IdRace
            AND c.Semaine <= DATEDIFF(DAY, Lot.Arriver, GETDATE()) / 7
        ), 0)
        WHERE Lot.IdRace IN (
          SELECT DISTINCT IdRace 
          FROM Croissance
        )
      `);
      
      return { success: true, message: 'Poids moyen mis à jour pour tous les lots' };
    } catch (error) {
      console.error('Error in Lot.updateAllPoidsMoyen:', error);
      throw error;
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
        .query('DELETE FROM Lot WHERE Id = @id');
      return { success: true, id };
    } finally {
      await pool.close();
    }
  }

  static async getAllWithRaceDetails() {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request().query(`
        SELECT l.Id, l.Nom, l.Nombre, l.Arriver, l.Sortie, l.IdRace, l.PoidsMoyen,
               r.Nom AS NomRace, r.Poussin AS PrixPoussinsUnitaire,
               r.Nourriture AS PrixNourritureGramme,
               r.Vente AS PrixVenteGramme, r.Oeuf AS PrixOeufPiece
        FROM Lot l
        INNER JOIN Race r ON r.Id = l.IdRace
        ORDER BY l.Id
      `);
      return result.recordset;
    } finally {
      await pool.close();
    }
  }

  static async getByIdWithRaceDetails(id) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT l.Id, l.Nom, l.Nombre, l.Arriver, l.Sortie, l.IdRace, l.PoidsMoyen,
                 r.Nom AS NomRace, r.Poussin AS PrixPoussinsUnitaire,
                 r.Nourriture AS PrixNourritureGramme,
                 r.Vente AS PrixVenteGramme, r.Oeuf AS PrixOeufPiece
          FROM Lot l
          INNER JOIN Race r ON r.Id = l.IdRace
          WHERE l.Id = @id
        `);
      return result.recordset[0];
    } finally {
      await pool.close();
    }
  }

  static async getCountByRace(idRace) {
    const pool = new sql.ConnectionPool(db);
    try {
      await pool.connect();
      const result = await pool.request()
        .input('idRace', sql.Int, idRace)
        .query('SELECT COUNT(*) AS count FROM Lot WHERE IdRace = @idRace');
      return result.recordset[0]?.count || 0;
    } finally {
      await pool.close();
    }
  }
}

module.exports = Lot;
