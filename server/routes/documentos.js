const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const upload = require('../config/multer');
const { listarPorEncargo, subir, eliminar } = require('../controllers/documentosController');

router.use(authMiddleware);

router.get('/encargo/:encargoId', listarPorEncargo);
router.post('/', upload.single('archivo'), subir);
router.delete('/:id', eliminar);

module.exports = router;
