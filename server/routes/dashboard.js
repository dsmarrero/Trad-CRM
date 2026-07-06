const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resumen, rentabilidad, calendario } = require('../controllers/dashboardController');

router.use(authMiddleware);
router.get('/resumen', resumen);
router.get('/rentabilidad', rentabilidad);
router.get('/calendario', calendario);

module.exports = router;
