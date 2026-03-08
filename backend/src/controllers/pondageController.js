const Pondage = require('../models/Pondage');

exports.create = async (req, res) => {
    try {
        const { date, idLot, oeufs } = req.body;
        const result = await Pondage.create(date, idLot, oeufs);
        res.status(201).json({ message: 'Pondage créé', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const pondages = await Pondage.getAll();
        res.json({ data: pondages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const pondage = await Pondage.getById(id);
        if (!pondage) {
            return res.status(404).json({ error: 'Pondage non trouvé' });
        }
        res.json({ data: pondage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, idLot, oeufs } = req.body;
        const result = await Pondage.update(id, date, idLot, oeufs);
        res.json({ message: 'Pondage mis à jour', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Pondage.delete(id);
        res.json({ message: 'Pondage supprimé', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByLot = async (req, res) => {
    try {
        const { idLot } = req.params;
        const pondages = await Pondage.getByLot(idLot);
        res.json({ data: pondages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const pondages = await Pondage.getByDate(date);
        res.json({ data: pondages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const pondages = await Pondage.getDateRange(startDate, endDate);
        res.json({ data: pondages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByLotAndDate = async (req, res) => {
    try {
        const { idLot, date } = req.params;
        const pondage = await Pondage.getByLotAndDate(idLot, date);
        res.json({ data: pondage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.couver = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombrePoussins, nomLot } = req.body;
        const result = await Pondage.couver(
            parseInt(id, 10),
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

