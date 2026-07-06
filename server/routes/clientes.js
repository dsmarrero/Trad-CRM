const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listar, obtener, crear, actualizar, eliminar,
  listarNotas, crearNota, eliminarNota
} = require('../controllers/clientesController');

router.use(authMiddleware); // todas las rutas de clientes requieren login

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

router.get('/:id/notas', listarNotas);
router.post('/:id/notas', crearNota);
router.delete('/:id/notas/:notaId', eliminarNota);

module.exports = router;
