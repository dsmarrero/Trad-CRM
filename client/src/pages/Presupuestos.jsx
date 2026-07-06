import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useCrud } from '../hooks/useCrud';

const VACIO = {
  cliente_id: '', idioma_origen: '', idioma_destino: '',
  tipo_documento: '', palabras_estimadas: '', precio_estimado: '', notas: ''
};

export default function Presupuestos() {
  const { items: presupuestos, error, setError, cargando, cargar, crear, eliminar } = useCrud('/presupuestos');
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [info, setInfo] = useState('');

  useEffect(() => {
    api.get('/clientes').then(setClientes).catch((err) => setError(err.message));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await crear(form);
      setForm(VACIO);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCambiarEstado(id, estado) {
    try {
      await api.patch(`/presupuestos/${id}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvertir(id) {
    if (!confirm('¿Convertir este presupuesto en un encargo?')) return;
    try {
      await api.post(`/presupuestos/${id}/convertir`, {});
      setInfo('Encargo creado a partir del presupuesto.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try {
      await eliminar(id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-presupuestos">
      <h2>Presupuestos</h2>
      {error && <div className="error-msg">{error}</div>}
      {info && <div className="ok-msg">{info}</div>}

      <form onSubmit={handleSubmit} className="form-presupuesto">
        <select name="cliente_id" aria-label="Cliente" value={form.cliente_id} onChange={handleChange} required>
          <option value="">Selecciona cliente *</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input name="idioma_origen" aria-label="Idioma origen" placeholder="Idioma origen *" value={form.idioma_origen} onChange={handleChange} required />
        <input name="idioma_destino" aria-label="Idioma destino" placeholder="Idioma destino *" value={form.idioma_destino} onChange={handleChange} required />
        <input name="tipo_documento" aria-label="Tipo de documento" placeholder="Tipo de documento" value={form.tipo_documento} onChange={handleChange} />
        <input name="palabras_estimadas" aria-label="Palabras estimadas" type="number" placeholder="Palabras estimadas" value={form.palabras_estimadas} onChange={handleChange} />
        <input name="precio_estimado" aria-label="Precio estimado en euros" type="number" step="0.01" placeholder="Precio estimado (€)" value={form.precio_estimado} onChange={handleChange} />
        <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
        <button type="submit">Crear presupuesto</button>
      </form>

      {cargando ? <p>Cargando...</p> : (
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Idiomas</th><th>Documento</th><th>Estimado</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          {presupuestos.map((p) => (
            <tr key={p.id}>
              <td>{p.cliente_nombre}</td>
              <td>{p.idioma_origen} → {p.idioma_destino}</td>
              <td>{p.tipo_documento || '-'}</td>
              <td>{p.precio_estimado != null ? Number(p.precio_estimado).toFixed(2) + ' €' : '-'}</td>
              <td>
                <span className={
                  p.estado === 'aceptado' ? 'badge-ok' : p.estado === 'rechazado' ? 'badge-pendiente' : 'badge-tipo'
                }>
                  {p.estado}
                </span>
              </td>
              <td>
                {p.estado === 'pendiente' && (
                  <>
                    <button onClick={() => handleConvertir(p.id)}>Convertir en encargo</button>
                    <button onClick={() => handleCambiarEstado(p.id, 'rechazado')}>Rechazar</button>
                  </>
                )}
                <button onClick={() => handleEliminar(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {presupuestos.length === 0 && (
            <tr><td colSpan="6">Sin presupuestos todavía.</td></tr>
          )}
        </tbody>
      </table>
      )}
    </div>
  );
}
