const pool = require('../config/db');

async function listar(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM dias_no_disponibles WHERE usuario_id=$1 ORDER BY fecha',
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar disponibilidad' });
  }
}

async function bloquear(req, res) {
  try {
    const { fecha, motivo } = req.body;
    if (!fecha) return res.status(400).json({ error: 'Falta la fecha' });
    const resultado = await pool.query(
      `INSERT INTO dias_no_disponibles (usuario_id, fecha, motivo)
       VALUES ($1,$2,$3) ON CONFLICT (usuario_id, fecha) DO NOTHING RETURNING *`,
      [req.usuario.id, fecha, motivo || null]
    );
    res.status(201).json(resultado.rows[0] || { fecha, motivo });
  } catch (err) {
    res.status(500).json({ error: 'Error al bloquear fecha' });
  }
}

async function desbloquear(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM dias_no_disponibles WHERE id=$1 AND usuario_id=$2', [id, req.usuario.id]);
    res.json({ mensaje: 'Fecha desbloqueada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desbloquear fecha' });
  }
}

module.exports = { listar, bloquear, desbloquear };
