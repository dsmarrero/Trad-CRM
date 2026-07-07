const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const carpeta = path.join(__dirname, '..', 'uploads', 'logos');
    fs.mkdirSync(carpeta, { recursive: true });
    cb(null, carpeta);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `usuario_${req.usuario.id}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('El logo debe ser una imagen'));
  }
  cb(null, true);
}

const uploadLogo = multer({ storage, fileFilter });

module.exports = uploadLogo;
