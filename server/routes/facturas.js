const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listar, obtener, crear, actualizar, marcarPagada, eliminar, exportar, enviarRecordatorio
} = require('../controllers/facturasController');
const { generarPDF } = require('../controllers/facturaPdfController');

router.use(authMiddleware);

router.get('/', listar);
router.get('/exportar', exportar);
router.get('/:id/pdf', generarPDF);
router.get('/:id', obtener);
router.post('/', crear);
router.put('/:id', actualizar);
router.patch('/:id/pagar', marcarPagada);
router.post('/:id/recordatorio', enviarRecordatorio);
router.delete('/:id', eliminar);

module.exports = router;
