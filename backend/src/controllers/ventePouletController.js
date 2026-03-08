const VentePoulet = require('../models/VentePoulet');

exports.create = async (req, res) => {
  try {
    const { date, idLot, idRace, nombre } = req.body;
    const result = await VentePoulet.create(date, idLot, idRace, nombre);
    res.status(201).json({ message: 'Vente de poulet créée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const ventes = await VentePoulet.getAll();
    res.json({ data: ventes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const vente = await VentePoulet.getById(id);
    if (!vente) {
      return res.status(404).json({ error: 'Vente de poulet non trouvée' });
    }
    res.json({ data: vente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, idLot, nombre, montantTotal } = req.body;
    const result = await VentePoulet.update(id, date, idLot, nombre, montantTotal);
    res.json({ message: 'Vente de poulet mise à jour', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VentePoulet.delete(id);
    res.json({ message: 'Vente de poulet supprimée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
