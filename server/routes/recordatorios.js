const express = require('express');
const router = express.Router();
const { authMiddleware, soloAdmin } = require('../middleware/auth');
const { enviarAhora } = require('../controllers/recordatoriosController');

router.use(authMiddleware);
router.post('/enviar', soloAdmin, enviarAhora);

module.exports = router;
