const Lot = require('../models/Lot');

exports.create = async (req, res) => {
  try {
    const { nom, idRace, nombre, arriver, sortie } = req.body;
    const result = await Lot.create(nom, idRace, nombre, arriver, sortie);
    res.status(201).json({ message: 'Lot créé', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const lots = await Lot.getAll();
    res.json({ data: lots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await Lot.getById(id);
    if (!lot) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }
    res.json({ data: lot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, idRace, nombre, arriver, sortie } = req.body;
    const result = await Lot.update(id, nom, idRace, nombre, arriver, sortie);
    res.json({ message: 'Lot mis à jour', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePoidsMoyen = async (req, res) => {
  try {
    const result = await Lot.updateAllPoidsMoyen();
    res.json({ message: 'Poids moyen mis à jour pour tous les lots', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePoidsMoyenForLot = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Lot.updatePoidsMoyenForLot(id);
    res.json({ message: `Poids moyen mis à jour pour le lot ${id}`, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Lot.delete(id);
    res.json({ message: 'Lot supprimé', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
