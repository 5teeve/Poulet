const StockOeuf = require('../models/StockOeuf');

exports.getAll = async (req, res) => {
  try {
    const stocks = await StockOeuf.getAll();
    res.json({ data: stocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await StockOeuf.getStockResume();
    res.json({ data: resume });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const { idLot } = req.params;
    const detail = await StockOeuf.getStockDetail(parseInt(idLot));
    res.json({ data: detail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
