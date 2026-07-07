const express = require('express');
const router = express.Router();
const {
  registrar, login, logout, obtenerConfig, actualizarConfig, subirLogo, descargarLogo,
  obtenerPerfil, actualizarPerfil, cambiarPassword, eliminarUsuario, listarUsuarios
} = require('../controllers/usuariosController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');
const uploadLogo = require('../config/multerLogo');

router.post('/registro', authMiddleware, soloAdmin, registrar);
router.post('/login', login);
router.post('/logout', logout);
router.get('/configuracion', authMiddleware, obtenerConfig);
router.put('/configuracion', authMiddleware, actualizarConfig);
router.post('/configuracion/logo', authMiddleware, uploadLogo.single('logo'), subirLogo);
router.get('/configuracion/logo', authMiddleware, descargarLogo);
router.get('/perfil', authMiddleware, obtenerPerfil);
router.put('/perfil', authMiddleware, actualizarPerfil);
router.put('/perfil/password', authMiddleware, cambiarPassword);
router.get('/usuarios', authMiddleware, soloAdmin, listarUsuarios);
router.delete('/usuarios/:id', authMiddleware, soloAdmin, eliminarUsuario);

module.exports = router;
