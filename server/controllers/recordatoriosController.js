const { enviarResumenInterno } = require('../utils/recordatorios');

async function enviarAhora(req, res) {
  try {
    const resultado = await enviarResumenInterno();
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el resumen interno' });
  }
}

module.exports = { enviarAhora };
