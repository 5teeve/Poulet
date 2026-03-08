const express = require('express');
const router = express.Router();
const pondageController = require('../controllers/pondageController');

router.post('/', pondageController.create);
router.post('/:id/couver', pondageController.couver);
router.get('/', pondageController.getAll);
router.get('/:id', pondageController.getById);
router.put('/:id', pondageController.update);
router.delete('/:id', pondageController.delete);

module.exports = router;