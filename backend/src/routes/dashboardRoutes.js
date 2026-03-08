const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/rapport', dashboardController.getLotReport);
router.get('/rapport/:lotId', dashboardController.getLotDetailReport);

module.exports = router;
