const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listar, obtener, crear, actualizar, cambiarEstado, actualizarPrecio, eliminar
} = require('../controllers/encargosController');

router.use(authMiddleware);

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', actualizar);
router.patch('/:id/estado', cambiarEstado);
router.patch('/:id/precio', actualizarPrecio);
router.delete('/:id', eliminar);

module.exports = router;
