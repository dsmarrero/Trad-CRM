const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { extraerPalabras } = require('../utils/extraerTexto');

async function calcularPrecioEstimado(usuarioId, idiomaOrigen, idiomaDestino, palabras) {
  if (!palabras || palabras <= 0) return null;
  // Comparación insensible a mayúsculas: el idioma de un presupuesto es texto libre
  // (no un desplegable con la lista fija de Configuración), así que "inglés" debe
  // seguir encontrando la tarifa configurada como "Inglés".
  const resultado = await pool.query(
    `SELECT tarifa_traduccion, tarifa_minima, palabras_minimas FROM idiomas_usuario
     WHERE usuario_id=$1 AND LOWER(idioma_origen)=LOWER($2) AND LOWER(idioma_destino)=LOWER($3)`,
    [usuarioId, idiomaOrigen, idiomaDestino]
  );
  if (resultado.rows.length === 0) return null;
  const { tarifa_traduccion, tarifa_minima, palabras_minimas } = resultado.rows[0];
  const tarifa = Number(tarifa_traduccion);
  if (!Number.isFinite(tarifa)) return null;
  const aplicaMinima = palabras_minimas && palabras <= Number(palabras_minimas);
  return aplicaMinima ? Math.max(palabras * tarifa, Number(tarifa_minima)) : palabras * tarifa;
}

async function listar(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT p.*, c.nombre AS cliente_nombre
       FROM presupuestos p
       JOIN clientes c ON p.cliente_id = c.id
       ORDER BY p.creado_en DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar presupuestos' });
  }
}

async function obtener(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM presupuestos WHERE id=$1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
}

async function crear(req, res) {
  try {
    const { cliente_id, idioma_origen, idioma_destino, tipo_documento, notas } = req.body;
    let { palabras_estimadas, precio_estimado } = req.body;

    if (!cliente_id || !idioma_origen || !idioma_destino) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    let nombre_archivo = null;
    let url_archivo = null;

    if (req.file) {
      nombre_archivo = req.file.originalname;
      url_archivo = `/uploads/presupuestos/cliente_${cliente_id}/${req.file.filename}`;

      const palabras = await extraerPalabras(req.file.path);
      if (palabras != null) {
        palabras_estimadas = palabras;
        const calculado = await calcularPrecioEstimado(req.usuario.id, idioma_origen, idioma_destino, palabras);
        if (calculado != null) {
          precio_estimado = calculado;
        }
      }
    }

    const resultado = await pool.query(
      `INSERT INTO presupuestos
        (cliente_id, idioma_origen, idioma_destino, tipo_documento, palabras_estimadas, precio_estimado, notas, nombre_archivo, url_archivo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [cliente_id, idioma_origen, idioma_destino, tipo_documento, palabras_estimadas || null, precio_estimado || null, notas, nombre_archivo, url_archivo]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear presupuesto' });
  }
}

async function descargar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT nombre_archivo, url_archivo FROM presupuestos WHERE id=$1', [id]);
    if (resultado.rows.length === 0 || !resultado.rows[0].url_archivo) {
      return res.status(404).json({ error: 'Este presupuesto no tiene ningún archivo adjunto' });
    }

    const rutaArchivo = path.join(__dirname, '..', resultado.rows[0].url_archivo);
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ error: 'El archivo ya no existe en el servidor' });
    }

    res.download(rutaArchivo, resultado.rows[0].nombre_archivo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al descargar el archivo' });
  }
}

async function cambiarEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'aceptado', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    const resultado = await pool.query(
      'UPDATE presupuestos SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
}

async function convertirEnEncargo(req, res) {
  const cliente = await pool.connect();
  try {
    const { id } = req.params;

    await cliente.query('BEGIN');

    const presupuesto = await cliente.query('SELECT * FROM presupuestos WHERE id=$1 FOR UPDATE', [id]);
    if (presupuesto.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    const p = presupuesto.rows[0];
    if (p.encargo_id) {
      await cliente.query('ROLLBACK');
      return res.status(400).json({ error: 'Este presupuesto ya fue convertido en encargo' });
    }

    const encargo = await cliente.query(
      `INSERT INTO encargos (cliente_id, idioma_origen, idioma_destino, tipo_documento, precio, notas)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.cliente_id, p.idioma_origen, p.idioma_destino, p.tipo_documento, p.precio_estimado, p.notas]
    );

    const actualizado = await cliente.query(
      `UPDATE presupuestos SET estado='aceptado', encargo_id=$1 WHERE id=$2 RETURNING *`,
      [encargo.rows[0].id, id]
    );

    await cliente.query('COMMIT');
    res.status(201).json({ presupuesto: actualizado.rows[0], encargo: encargo.rows[0] });
  } catch (err) {
    await cliente.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al convertir el presupuesto en encargo' });
  } finally {
    cliente.release();
  }
}

async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM presupuestos WHERE id=$1 RETURNING id', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json({ mensaje: 'Presupuesto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
}

module.exports = { listar, obtener, crear, descargar, cambiarEstado, convertirEnEncargo, eliminar };
