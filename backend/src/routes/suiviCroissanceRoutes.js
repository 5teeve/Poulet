const express = require('express');
const router = express.Router();
const suiviCroissanceController = require('../controllers/suiviCroissanceController');

// GET /api/suivi-croissance
router.get('/', suiviCroissanceController.getAll);

// POST /api/suivi-croissance
router.post('/', suiviCroissanceController.create);

// GET /api/suivi-croissance/:id
router.get('/:id', suiviCroissanceController.getById);

// PUT /api/suivi-croissance/:id
router.put('/:id', suiviCroissanceController.update);

// DELETE /api/suivi-croissance/:id
router.delete('/:id', suiviCroissanceController.delete);

module.exports = router;
