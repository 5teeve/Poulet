const express = require('express');
const router = express.Router();
const ventePouletController = require('../controllers/ventePouletController');

// GET /api/vente-poulets
router.get('/', ventePouletController.getAll);

// POST /api/vente-poulets
router.post('/', ventePouletController.create);

// GET /api/vente-poulets/:id
router.get('/:id', ventePouletController.getById);

// PUT /api/vente-poulets/:id
router.put('/:id', ventePouletController.update);

// DELETE /api/vente-poulets/:id
router.delete('/:id', ventePouletController.delete);

module.exports = router;
