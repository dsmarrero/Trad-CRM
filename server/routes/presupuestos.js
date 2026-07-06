const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listar, obtener, crear, cambiarEstado, convertirEnEncargo, eliminar
} = require('../controllers/presupuestosController');

router.use(authMiddleware);

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', crear);
router.patch('/:id/estado', cambiarEstado);
router.post('/:id/convertir', convertirEnEncargo);
router.delete('/:id', eliminar);

module.exports = router;
