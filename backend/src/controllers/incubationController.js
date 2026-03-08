const Incubation = require('../models/Incubation');
const Pondage = require('../models/Pondage');

exports.create = async (req, res) => {
  try {
    const { date, idPondage, nombrePoussins } = req.body;
    const result = await Incubation.create(date, idPondage, nombrePoussins);
    res.status(201).json({ message: 'Incubation créée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const incubations = await Incubation.getAll();
    res.json({ data: incubations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const incubation = await Incubation.getById(id);
    if (!incubation) {
      return res.status(404).json({ error: 'Incubation non trouvée' });
    }
    res.json({ data: incubation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, idPondage, nombrePoussins } = req.body;
    const result = await Incubation.update(id, date, idPondage, nombrePoussins);
    res.json({ message: 'Incubation mise à jour', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Incubation.delete(id);
    res.json({ message: 'Incubation supprimée', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.couver = async (req, res) => {
  try {
    const { idPondage, nombrePoussins, nomLot } = req.body;
    const result = await Pondage.couver(
      parseInt(idPondage, 10),
      parseInt(nombrePoussins, 10),
      nomLot
    );

    res.status(201).json({
      message: 'Couvaison effectuée: nouveau lot créé et stock d\'oeufs mis à jour',
      data: result,
    });
  } catch (error) {
    const status = error.message && (
      error.message.includes('insuffisant') ||
      error.message.includes('invalide') ||
      error.message.includes('introuvable') ||
      error.message.includes('deja ete couve') ||
      error.message.includes('ne peut pas depasser') ||
      error.message.includes('aucun oeuf')
    )
      ? 400
      : 500;
    res.status(status).json({ error: error.message });
  }
};
