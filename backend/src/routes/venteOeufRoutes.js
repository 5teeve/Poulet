const express = require('express');
const router = express.Router();
const venteOeufController = require('../controllers/venteOeufController');

// GET /api/vente-oeufs
router.get('/', venteOeufController.getAll);

// POST /api/vente-oeufs
router.post('/', venteOeufController.create);

// GET /api/vente-oeufs/:id
router.get('/:id', venteOeufController.getById);

// PUT /api/vente-oeufs/:id
router.put('/:id', venteOeufController.update);

// DELETE /api/vente-oeufs/:id
router.delete('/:id', venteOeufController.delete);

module.exports = router;
