const pool = require('../config/db');

async function listar(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM idiomas_usuario WHERE usuario_id=$1 ORDER BY id',
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar idiomas' });
  }
}

async function crear(req, res) {
  try {
    const {
      idioma_origen, idioma_destino,
      tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora,
      tarifa_minima, palabras_minimas
    } = req.body;
    if (!idioma_origen || !idioma_destino) {
      return res.status(400).json({ error: 'Faltan idiomas' });
    }
    const resultado = await pool.query(
      `INSERT INTO idiomas_usuario
        (usuario_id, idioma_origen, idioma_destino, tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora, tarifa_minima, palabras_minimas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        req.usuario.id, idioma_origen, idioma_destino,
        tarifa_traduccion ?? 0.06, tarifa_jurada ?? 0.06, tarifa_revision ?? 0.03, tarifa_edicion_hora ?? 25,
        tarifa_minima ?? 25, palabras_minimas ?? 400
      ]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al añadir par de idiomas' });
  }
}

async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const {
      tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora,
      tarifa_minima, palabras_minimas
    } = req.body;

    const campos = { tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora, tarifa_minima, palabras_minimas };
    for (const [nombre, valor] of Object.entries(campos)) {
      if (valor === '' || valor === null || valor === undefined || Number.isNaN(Number(valor)) || Number(valor) < 0) {
        return res.status(400).json({ error: `El campo ${nombre} debe ser un número válido y no negativo` });
      }
    }

    const resultado = await pool.query(
      `UPDATE idiomas_usuario SET
        tarifa_traduccion=$1, tarifa_jurada=$2, tarifa_revision=$3, tarifa_edicion_hora=$4,
        tarifa_minima=$5, palabras_minimas=$6
       WHERE id=$7 AND usuario_id=$8 RETURNING *`,
      [tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora, tarifa_minima, palabras_minimas, id, req.usuario.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Par de idiomas no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tarifas' });
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM idiomas_usuario WHERE id=$1 AND usuario_id=$2', [id, req.usuario.id]);
    res.json({ mensaje: 'Par de idiomas eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar par de idiomas' });
  }
}

module.exports = { listar, crear, actualizar, eliminar };
