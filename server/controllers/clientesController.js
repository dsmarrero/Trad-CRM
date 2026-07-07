const pool = require('../config/db');

async function listar(req, res) {
  try {
    const resultado = await pool.query('SELECT * FROM clientes ORDER BY creado_en DESC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar clientes' });
  }
}

async function obtener(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
}

async function crear(req, res) {
  try {
    const { nombre, email, telefono, empresa, nif, direccion, notas } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!direccion) {
      return res.status(400).json({ error: 'La dirección es obligatoria' });
    }
    const resultado = await pool.query(
      'INSERT INTO clientes (nombre, email, telefono, empresa, nif, direccion, notas) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [nombre, email, telefono, empresa, nif, direccion, notas]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
}

async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, empresa, nif, direccion, notas } = req.body;
    if (!direccion) {
      return res.status(400).json({ error: 'La dirección es obligatoria' });
    }
    const resultado = await pool.query(
      `UPDATE clientes SET nombre=$1, email=$2, telefono=$3, empresa=$4, nif=$5, direccion=$6, notas=$7
       WHERE id=$8 RETURNING *`,
      [nombre, email, telefono, empresa, nif, direccion, notas, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM clientes WHERE id=$1 RETURNING id', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ mensaje: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
}

async function listarNotas(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `SELECT n.*, u.nombre AS autor_nombre
       FROM cliente_notas n
       LEFT JOIN usuarios u ON n.usuario_id = u.id
       WHERE n.cliente_id = $1
       ORDER BY n.creado_en DESC`,
      [id]
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar notas' });
  }
}

async function crearNota(req, res) {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    if (!texto) {
      return res.status(400).json({ error: 'El texto de la nota es obligatorio' });
    }
    const resultado = await pool.query(
      `INSERT INTO cliente_notas (cliente_id, usuario_id, texto)
       VALUES ($1,$2,$3) RETURNING *`,
      [id, req.usuario.id, texto]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear nota' });
  }
}

async function eliminarNota(req, res) {
  try {
    const { notaId } = req.params;
    const resultado = await pool.query('DELETE FROM cliente_notas WHERE id=$1 RETURNING id', [notaId]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    res.json({ mensaje: 'Nota eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, listarNotas, crearNota, eliminarNota };
