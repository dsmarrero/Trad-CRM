const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const GRIS_OSCURO = '#1A1F2B';
const GRIS = '#5A6472';

const TRADUCCIONES = {
  es: {
    locale: 'es-ES',
    email: 'Correo electrónico: ',
    telefono: 'Teléfono: ',
    fecha: 'Fecha: ',
    numeroFactura: 'Nº de factura: ',
    nif: 'NIF/CIF: ',
    concepto: 'Concepto',
    importe: 'Importe (EUR)',
    conceptoPorDefecto: 'Traducción jurada',
    impuesto: { iva: 'IVA', igic: 'IGIC', otro: 'IMPUESTO' },
    exento: '0,0 Exento',
    metodoPago: 'MÉTODO DE PAGO:',
    transferencia: 'Transferencia bancaria:',
    titular: 'Titular:',
    baseImponible: 'BASE IMPONIBLE',
    retencionIrpf: 'RETENCIÓN IRPF',
    total: 'TOTAL'
  },
  en: {
    locale: 'en-GB',
    email: 'E-mail: ',
    telefono: 'Phone: ',
    fecha: 'Date: ',
    numeroFactura: 'Invoice No: ',
    nif: 'NIF/CIF: ',
    concepto: 'Concept',
    importe: 'Amount (EUR)',
    conceptoPorDefecto: 'Sworn translation',
    impuesto: { iva: 'VAT (IVA)', igic: 'IGIC', otro: 'TAX' },
    exento: '0.0 Exempt',
    metodoPago: 'PAYMENT METHOD:',
    transferencia: 'Bank transfer:',
    titular: 'Holder:',
    baseImponible: 'TAX BASE',
    retencionIrpf: 'IRPF WITHHOLDING',
    total: 'TOTAL'
  }
};

