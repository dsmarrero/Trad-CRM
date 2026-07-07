const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const upload = require('../config/multerPresupuestos');
const {
  listar, obtener, crear, descargar, cambiarEstado, convertirEnEncargo, eliminar
} = require('../controllers/presupuestosController');

router.use(authMiddleware);

router.get('/', listar);
router.get('/:id', obtener);
router.get('/:id/descargar', descargar);
router.post('/', upload.single('archivo'), crear);
router.patch('/:id/estado', cambiarEstado);
router.post('/:id/convertir', convertirEnEncargo);
router.delete('/:id', eliminar);

module.exports = router;
