const pool = require('../config/db');
const { enviarEmail } = require('../config/mailer');

const DIAS_ANTES_ENTREGA = Number(process.env.RECORDATORIO_DIAS_ENTREGA || 3);
const DIAS_IMPAGO = Number(process.env.RECORDATORIO_DIAS_IMPAGO || 15);

async function obtenerEntregasProximas() {
  const resultado = await pool.query(
    `SELECT e.id, e.fecha_entrega, e.tipo_documento, c.nombre AS cliente_nombre
     FROM encargos e
     JOIN clientes c ON e.cliente_id = c.id
     WHERE e.estado != 'entregado' AND e.estado != 'facturado'
       AND e.fecha_entrega IS NOT NULL
       AND e.fecha_entrega BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::int
     ORDER BY e.fecha_entrega ASC`,
    [DIAS_ANTES_ENTREGA]
  );
  return resultado.rows;
}

async function obtenerFacturasImpagadas() {
  const resultado = await pool.query(
    `SELECT f.id, f.numero, f.importe, f.fecha_emision, c.nombre AS cliente_nombre, c.email AS cliente_email
     FROM facturas f
     JOIN encargos e ON f.encargo_id = e.id
     JOIN clientes c ON e.cliente_id = c.id
     WHERE f.estado_pago = 'pendiente'
       AND f.fecha_emision <= CURRENT_DATE - $1::int
     ORDER BY f.fecha_emision ASC`,
    [DIAS_IMPAGO]
  );
  return resultado.rows;
}

function construirHtmlResumenInterno(entregas, facturas) {
  const filasEntregas = entregas.length > 0
    ? entregas.map((e) => `<li>${e.cliente_nombre} — ${e.tipo_documento || 'documento'} — entrega ${new Date(e.fecha_entrega).toLocaleDateString('es-ES')}</li>`).join('')
    : '<li>Sin entregas próximas.</li>';

  const filasFacturas = facturas.length > 0
    ? facturas.map((f) => `<li>${f.numero} — ${f.cliente_nombre} — ${Number(f.importe).toFixed(2)} € (emitida ${new Date(f.fecha_emision).toLocaleDateString('es-ES')})</li>`).join('')
    : '<li>Sin facturas pendientes de cobro con retraso.</li>';

  return `
    <h2>Resumen diario — Trad-CRM</h2>
    <h3>Entregas en los próximos ${DIAS_ANTES_ENTREGA} días</h3>
    <ul>${filasEntregas}</ul>
    <h3>Facturas pendientes de cobro (+${DIAS_IMPAGO} días)</h3>
    <ul>${filasFacturas}</ul>
  `;
}

// Envía un resumen interno diario (entregas próximas + impagos) a los usuarios del CRM.
// No contacta a clientes — es solo un aviso para el traductor/admin.
async function enviarResumenInterno() {
  const [entregas, facturas] = await Promise.all([
    obtenerEntregasProximas(),
    obtenerFacturasImpagadas()
  ]);

  if (entregas.length === 0 && facturas.length === 0) {
    return { enviado: false, motivo: 'sin novedades' };
  }

  const usuarios = await pool.query('SELECT email FROM usuarios');
  const html = construirHtmlResumenInterno(entregas, facturas);

  const resultados = await Promise.all(
    usuarios.rows.map((u) => enviarEmail({
      to: u.email,
      subject: 'Resumen diario: entregas próximas y facturas pendientes',
      html
    }))
  );

  return { enviado: true, destinatarios: usuarios.rows.length, resultados };
}

// Envía un recordatorio de impago a un cliente concreto (acción explícita, no automática).
async function enviarRecordatorioImpagoACliente(facturaId) {
  const resultado = await pool.query(
    `SELECT f.numero, f.importe, f.fecha_emision, c.nombre AS cliente_nombre, c.email AS cliente_email
     FROM facturas f
     JOIN encargos e ON f.encargo_id = e.id
     JOIN clientes c ON e.cliente_id = c.id
     WHERE f.id = $1`,
    [facturaId]
  );

  if (resultado.rows.length === 0) {
    throw new Error('Factura no encontrada');
  }
  const f = resultado.rows[0];
  if (!f.cliente_email) {
    throw new Error('El cliente no tiene email registrado');
  }

  const html = `
    <p>Estimado/a ${f.cliente_nombre},</p>
    <p>Le recordamos que la factura <strong>${f.numero}</strong> por importe de <strong>${Number(f.importe).toFixed(2)} €</strong>,
    emitida el ${new Date(f.fecha_emision).toLocaleDateString('es-ES')}, se encuentra pendiente de pago.</p>
    <p>Quedamos a su disposición para cualquier aclaración.</p>
    <p>Un saludo.</p>
  `;

  return enviarEmail({ to: f.cliente_email, subject: `Recordatorio de pago — factura ${f.numero}`, html });
}

module.exports = {
  obtenerEntregasProximas,
  obtenerFacturasImpagadas,
  enviarResumenInterno,
  enviarRecordatorioImpagoACliente
};
