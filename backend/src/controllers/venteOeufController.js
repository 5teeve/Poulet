const VenteOeuf = require('../models/VenteOeuf');

exports.create = async (req, res) => {
  try {
    const { date, idPondage, nombre } = req.body;
    const result = await VenteOeuf.create(date, idPondage, nombre);
    res.status(201).json({ message: 'Vente d\'œuf créée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const ventes = await VenteOeuf.getAll();
    res.json({ data: ventes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const vente = await VenteOeuf.getById(id);
    if (!vente) {
      return res.status(404).json({ error: 'Vente d\'œuf non trouvée' });
    }
    res.json({ data: vente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, idPondage, nombre, montantTotal } = req.body;
    const result = await VenteOeuf.update(id, date, idPondage, nombre, montantTotal);
    res.json({ message: 'Vente d\'œuf mise à jour', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VenteOeuf.delete(id);
    res.json({ message: 'Vente d\'œuf supprimée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
