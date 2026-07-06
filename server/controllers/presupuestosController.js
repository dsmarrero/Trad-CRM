const pool = require('../config/db');

async function listar(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT p.*, c.nombre AS cliente_nombre
       FROM presupuestos p
       JOIN clientes c ON p.cliente_id = c.id
       ORDER BY p.creado_en DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar presupuestos' });
  }
}

async function obtener(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM presupuestos WHERE id=$1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
}

async function crear(req, res) {
  try {
    const {
      cliente_id, idioma_origen, idioma_destino, tipo_documento,
      palabras_estimadas, precio_estimado, notas
    } = req.body;

    if (!cliente_id || !idioma_origen || !idioma_destino) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const resultado = await pool.query(
      `INSERT INTO presupuestos
        (cliente_id, idioma_origen, idioma_destino, tipo_documento, palabras_estimadas, precio_estimado, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [cliente_id, idioma_origen, idioma_destino, tipo_documento, palabras_estimadas || null, precio_estimado || null, notas]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear presupuesto' });
  }
}

async function cambiarEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'aceptado', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    const resultado = await pool.query(
      'UPDATE presupuestos SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
}

async function convertirEnEncargo(req, res) {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;

    await cliente.query('BEGIN');

    const presupuesto = await cliente.query('SELECT * FROM presupuestos WHERE id=$1 FOR UPDATE', [id]);
    if (presupuesto.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    const p = presupuesto.rows[0];
    if (p.encargo_id) {
      await cliente.query('ROLLBACK');
      return res.status(400).json({ error: 'Este presupuesto ya fue convertido en encargo' });
    }

    const encargo = await cliente.query(
      `INSERT INTO encargos (cliente_id, idioma_origen, idioma_destino, tipo_documento, precio, notas)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.cliente_id, p.idioma_origen, p.idioma_destino, p.tipo_documento, p.precio_estimado, p.notas]
    );

    const actualizado = await cliente.query(
      `UPDATE presupuestos SET estado='aceptado', encargo_id=$1 WHERE id=$2 RETURNING *`,
      [encargo.rows[0].id, id]
    );

    await cliente.query('COMMIT');
    res.status(201).json({ presupuesto: actualizado.rows[0], encargo: encargo.rows[0] });
  } catch (err) {
    await cliente.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al convertir el presupuesto en encargo' });
  } finally {
    cliente.release();
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM presupuestos WHERE id=$1 RETURNING id', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json({ mensaje: 'Presupuesto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
}

module.exports = { listar, obtener, crear, cambiarEstado, convertirEnEncargo, eliminar };
