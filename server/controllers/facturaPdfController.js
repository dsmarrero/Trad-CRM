const PDFDocument = require('pdfkit');
const path = require('path');
const pool = require('../config/db');

const NARANJA = '#F5641E';
const GRIS_OSCURO = '#1A1F2B';
const GRIS = '#5A6472';
const VERDE_CLARO = '#E7F6EE';

const EMISOR = {
  nombre: 'Daniel Santana Marrero',
  direccion: 'Calle Ingeniero Salinas, 80 1º izquierda',
  ciudad: '35006 – Las Palmas (Spain)',
  nif: 'NIF 78502740Z',
  email: 'daniel@dsantana.com',
  telefono: '+34 668 886 181',
  banco: 'CAHMESMMXXX ES21 2038 7198 59 3000081142 (Bankia)'
};

async function generarPDF(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `SELECT f.*, e.tipo_documento, e.idioma_origen, e.idioma_destino,
              c.nombre AS cliente_nombre, c.email AS cliente_email, c.empresa AS cliente_empresa
       FROM facturas f
       JOIN encargos e ON f.encargo_id = e.id
       JOIN clientes c ON e.cliente_id = c.id
       WHERE f.id = $1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    const f = resultado.rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=factura-${f.numero}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    doc.pipe(res);

    const anchoPagina = doc.page.width;
    const margenX = 40;

    // Barra superior naranja
    doc.rect(0, 0, anchoPagina, 12).fill(NARANJA);

    // Cabecera: datos emisor (izq) + logo (dcha)
    let y = 45;
    doc.fillColor(GRIS_OSCURO).fontSize(15).font('Helvetica-Bold')
      .text(EMISOR.nombre, margenX, y);
    doc.fillColor(GRIS_OSCURO).fontSize(9).font('Helvetica')
      .text(EMISOR.direccion, margenX, y + 22)
      .text(EMISOR.ciudad, margenX, y + 35)
      .text(EMISOR.nif, margenX, y + 48);
    doc.fillColor(GRIS_OSCURO).fontSize(9)
      .text(`E-mail: ${EMISOR.email}`, margenX, y + 68)
      .text(`Phone: ${EMISOR.telefono}`, margenX, y + 81);

    try {
      doc.image(path.join(__dirname, '..', 'assets', 'logo.png'), anchoPagina - 240, y, { width: 200 });
    } catch (e) { /* si no hay logo, continúa sin él */ }

    y += 120;
    doc.moveTo(margenX, y).lineTo(anchoPagina - margenX, y).strokeColor('#E7E9ED').stroke();

    // Cliente + fecha/nº factura
    y += 20;
    doc.fillColor(GRIS_OSCURO).fontSize(11).font('Helvetica')
      .text(f.cliente_nombre, margenX, y);
    if (f.cliente_empresa) {
      doc.fillColor(GRIS).fontSize(9).text(f.cliente_empresa, margenX, y + 16);
    }

    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
      .text('Date: ', anchoPagina - 200, y, { continued: true })
      .font('Helvetica')
      .text(new Date(f.fecha_emision).toLocaleDateString('es-ES'));
    doc.font('Helvetica-Bold')
      .text('Invoice No: ', anchoPagina - 200, y + 16, { continued: true })
      .font('Helvetica')
      .text(f.numero);

    // Tabla concepto/importe
    y += 60;
    const anchoTabla = anchoPagina - margenX * 2;
    const anchoImporte = 110;
    const anchoConcepto = anchoTabla - anchoImporte;

    doc.rect(margenX, y, anchoTabla, 24).fill(NARANJA);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('Concept', margenX + 10, y + 7)
      .text('Amount (EUR)', margenX + anchoConcepto, y + 7, { width: anchoImporte - 10, align: 'right' });

    y += 24;
    const concepto = `${f.tipo_documento || 'Traducción jurada'} (${f.idioma_origen}/${f.idioma_destino})`;
    doc.rect(margenX, y, anchoTabla, 24).strokeColor('#E7E9ED').stroke();
    doc.fillColor(GRIS_OSCURO).fontSize(9).font('Helvetica')
      .text(concepto, margenX + 10, y + 7, { width: anchoConcepto - 20 })
      .text(Number(f.importe).toFixed(2), margenX + anchoConcepto, y + 7, { width: anchoImporte - 10, align: 'right' });

    // Recuadro método de pago (izq) + totales (dcha)
    y += 45;
    const anchoRecuadro = 300;
    doc.rect(margenX, y, anchoRecuadro, 90).strokeColor(GRIS_OSCURO).stroke();
    doc.fillColor(GRIS_OSCURO).fontSize(9).font('Helvetica-Bold')
      .text('PAYMENT METHOD:', margenX + 10, y + 12);
    doc.font('Helvetica-Bold').fontSize(8)
      .text('Bank transfer:', margenX + 10, y + 32, { continued: false });
    doc.font('Helvetica').fontSize(8)
      .text(EMISOR.banco, margenX + 10, y + 44, { width: anchoRecuadro - 20 });
    doc.font('Helvetica-Bold').fontSize(8)
      .text('Holder:', margenX + 10, y + 66);
    doc.font('Helvetica').fontSize(8)
      .text(`${EMISOR.nombre}, ${EMISOR.direccion}`, margenX + 60, y + 66, { width: anchoRecuadro - 70 });

    const xTotales = margenX + anchoRecuadro + 30;
    const anchoTotales = anchoTabla - anchoRecuadro - 30;
    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
      .text('TAX BASE', xTotales, y + 5, { width: anchoTotales - 60, align: 'right' })
      .fillColor(GRIS_OSCURO).font('Helvetica')
      .text(Number(f.importe).toFixed(2), xTotales + anchoTotales - 60, y + 5, { width: 60, align: 'right' });

    doc.moveTo(xTotales, y + 25).lineTo(xTotales + anchoTotales, y + 25).strokeColor('#E7E9ED').stroke();

    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
      .text('VAT', xTotales, y + 33, { width: anchoTotales - 60, align: 'right' })
      .fillColor(GRIS_OSCURO).font('Helvetica')
      .text('0.0 Exempt', xTotales, y + 33, { width: anchoTotales, align: 'right' });

    doc.rect(xTotales, y + 55, anchoTotales, 26).fill(VERDE_CLARO);
    doc.fillColor(NARANJA).fontSize(10).font('Helvetica-Bold')
      .text('TOTAL', xTotales + 10, y + 63);
    doc.fillColor(GRIS_OSCURO).fontSize(11)
      .text(`${Number(f.importe).toFixed(2)} €`, xTotales, y + 63, { width: anchoTotales - 10, align: 'right' });

    // Barra inferior naranja
    doc.rect(0, doc.page.height - 12, anchoPagina, 12).fill(NARANJA);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
}

module.exports = { generarPDF };
