const express = require('express');
const router = express.Router();
const incubationController = require('../controllers/incubationController');

// GET /api/incubations
router.get('/', incubationController.getAll);

// POST /api/incubations
router.post('/', incubationController.create);

// POST /api/incubations/couver
router.post('/couver', incubationController.couver);

// GET /api/incubations/:id
router.get('/:id', incubationController.getById);

// PUT /api/incubations/:id
router.put('/:id', incubationController.update);

// DELETE /api/incubations/:id
router.delete('/:id', incubationController.delete);

module.exports = router;
