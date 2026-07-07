const express = require('express');
const router = express.Router();
const {
  registrar, login, logout, obtenerConfig, actualizarConfig, subirLogo, descargarLogo,
  obtenerPerfil, actualizarPerfil, cambiarPassword
} = require('../controllers/usuariosController');
const { authMiddleware } = require('../middleware/auth');
const uploadLogo = require('../config/multerLogo');

router.post('/registro', registrar);
router.post('/login', login);
router.post('/logout', logout);
router.get('/configuracion', authMiddleware, obtenerConfig);
router.put('/configuracion', authMiddleware, actualizarConfig);
router.post('/configuracion/logo', authMiddleware, uploadLogo.single('logo'), subirLogo);
router.get('/configuracion/logo', authMiddleware, descargarLogo);
router.get('/perfil', authMiddleware, obtenerPerfil);
router.put('/perfil', authMiddleware, actualizarPerfil);
router.put('/perfil/password', authMiddleware, cambiarPassword);

module.exports = router;
