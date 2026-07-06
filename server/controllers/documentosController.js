const pool = require('../config/db');
const { extraerPalabras } = require('../utils/extraerTexto');
const fs = require('fs');
const path = require('path');

async function listarPorEncargo(req, res) {
  try {
    const { encargoId } = req.params;
    const resultado = await pool.query(
      'SELECT * FROM documentos WHERE encargo_id = $1 ORDER BY subido_en DESC',
      [encargoId]
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar documentos' });
  }
}

async function subir(req, res) {
  try {
    const { encargo_id, tipo } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    if (!encargo_id || !tipo) {
      return res.status(400).json({ error: 'Faltan encargo_id o tipo' });
    }

    const resultadoEncargo = await pool.query('SELECT cliente_id FROM encargos WHERE id=$1', [encargo_id]);
    const clienteId = resultadoEncargo.rows[0].cliente_id;
    const url_archivo = `/uploads/cliente_${clienteId}/encargo_${encargo_id}/${req.file.filename}`;

    let palabras = null;
    if (tipo === 'original') {
      palabras = await extraerPalabras(req.file.path);
    }

    // versionado: si ya existe un documento del mismo tipo para este encargo,
    // el nuevo lo reemplaza y hereda version+1 en vez de quedar sin relación
    const anterior = await pool.query(
      `SELECT id, version FROM documentos WHERE encargo_id=$1 AND tipo=$2 ORDER BY version DESC LIMIT 1`,
      [encargo_id, tipo]
    );
    const version = anterior.rows.length > 0 ? anterior.rows[0].version + 1 : 1;
    const reemplazaA = anterior.rows.length > 0 ? anterior.rows[0].id : null;

    const resultado = await pool.query(
      `INSERT INTO documentos (encargo_id, nombre_archivo, url_archivo, tipo, palabras, version, reemplaza_a)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [encargo_id, req.file.originalname, url_archivo, tipo, palabras, version, reemplazaA]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir documento' });
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const documento = await pool.query('SELECT url_archivo FROM documentos WHERE id=$1', [id]);
    if (documento.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const rutaArchivo = path.join(__dirname, '..', documento.rows[0].url_archivo);
    fs.unlink(rutaArchivo, (err) => {
      if (err) console.error('No se pudo borrar el archivo físico:', err.message);
    });

    await pool.query('DELETE FROM documentos WHERE id=$1', [id]);
    res.json({ mensaje: 'Documento eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
}

module.exports = { listarPorEncargo, subir, eliminar };
