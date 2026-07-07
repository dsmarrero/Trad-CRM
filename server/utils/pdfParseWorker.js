// Proceso hijo aislado: parsear el PDF aquí, en un proceso nuevo que nunca carga
// tesseract.js, evita un conflicto de dependencias detectado entre tesseract.js y
// pdf-parse que corrompe el parseo del xref de ciertos PDFs (incluidas facturas
// generadas por esta misma app) cuando ambas librerías conviven en el mismo proceso.
const fs = require('fs');
const pdfParse = require('pdf-parse');

const rutaArchivo = process.argv[2];

pdfParse(fs.readFileSync(rutaArchivo))
  .then((data) => {
    process.stdout.write(JSON.stringify({ texto: data.text, paginas: data.numpages }));
  })
  .catch((err) => {
    process.stdout.write(JSON.stringify({ error: err.message }));
  });
