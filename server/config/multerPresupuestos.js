const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const clienteId = req.body.cliente_id;
      if (!clienteId) return cb(new Error('Falta cliente_id'));

      const resultado = await pool.query('SELECT id FROM clientes WHERE id=$1', [clienteId]);
      if (resultado.rows.length === 0) return cb(new Error('Cliente no encontrado'));

      const carpeta = path.join(__dirname, '..', 'uploads', 'presupuestos', `cliente_${clienteId}`);
      fs.mkdirSync(carpeta, { recursive: true });
      cb(null, carpeta);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const nombreSeguro = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const nombreUnico = `${Date.now()}-${nombreSeguro}`;
    cb(null, nombreUnico);
  }
});

const upload = multer({ storage });

module.exports = upload;
