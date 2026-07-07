const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

function contarPalabras(texto) {
  return texto
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// pdf-parse debe correr en un proceso aparte: cargar tesseract.js en el mismo proceso
// que pdf-parse corrompe el parseo del xref de algunos PDFs (ver pdfParseWorker.js).
function parsearPdfEnProcesoAparte(rutaArchivo) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [path.join(__dirname, 'pdfParseWorker.js'), rutaArchivo],
      { maxBuffer: 20 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        let resultado;
        try {
          resultado = JSON.parse(stdout);
        } catch {
          // Salida del proceso hijo corrupta (p. ej. un aviso de una dependencia
          // mezclado con el JSON) — se rechaza la promesa en vez de dejar que el
          // JSON.parse lance de forma asíncrona, lo que tumbaría el proceso entero.
          return reject(new Error('El proceso de extracción de PDF devolvió una respuesta inválida'));
        }
        if (resultado.error) return reject(new Error(resultado.error));
        resolve(resultado);
      }
    );
  });
}

// Umbral por debajo del cual se desconfía del texto que dio pdf-parse: documentos
// firmados digitalmente suelen llevar en cada página un pie con el sello de firma
// (texto real y seleccionable) por encima de un cuerpo que en realidad es una imagen
// escaneada. Eso hace que pdf-parse encuentre "algo" de texto (el pie) y no dispare
// el camino de OCR, aunque el contenido real del documento no se haya leído.
const UMBRAL_PALABRAS_POR_PAGINA = 40;

// PDF escaneado (sin capa de texto seleccionable): pdf-parse devuelve 0 palabras.
// Se rasteriza cada página a imagen y se pasa por el mismo OCR que ya se usa para
// fotos/imágenes. pdf-to-img es un paquete ESM-only; se importa dinámicamente porque
// este archivo es CommonJS.
async function extraerPalabrasPdfEscaneado(rutaArchivo) {
  const { pdf } = await import('pdf-to-img');
  const documento = await pdf(rutaArchivo, { scale: 2 });
  let totalPalabras = 0;
  for await (const imagenPagina of documento) {
    const { data } = await Tesseract.recognize(imagenPagina, 'spa+eng');
    totalPalabras += contarPalabras(data.text);
  }
  return totalPalabras;
}

async function extraerPalabras(rutaArchivo) {
  const ext = path.extname(rutaArchivo).toLowerCase();

  try {
    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ path: rutaArchivo });
      return contarPalabras(value);
    }

    if (ext === '.pdf') {
      const { texto, paginas } = await parsearPdfEnProcesoAparte(rutaArchivo);
      const palabras = contarPalabras(texto);
      const promedioPorPagina = palabras / (paginas || 1);
      if (palabras > 0 && promedioPorPagina >= UMBRAL_PALABRAS_POR_PAGINA) {
        return palabras;
      }
      // 0 palabras (escaneado) o muy pocas por página (posible pie de firma
      // digital sobre un cuerpo escaneado): OCR página por página.
      return await extraerPalabrasPdfEscaneado(rutaArchivo);
    }

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const { data } = await Tesseract.recognize(rutaArchivo, 'spa+eng');
      return contarPalabras(data.text);
    }

    if (ext === '.webp') {
      const rutaTemporal = rutaArchivo.replace('.webp', '-convertido.png');
      await sharp(rutaArchivo).png().toFile(rutaTemporal);
      const { data } = await Tesseract.recognize(rutaTemporal, 'spa+eng');
      fs.unlinkSync(rutaTemporal);
      return contarPalabras(data.text);
    }

    // .doc, .txt u otros formatos no soportados por ahora
    return null;
  } catch (err) {
    console.error('Error al extraer texto:', err.message);
    return null;
  }
}

module.exports = { extraerPalabras };
