const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listar, bloquear, desbloquear } = require('../controllers/disponibilidadController');

router.use(authMiddleware);
router.get('/', listar);
router.post('/', bloquear);
router.delete('/:id', desbloquear);

module.exports = router;
