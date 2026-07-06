const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

function contarPalabras(texto) {
  return texto
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function extraerPalabras(rutaArchivo) {
  const ext = path.extname(rutaArchivo).toLowerCase();

  try {
    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ path: rutaArchivo });
      return contarPalabras(value);
    }

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(rutaArchivo);
      const data = await pdfParse(buffer);
      return contarPalabras(data.text);
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
