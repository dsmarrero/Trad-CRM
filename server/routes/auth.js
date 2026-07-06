const express = require('express');
const router = express.Router();
const {
  registrar, login, logout, obtenerConfig, actualizarConfig,
  obtenerPerfil, actualizarPerfil, cambiarPassword
} = require('../controllers/usuariosController');
const { authMiddleware } = require('../middleware/auth');

router.post('/registro', registrar);
router.post('/login', login);
router.post('/logout', logout);
router.get('/configuracion', authMiddleware, obtenerConfig);
router.put('/configuracion', authMiddleware, actualizarConfig);
router.get('/perfil', authMiddleware, obtenerPerfil);
router.put('/perfil', authMiddleware, actualizarPerfil);
router.put('/perfil/password', authMiddleware, cambiarPassword);

module.exports = router;
