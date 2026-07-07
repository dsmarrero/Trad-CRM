const pool = require('../config/db');

async function listar(req, res) {
  try {
    const { cliente_id } = req.query;
    const condiciones = cliente_id ? 'WHERE e.cliente_id = $1' : '';
    const params = cliente_id ? [cliente_id] : [];
    const resultado = await pool.query(
      `SELECT e.*, c.nombre AS cliente_nombre
       FROM encargos e
       JOIN clientes c ON e.cliente_id = c.id
       ${condiciones}
       ORDER BY e.creado_en DESC`,
      params
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar encargos' });
  }
}

async function obtener(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM encargos WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Encargo no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener encargo' });
  }
}

async function crear(req, res) {
  try {
    const {
      cliente_id, idioma_origen, idioma_destino, tipo_documento,
      estado, fecha_entrega, precio, notas
    } = req.body;

    if (!cliente_id || !idioma_origen || !idioma_destino) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const resultado = await pool.query(
      `INSERT INTO encargos
        (cliente_id, idioma_origen, idioma_destino, tipo_documento, estado, fecha_entrega, precio, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [cliente_id, idioma_origen, idioma_destino, tipo_documento, estado || 'recibido', fecha_entrega || null, precio === '' ? null : precio, notas]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear encargo' });
  }
}

async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const {
      cliente_id, idioma_origen, idioma_destino, tipo_documento,
      estado, fecha_entrega, precio, notas
    } = req.body;

    const resultado = await pool.query(
      `UPDATE encargos SET
        cliente_id=$1, idioma_origen=$2, idioma_destino=$3, tipo_documento=$4,
        estado=$5, fecha_entrega=$6, precio=$7, notas=$8
       WHERE id=$9 RETURNING *`,
      [cliente_id, idioma_origen, idioma_destino, tipo_documento, estado, fecha_entrega || null, precio === '' ? null : precio, notas, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Encargo no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar encargo' });
  }
}

async function cambiarEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['recibido', 'en_curso', 'entregado', 'facturado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    const resultado = await pool.query(
      'UPDATE encargos SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Encargo no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
}

async function actualizarPrecio(req, res) {
  try {
    const { id } = req.params;
    const { precio } = req.body;
    const resultado = await pool.query(
      'UPDATE encargos SET precio=$1 WHERE id=$2 RETURNING *',
      [precio, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Encargo no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar precio' });
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM encargos WHERE id=$1 RETURNING id', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Encargo no encontrado' });
    }
    res.json({ mensaje: 'Encargo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar encargo' });
  }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, actualizarPrecio, eliminar };
