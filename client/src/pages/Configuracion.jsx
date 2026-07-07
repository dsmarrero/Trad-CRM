import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const IDIOMAS_COMUNES = ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués'];

export default function Configuracion() {
  const { actualizarUsuario } = useAuth();
  const [idiomas, setIdiomas] = useState([]);
  const [nuevoOrigen, setNuevoOrigen] = useState('Español');
  const [nuevoDestino, setNuevoDestino] = useState('Inglés');

  const [perfil, setPerfil] = useState(null);
  const [passwords, setPasswords] = useState({ password_actual: '', password_nueva: '' });

  const [facturacion, setFacturacion] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardadoId, setGuardadoId] = useState(null);
  const montado = useRef(true);

  function cargarIdiomas() {
    api.get('/idiomas').then(setIdiomas).catch((err) => setError(err.message));
  }
  function cargarDisponibilidad() {
    api.get('/disponibilidad').then(setDiasBloqueados).catch(() => {});
  }

  useEffect(() => {
    montado.current = true;
    cargarIdiomas();
    cargarDisponibilidad();
    api.get('/auth/perfil').then(setPerfil).catch((err) => setError(err.message));
    api.get('/auth/configuracion').then(setFacturacion).catch((err) => setError(err.message));
    return () => { montado.current = false; };
  }, []);

  function mostrarMensaje(texto) {
    setMensaje(texto);
    setTimeout(() => { if (montado.current) setMensaje(''); }, 2500);
  }

  // --- Perfil ---
  async function handleGuardarPerfil(e) {
    e.preventDefault();
    setError('');
    try {
      const actualizado = await api.put('/auth/perfil', perfil);
      setPerfil(actualizado);
      actualizarUsuario(actualizado);
      mostrarMensaje('Perfil actualizado.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCambiarPassword(e) {
    e.preventDefault();
    setError('');
    try {
      await api.put('/auth/perfil/password', passwords);
      setPasswords({ password_actual: '', password_nueva: '' });
      mostrarMensaje('Contraseña actualizada.');
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Datos de facturación ---
  useEffect(() => {
    if (!facturacion || !facturacion.factura_logo_url) {
      setLogoPreviewUrl(null);
      return;
    }
    let objectUrl = null;
    api.descargarArchivo('/auth/configuracion/logo').then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (montado.current) setLogoPreviewUrl(objectUrl);
    }).catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [facturacion && facturacion.factura_logo_url]);

  async function handleGuardarFacturacion(e) {
    e.preventDefault();
    setError('');
    try {
      const actualizado = await api.put('/auth/configuracion', facturacion);
      setFacturacion(actualizado);
      mostrarMensaje('Datos de facturación actualizados.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubirLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setError('');
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const actualizado = await api.post('/auth/configuracion/logo', formData);
      setFacturacion({ ...facturacion, factura_logo_url: actualizado.factura_logo_url });
      setLogoFile(null);
      mostrarMensaje('Logo actualizado.');
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Idiomas y tarifas ---
  function handleChangeTarifa(id, campo, valor) {
    setIdiomas(idiomas.map((i) => (i.id === id ? { ...i, [campo]: valor } : i)));
  }

  const CAMPOS_TARIFA = ['tarifa_traduccion', 'tarifa_jurada', 'tarifa_revision', 'tarifa_edicion_hora', 'tarifa_minima', 'palabras_minimas'];

  async function handleGuardarTarifas(par) {
    setError('');
    const camposInvalidos = CAMPOS_TARIFA.filter((campo) => {
      const valor = par[campo];
      return valor === '' || valor === null || valor === undefined || Number.isNaN(Number(valor)) || Number(valor) < 0;
    });
    if (camposInvalidos.length > 0) {
      setError('Todas las tarifas deben ser números válidos y no negativos');
      return;
    }
    try {
      await api.put(`/idiomas/${par.id}`, {
        tarifa_traduccion: par.tarifa_traduccion,
        tarifa_jurada: par.tarifa_jurada,
        tarifa_revision: par.tarifa_revision,
        tarifa_edicion_hora: par.tarifa_edicion_hora,
        tarifa_minima: par.tarifa_minima,
        palabras_minimas: par.palabras_minimas
      });
      setGuardadoId(par.id);
      setTimeout(() => { if (montado.current) setGuardadoId(null); }, 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAñadirIdioma(e) {
    e.preventDefault();
    if (nuevoOrigen === nuevoDestino) {
      setError('El idioma de origen y destino no pueden ser el mismo');
      return;
    }
    try {
      await api.post('/idiomas', { idioma_origen: nuevoOrigen, idioma_destino: nuevoDestino });
      cargarIdiomas();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminarIdioma(id) {
    try {
      await api.delete(`/idiomas/${id}`);
      cargarIdiomas();
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Disponibilidad ---
  async function handleBloquearFecha(e) {
    e.preventDefault();
    if (!nuevaFecha) return;
    try {
      await api.post('/disponibilidad', { fecha: nuevaFecha, motivo: nuevoMotivo });
      setNuevaFecha('');
      setNuevoMotivo('');
      cargarDisponibilidad();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDesbloquearFecha(id) {
    try {
      await api.delete(`/disponibilidad/${id}`);
      cargarDisponibilidad();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-configuracion">
      <h2>Configuración</h2>
      {error && <div className="error-msg">{error}</div>}
      {mensaje && <div className="ok-msg">{mensaje}</div>}

      <h3>Perfil</h3>
      {perfil && (
        <form onSubmit={handleGuardarPerfil} className="form-configuracion">
          <label>
            Nombre
            <input value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} required />
          </label>
          <label>
            Email
            <input type="email" value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} required />
          </label>
          <button type="submit">Guardar perfil</button>
        </form>
      )}

      <form onSubmit={handleCambiarPassword} className="form-configuracion">
        <label>
          Contraseña actual
          <input type="password" value={passwords.password_actual}
            onChange={(e) => setPasswords({ ...passwords, password_actual: e.target.value })} required />
        </label>
        <label>
          Nueva contraseña
          <input type="password" value={passwords.password_nueva}
            onChange={(e) => setPasswords({ ...passwords, password_nueva: e.target.value })} required />
        </label>
        <button type="submit">Cambiar contraseña</button>
      </form>

      <h3>Datos de facturación</h3>
      {facturacion && (
        <>
          <form onSubmit={handleGuardarFacturacion} className="form-configuracion">
            <label>
              Nombre / razón social
              <input value={facturacion.factura_nombre || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_nombre: e.target.value })} />
            </label>
            <label>
              Dirección
              <input value={facturacion.factura_direccion || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_direccion: e.target.value })} />
            </label>
            <label>
              Ciudad
              <input value={facturacion.factura_ciudad || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_ciudad: e.target.value })} />
            </label>
            <label>
              NIF
              <input value={facturacion.factura_nif || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_nif: e.target.value })} />
            </label>
            <label>
              Email de facturación
              <input type="email" value={facturacion.factura_email || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_email: e.target.value })} />
            </label>
            <label>
              Teléfono
              <input value={facturacion.factura_telefono || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_telefono: e.target.value })} />
            </label>
            <label>
              Método de pago
              <textarea value={facturacion.factura_metodo_pago || ''}
                onChange={(e) => setFacturacion({ ...facturacion, factura_metodo_pago: e.target.value })} />
            </label>
            <label>
              Color primario
              <input type="color" value={facturacion.factura_color_primario || '#F5641E'}
                onChange={(e) => setFacturacion({ ...facturacion, factura_color_primario: e.target.value })} />
            </label>
            <label>
              Color secundario
              <input type="color" value={facturacion.factura_color_secundario || '#E7F6EE'}
                onChange={(e) => setFacturacion({ ...facturacion, factura_color_secundario: e.target.value })} />
            </label>
            <button type="submit">Guardar datos de facturación</button>
          </form>

          <form onSubmit={handleSubirLogo} className="form-configuracion form-idiomas">
            {logoPreviewUrl && <img src={logoPreviewUrl} alt="Logo actual" style={{ maxHeight: '60px' }} />}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0] || null)} />
            <button type="submit" disabled={!logoFile}>Subir logo</button>
          </form>
        </>
      )}

      <h3>Añadir par de idiomas</h3>
      <form onSubmit={handleAñadirIdioma} className="form-configuracion form-idiomas">
        <select value={nuevoOrigen} onChange={(e) => setNuevoOrigen(e.target.value)}>
          {IDIOMAS_COMUNES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <span className="flecha-idioma">→</span>
        <select value={nuevoDestino} onChange={(e) => setNuevoDestino(e.target.value)}>
          {IDIOMAS_COMUNES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <button type="submit">Añadir</button>
      </form>

      <h3>Tarifas por par de idiomas</h3>
      {idiomas.length === 0 && <p className="ayuda-config">Aún no has añadido ningún par de idiomas.</p>}

      {idiomas.map((par) => (
        <div key={par.id} className="tarjeta-idioma">
          <div className="tarjeta-idioma-header">
            <strong>{par.idioma_origen} → {par.idioma_destino}</strong>
            <button onClick={() => handleEliminarIdioma(par.id)}>Eliminar par</button>
          </div>
          <div className="tarjeta-idioma-tarifas">
            <label>
              Traducción (€/palabra)
              <input type="number" step="0.001" min="0" value={par.tarifa_traduccion}
                onChange={(e) => handleChangeTarifa(par.id, 'tarifa_traduccion', e.target.value)} />
            </label>
            <label>
              Traducción jurada (€/palabra)
              <input type="number" step="0.001" min="0" value={par.tarifa_jurada}
                onChange={(e) => handleChangeTarifa(par.id, 'tarifa_jurada', e.target.value)} />
            </label>
            <label>
              Revisión (€/palabra)
              <input type="number" step="0.001" min="0" value={par.tarifa_revision}
                onChange={(e) => handleChangeTarifa(par.id, 'tarifa_revision', e.target.value)} />
            </label>
            <label>
              Edición (€/hora)
              <input type="number" step="0.5" min="0" value={par.tarifa_edicion_hora}
                onChange={(e) => handleChangeTarifa(par.id, 'tarifa_edicion_hora', e.target.value)} />
            </label>
            <label>
              Tarifa mínima (€)
              <input type="number" step="0.5" min="0" value={par.tarifa_minima}
                onChange={(e) => handleChangeTarifa(par.id, 'tarifa_minima', e.target.value)} />
            </label>
            <label>
              Hasta (palabras)
              <input type="number" step="1" min="0" value={par.palabras_minimas}
                onChange={(e) => handleChangeTarifa(par.id, 'palabras_minimas', e.target.value)} />
            </label>
          </div>
          <button onClick={() => handleGuardarTarifas(par)}>
            {guardadoId === par.id ? 'Guardado ✓' : 'Guardar tarifas'}
          </button>
        </div>
      ))}

      <h3>Disponibilidad</h3>
      <p className="ayuda-config">Marca los días en los que no aceptas nuevos encargos (vacaciones, etc.)</p>
      <form onSubmit={handleBloquearFecha} className="form-configuracion form-idiomas">
        <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} required />
        <input placeholder="Motivo (opcional)" value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} />
        <button type="submit">Bloquear día</button>
      </form>

      <ul className="lista-idiomas">
        {diasBloqueados.map((d) => (
          <li key={d.id}>
            {new Date(d.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
            {d.motivo ? ` — ${d.motivo}` : ''}
            <button onClick={() => handleDesbloquearFecha(d.id)}>Quitar</button>
          </li>
        ))}
        {diasBloqueados.length === 0 && <li>No hay días bloqueados.</li>}
      </ul>
    </div>
  );
}
