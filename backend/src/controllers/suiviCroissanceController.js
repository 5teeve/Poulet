const SuiviCroissance = require('../models/SuiviCroissance');

exports.create = async (req, res) => {
  try {
    const { semaine, idRace, poidsMoyen, consommationNourriture } = req.body;
    const result = await SuiviCroissance.create(semaine, idRace, poidsMoyen, consommationNourriture);
    res.status(201).json({ message: 'Suivi de croissance créé', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const suivis = await SuiviCroissance.getAll();
    res.json({ data: suivis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const suivi = await SuiviCroissance.getById(id);
    if (!suivi) {
      return res.status(404).json({ error: 'Suivi de croissance non trouvé' });
    }
    res.json({ data: suivi });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { semaine, idRace, poidsMoyen, consommationNourriture } = req.body;
    const result = await SuiviCroissance.update(id, semaine, idRace, poidsMoyen, consommationNourriture);
    res.json({ message: 'Suivi de croissance mis à jour', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SuiviCroissance.delete(id);
    res.json({ message: 'Suivi de croissance supprimé', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
