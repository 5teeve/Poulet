const express = require('express');
const router = express.Router();
const stockOeufController = require('../controllers/stockOeufController');

router.get('/', stockOeufController.getAll);
router.get('/resume', stockOeufController.getResume);
router.get('/detail/:idLot', stockOeufController.getDetail);

module.exports = router;
