const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

async function registrar(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, hash, rol || 'traductor']
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });
    res.json({ usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ mensaje: 'Sesión cerrada' });
}

async function obtenerConfig(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, email, tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora,
        factura_nombre, factura_direccion, factura_ciudad, factura_nif, factura_email, factura_telefono,
        factura_metodo_pago, factura_logo_url, factura_color_primario, factura_color_secundario
       FROM usuarios WHERE id=$1`,
      [req.usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
}

async function actualizarConfig(req, res) {
  try {
    const {
      tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora,
      factura_nombre, factura_direccion, factura_ciudad, factura_nif, factura_email, factura_telefono,
      factura_metodo_pago, factura_color_primario, factura_color_secundario
    } = req.body;
    const resultado = await pool.query(
      `UPDATE usuarios SET
        tarifa_traduccion=$1, tarifa_jurada=$2, tarifa_revision=$3, tarifa_edicion_hora=$4,
        factura_nombre=$5, factura_direccion=$6, factura_ciudad=$7, factura_nif=$8, factura_email=$9,
        factura_telefono=$10, factura_metodo_pago=$11, factura_color_primario=$12, factura_color_secundario=$13
       WHERE id=$14
       RETURNING id, nombre, email, tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora,
        factura_nombre, factura_direccion, factura_ciudad, factura_nif, factura_email, factura_telefono,
        factura_metodo_pago, factura_logo_url, factura_color_primario, factura_color_secundario`,
      [
        tarifa_traduccion, tarifa_jurada, tarifa_revision, tarifa_edicion_hora,
        factura_nombre, factura_direccion, factura_ciudad, factura_nif, factura_email, factura_telefono,
        factura_metodo_pago, factura_color_primario, factura_color_secundario, req.usuario.id
      ]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
}

async function subirLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    const urlRelativa = `/uploads/logos/${req.file.filename}`;
    const resultado = await pool.query(
      'UPDATE usuarios SET factura_logo_url=$1 WHERE id=$2 RETURNING id, factura_logo_url',
      [urlRelativa, req.usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al subir el logo' });
  }
}

async function descargarLogo(req, res) {
  try {
    const resultado = await pool.query('SELECT factura_logo_url FROM usuarios WHERE id=$1', [req.usuario.id]);
    const urlRelativa = resultado.rows[0] && resultado.rows[0].factura_logo_url;
    if (!urlRelativa) {
      return res.status(404).json({ error: 'No hay logo configurado' });
    }
    const rutaArchivo = path.join(__dirname, '..', urlRelativa);
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ error: 'El logo ya no existe en el servidor' });
    }
    res.sendFile(rutaArchivo);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el logo' });
  }
}

async function obtenerPerfil(req, res) {
  try {
    const resultado = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id=$1', [req.usuario.id]);
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

async function actualizarPerfil(req, res) {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }
    const resultado = await pool.query(
      'UPDATE usuarios SET nombre=$1, email=$2 WHERE id=$3 RETURNING id, nombre, email',
      [nombre, email, req.usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese email ya está en uso' });
    }
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

async function cambiarPassword(req, res) {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Faltan contraseñas' });
    }
    const resultado = await pool.query('SELECT password FROM usuarios WHERE id=$1', [req.usuario.id]);
    const valido = await bcrypt.compare(password_actual, resultado.rows[0].password);
    if (!valido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    const hash = await bcrypt.hash(password_nueva, 10);
    await pool.query('UPDATE usuarios SET password=$1 WHERE id=$2', [hash, req.usuario.id]);
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
}

module.exports = {
  registrar, login, logout, obtenerConfig, actualizarConfig, subirLogo, descargarLogo,
  obtenerPerfil, actualizarPerfil, cambiarPassword
};
