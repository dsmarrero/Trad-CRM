const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const encargoId = req.body.encargo_id;
      if (!encargoId) return cb(new Error('Falta encargo_id'));

      const resultado = await pool.query('SELECT cliente_id FROM encargos WHERE id=$1', [encargoId]);
      if (resultado.rows.length === 0) return cb(new Error('Encargo no encontrado'));

      const clienteId = resultado.rows[0].cliente_id;
      const carpeta = path.join(
        __dirname, '..', 'uploads',
        `cliente_${clienteId}`,
        `encargo_${encargoId}`
      );
      fs.mkdirSync(carpeta, { recursive: true });
      cb(null, carpeta);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${file.originalname}`;
    cb(null, nombreUnico);
  }
});

const upload = multer({ storage });

module.exports = upload;
