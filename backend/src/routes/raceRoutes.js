const express = require('express');
const router = express.Router();
const raceController = require('../controllers/raceController');

router.post('/', raceController.create);
router.get('/', raceController.getAll);
router.get('/:id', raceController.getById);
router.put('/:id', raceController.update);
router.delete('/:id', raceController.delete);

module.exports = router;
