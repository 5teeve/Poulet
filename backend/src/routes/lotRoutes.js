const express = require('express');
const router = express.Router();
const lotController = require('../controllers/lotController');

router.post('/', lotController.create);
router.get('/', lotController.getAll);
router.get('/:id', lotController.getById);
router.put('/:id', lotController.update);
router.delete('/:id', lotController.delete);

router.put('/calculate-poids-moyen', lotController.updatePoidsMoyen);
router.put('/:id/calculate-poids-moyen', lotController.updatePoidsMoyenForLot);

module.exports = router;
