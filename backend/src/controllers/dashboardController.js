const Dashboard = require('../models/Dashboard');

function normalizeDate(inputDate) {
  if (!inputDate) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

exports.getLotReport = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date);
    if (!date) {
      return res.status(400).json({ error: 'Date invalide. Format attendu: YYYY-MM-DD' });
    }

    const rows = await Dashboard.getLotReportByDate(date);
    return res.json({
      date,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getLotDetailReport = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date);
    const lotId = parseInt(req.params.lotId, 10);

    if (!date) {
      return res.status(400).json({ error: 'Date invalide. Format attendu: YYYY-MM-DD' });
    }
    if (!Number.isInteger(lotId) || lotId <= 0) {
      return res.status(400).json({ error: 'Lot invalide' });
    }

    const detail = await Dashboard.getLotReportDetailByDate(lotId, date);
    if (!detail) {
      return res.status(404).json({ error: 'Lot introuvable' });
    }

    return res.json({ date, data: detail });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