async function generarPDF(req, res) {
  try {
    const { id } = req.params;
    const idioma = req.query.idioma === 'en' ? 'en' : 'es';
    const t = TRADUCCIONES[idioma];
    const resultado = await pool.query(
      `SELECT f.*, e.tipo_documento, e.idioma_origen, e.idioma_destino,
              c.nombre AS cliente_nombre, c.email AS cliente_email, c.empresa AS cliente_empresa,
              c.nif AS cliente_nif, c.direccion AS cliente_direccion
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

    const usuarioResultado = await pool.query(
      `SELECT factura_nombre, factura_direccion, factura_ciudad, factura_nif, factura_email,
              factura_telefono, factura_metodo_pago, factura_logo_url,
              factura_color_primario, factura_color_secundario
       FROM usuarios WHERE id=$1`,
      [req.usuario.id]
    );
    const cfg = usuarioResultado.rows[0] || {};
    const EMISOR = {
      nombre: cfg.factura_nombre,
      direccion: cfg.factura_direccion,
      ciudad: cfg.factura_ciudad,
      nif: cfg.factura_nif,
      email: cfg.factura_email,
      telefono: cfg.factura_telefono,
      banco: cfg.factura_metodo_pago
    };
    const NARANJA = cfg.factura_color_primario || '#F5641E';
    const VERDE_CLARO = cfg.factura_color_secundario || '#E7F6EE';
    const rutaLogo = cfg.factura_logo_url
      ? path.join(__dirname, '..', cfg.factura_logo_url)
      : path.join(__dirname, '..', 'assets', 'logo.png');

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
      .text(`${t.email}${EMISOR.email}`, margenX, y + 68)
      .text(`${t.telefono}${EMISOR.telefono}`, margenX, y + 81);

    try {
      if (fs.existsSync(rutaLogo)) {
        doc.image(rutaLogo, anchoPagina - 240, y, { width: 200 });
      }
    } catch (e) { /* si no hay logo, continúa sin él */ }

    y += 120;
    doc.moveTo(margenX, y).lineTo(anchoPagina - margenX, y).strokeColor('#E7E9ED').stroke();

    // Cliente + fecha/nº factura
    y += 20;
    let yCliente = y;
    doc.fillColor(GRIS_OSCURO).fontSize(11).font('Helvetica')
      .text(f.cliente_nombre, margenX, yCliente);
    yCliente += 16;
    if (f.cliente_empresa) {
      doc.fillColor(GRIS).fontSize(9).text(f.cliente_empresa, margenX, yCliente);
      yCliente += 13;
    }
    if (f.cliente_direccion) {
      doc.fillColor(GRIS).fontSize(9).text(f.cliente_direccion, margenX, yCliente, { width: 280 });
      yCliente += 13;
    }
    if (f.cliente_nif) {
      doc.fillColor(GRIS).fontSize(9).text(`${t.nif}${f.cliente_nif}`, margenX, yCliente);
      yCliente += 13;
    }

    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
      .text(t.fecha, anchoPagina - 200, y, { continued: true })
      .font('Helvetica')
      .text(new Date(f.fecha_emision).toLocaleDateString(t.locale));
    doc.font('Helvetica-Bold')
      .text(t.numeroFactura, anchoPagina - 200, y + 16, { continued: true })
      .font('Helvetica')
      .text(f.numero);

    // Tabla concepto/importe
    y = Math.max(yCliente, y + 32) + 20;
    const anchoTabla = anchoPagina - margenX * 2;
    const anchoImporte = 110;
    const anchoConcepto = anchoTabla - anchoImporte;

    doc.rect(margenX, y, anchoTabla, 24).fill(NARANJA);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text(t.concepto, margenX + 10, y + 7)
      .text(t.importe, margenX + anchoConcepto, y + 7, { width: anchoImporte - 10, align: 'right' });

    y += 24;
    const concepto = `${f.tipo_documento || t.conceptoPorDefecto} (${f.idioma_origen}/${f.idioma_destino})`;
    doc.rect(margenX, y, anchoTabla, 24).strokeColor('#E7E9ED').stroke();
    doc.fillColor(GRIS_OSCURO).fontSize(9).font('Helvetica')
      .text(concepto, margenX + 10, y + 7, { width: anchoConcepto - 20 })
      .text(Number(f.importe).toFixed(2), margenX + anchoConcepto, y + 7, { width: anchoImporte - 10, align: 'right' });

    const porcentajeImpuesto = Number(f.porcentaje_impuesto) || 0;
    const baseImponible = Number(f.importe);
    const importeImpuesto = f.tipo_impuesto === 'exento' ? 0 : baseImponible * (porcentajeImpuesto / 100);
    const etiquetaImpuesto = t.impuesto[f.tipo_impuesto] || t.impuesto.otro;
    const valorImpuesto = f.tipo_impuesto === 'exento'
      ? t.exento
      : `${porcentajeImpuesto}% (${importeImpuesto.toFixed(2)})`;

    const hayRetencion = !!f.aplica_retencion_irpf;
    const porcentajeRetencion = Number(f.porcentaje_retencion_irpf) || 0;
    const importeRetencion = hayRetencion ? baseImponible * (porcentajeRetencion / 100) : 0;

    const total = baseImponible + importeImpuesto - importeRetencion;

    // Recuadro método de pago (izq) + totales (dcha)
    y += 45;
    const anchoRecuadro = 300;
    const altoRecuadro = hayRetencion ? 118 : 90;
    doc.rect(margenX, y, anchoRecuadro, altoRecuadro).strokeColor(GRIS_OSCURO).stroke();
    doc.fillColor(GRIS_OSCURO).fontSize(9).font('Helvetica-Bold')
      .text(t.metodoPago, margenX + 10, y + 12);
    doc.font('Helvetica-Bold').fontSize(8)
      .text(t.transferencia, margenX + 10, y + 32, { continued: false });
    doc.font('Helvetica').fontSize(8)
      .text(EMISOR.banco, margenX + 10, y + 44, { width: anchoRecuadro - 20 });
    doc.font('Helvetica-Bold').fontSize(8)
      .text(t.titular, margenX + 10, y + 66);
    doc.font('Helvetica').fontSize(8)
      .text(`${EMISOR.nombre}, ${EMISOR.direccion}`, margenX + 60, y + 66, { width: anchoRecuadro - 70 });

    const xTotales = margenX + anchoRecuadro + 30;
    const anchoTotales = anchoTabla - anchoRecuadro - 30;
    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
      .text(t.baseImponible, xTotales, y + 5, { width: anchoTotales - 60, align: 'right' })
      .fillColor(GRIS_OSCURO).font('Helvetica')
      .text(baseImponible.toFixed(2), xTotales + anchoTotales - 60, y + 5, { width: 60, align: 'right' });

    doc.moveTo(xTotales, y + 25).lineTo(xTotales + anchoTotales, y + 25).strokeColor('#E7E9ED').stroke();

    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
      .text(etiquetaImpuesto, xTotales, y + 33, { width: anchoTotales - 60, align: 'right' })
      .fillColor(GRIS_OSCURO).font('Helvetica')
      .text(valorImpuesto, xTotales, y + 33, { width: anchoTotales, align: 'right' });

    let yTotalBox = y + 55;
    if (hayRetencion) {
      doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold')
        .text(t.retencionIrpf, xTotales, y + 51, { width: anchoTotales - 60, align: 'right' })
        .fillColor(GRIS_OSCURO).font('Helvetica')
        .text(`-${porcentajeRetencion}% (-${importeRetencion.toFixed(2)})`, xTotales, y + 51, { width: anchoTotales, align: 'right' });
      yTotalBox = y + 83;
    }

    doc.rect(xTotales, yTotalBox, anchoTotales, 26).fill(VERDE_CLARO);
    doc.fillColor(NARANJA).fontSize(10).font('Helvetica-Bold')
      .text(t.total, xTotales + 10, yTotalBox + 8);
    doc.fillColor(GRIS_OSCURO).fontSize(11)
      .text(`${total.toFixed(2)} €`, xTotales, yTotalBox + 8, { width: anchoTotales - 10, align: 'right' });

    // Barra inferior naranja
    doc.rect(0, doc.page.height - 12, anchoPagina, 12).fill(NARANJA);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
}

module.exports = { generarPDF };
