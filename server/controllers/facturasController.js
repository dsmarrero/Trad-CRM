const pool = require('../config/db');
const { enviarRecordatorioImpagoACliente } = require('../utils/recordatorios');

async function listar(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT f.*, e.tipo_documento, c.nombre AS cliente_nombre
       FROM facturas f
       JOIN encargos e ON f.encargo_id = e.id
       JOIN clientes c ON e.cliente_id = c.id
       ORDER BY f.fecha_emision DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar facturas' });
  }
}

async function obtener(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM facturas WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
}

async function generarNumero(cliente) {
  const año = new Date().getFullYear();
  const resultado = await cliente.query(
    `SELECT numero FROM facturas WHERE numero LIKE $1 ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    [`F-${año}-%`]
  );
  let siguiente = 1;
  if (resultado.rows.length > 0) {
    const partes = resultado.rows[0].numero.split('-');
    siguiente = parseInt(partes[2], 10) + 1;
  }
  return `F-${año}-${String(siguiente).padStart(3, '0')}`;
}

async function crear(req, res) {
  const { encargo_id, importe, fecha_pago } = req.body;
  if (!encargo_id || !importe) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const numero = await generarNumero(cliente);

    const resultado = await cliente.query(
      `INSERT INTO facturas (encargo_id, numero, importe, fecha_pago)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [encargo_id, numero, importe, fecha_pago || null]
    );

    // marcar el encargo como facturado
    await cliente.query(`UPDATE encargos SET estado='facturado' WHERE id=$1`, [encargo_id]);

    await cliente.query('COMMIT');
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    await cliente.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear factura' });
  } finally {
    cliente.release();
  }
}

async function marcarPagada(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `UPDATE facturas SET estado_pago='pagada', fecha_pago=CURRENT_DATE WHERE id=$1 RETURNING *`,
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar factura como pagada' });
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM facturas WHERE id=$1 RETURNING id', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json({ mensaje: 'Factura eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar factura' });
  }
}

async function enviarRecordatorio(req, res) {
  try {
    const { id } = req.params;
    const resultado = await enviarRecordatorioImpagoACliente(id);
    if (!resultado.enviado) {
      return res.status(503).json({ error: 'SMTP no configurado en el servidor' });
    }
    res.json({ mensaje: 'Recordatorio enviado' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al enviar el recordatorio' });
  }
}

function escaparCSV(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

async function exportar(req, res) {
  try {
    const { desde, hasta } = req.query;
    const condiciones = [];
    const params = [];
    if (desde) {
      params.push(desde);
      condiciones.push(`f.fecha_emision >= $${params.length}`);
    }
    if (hasta) {
      params.push(hasta);
      condiciones.push(`f.fecha_emision <= $${params.length}`);
    }
    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const resultado = await pool.query(
      `SELECT f.numero, f.fecha_emision, f.fecha_pago, f.importe, f.estado_pago,
              c.nombre AS cliente_nombre, e.tipo_documento
       FROM facturas f
       JOIN encargos e ON f.encargo_id = e.id
       JOIN clientes c ON e.cliente_id = c.id
       ${where}
       ORDER BY f.fecha_emision ASC`,
      params
    );

    const cabecera = ['Numero', 'Fecha emision', 'Fecha pago', 'Importe', 'Estado pago', 'Cliente', 'Tipo documento'];
    const filas = resultado.rows.map((f) => [
      f.numero, f.fecha_emision, f.fecha_pago, f.importe, f.estado_pago, f.cliente_nombre, f.tipo_documento
    ].map(escaparCSV).join(','));

    const csv = [cabecera.join(','), ...filas].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="facturas.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar facturas' });
  }
}

module.exports = { listar, obtener, crear, marcarPagada, eliminar, exportar, enviarRecordatorio };
