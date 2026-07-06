const pool = require('../config/db');

async function resumen(req, res) {
  try {
    const [clientes, pendientes, facturacionMes, pagosPendientes, proximaEntrega] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clientes'),
      pool.query(`SELECT COUNT(*) FROM encargos WHERE estado != 'facturado'`),
      pool.query(
        `SELECT COALESCE(SUM(importe), 0) AS total FROM facturas
         WHERE date_trunc('month', fecha_emision) = date_trunc('month', CURRENT_DATE)`
      ),
      pool.query(`SELECT COALESCE(SUM(importe), 0) AS total FROM facturas WHERE estado_pago = 'pendiente'`),
      pool.query(
        `SELECT e.*, c.nombre AS cliente_nombre FROM encargos e
         JOIN clientes c ON e.cliente_id = c.id
         WHERE e.estado != 'facturado' AND e.fecha_entrega IS NOT NULL
         ORDER BY e.fecha_entrega ASC LIMIT 5`
      )
    ]);

    res.json({
      total_clientes: Number(clientes.rows[0].count),
      encargos_pendientes: Number(pendientes.rows[0].count),
      facturacion_mes: Number(facturacionMes.rows[0].total),
      pagos_pendientes: Number(pagosPendientes.rows[0].total),
      proximas_entregas: proximaEntrega.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar el resumen' });
  }
}

async function rentabilidad(req, res) {
  try {
    const porIdioma = await pool.query(
      `SELECT idioma_origen, idioma_destino,
              COUNT(*) AS encargos,
              COALESCE(SUM(precio), 0) AS total_facturado,
              COALESCE(SUM(d.palabras), 0) AS total_palabras,
              CASE WHEN COALESCE(SUM(d.palabras), 0) = 0 THEN NULL
                   ELSE ROUND(SUM(e.precio) / SUM(d.palabras), 4) END AS precio_por_palabra
       FROM encargos e
       LEFT JOIN documentos d ON d.encargo_id = e.id AND d.tipo = 'original'
       WHERE e.precio IS NOT NULL
       GROUP BY idioma_origen, idioma_destino
       ORDER BY total_facturado DESC`
    );

    const porTipoDocumento = await pool.query(
      `SELECT COALESCE(tipo_documento, 'Sin especificar') AS tipo_documento,
              COUNT(*) AS encargos,
              COALESCE(SUM(precio), 0) AS total_facturado
       FROM encargos
       WHERE precio IS NOT NULL
       GROUP BY tipo_documento
       ORDER BY total_facturado DESC`
    );

    res.json({
      por_idioma: porIdioma.rows,
      por_tipo_documento: porTipoDocumento.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular rentabilidad' });
  }
}

async function calendario(req, res) {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Faltan los parámetros desde y hasta' });
    }

    const [entregas, bloqueados] = await Promise.all([
      pool.query(
        `SELECT e.id, e.fecha_entrega, e.estado, e.tipo_documento, c.nombre AS cliente_nombre
         FROM encargos e
         JOIN clientes c ON e.cliente_id = c.id
         WHERE e.fecha_entrega BETWEEN $1 AND $2
         ORDER BY e.fecha_entrega ASC`,
        [desde, hasta]
      ),
      pool.query(
        `SELECT id, fecha, motivo FROM dias_no_disponibles
         WHERE usuario_id = $1 AND fecha BETWEEN $2 AND $3
         ORDER BY fecha ASC`,
        [req.usuario.id, desde, hasta]
      )
    ]);

    res.json({ entregas: entregas.rows, dias_bloqueados: bloqueados.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar el calendario' });
  }
}

module.exports = { resumen, rentabilidad, calendario };
