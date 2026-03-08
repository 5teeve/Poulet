const Race = require('../models/Race');

exports.create = async (req, res) => {
  try {
    const { nom, nourriture, vente, oeuf, poussin } = req.body;
    const result = await Race.create(nom, nourriture, vente, oeuf, poussin);
    res.status(201).json({ message: 'Race créée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const races = await Race.getAll();
    res.json({ data: races });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const race = await Race.getById(id);
    if (!race) {
      return res.status(404).json({ error: 'Race non trouvée' });
    }
    res.json({ data: race });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, nourriture, vente, oeuf, poussin } = req.body;
    const result = await Race.update(id, nom, nourriture, vente, oeuf, poussin);
    res.json({ message: 'Race mise à jour', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Race.delete(id);
    res.json({ message: 'Race supprimée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
