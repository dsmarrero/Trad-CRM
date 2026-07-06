import { useEffect, useState } from 'react';
import { api } from '../services/api';

const VACIO = {
  cliente_id: '', idioma_origen: '', idioma_destino: '',
  tipo_documento: '', fecha_entrega: '', precio: '', notas: ''
};

const ESTADOS = ['recibido', 'en_curso', 'entregado', 'facturado'];

export default function Encargos() {
  const [encargos, setEncargos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      const [dataEncargos, dataClientes, dataIdiomas] = await Promise.all([
        api.get('/encargos'),
        api.get('/clientes'),
        api.get('/idiomas')
      ]);
      setEncargos(dataEncargos);
      setClientes(dataClientes);
      setIdiomas(dataIdiomas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/encargos', form);
      setForm(VACIO);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCambiarEstado(id, estado) {
    try {
      await api.patch(`/encargos/${id}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este encargo?')) return;
    try {
      await api.delete(`/encargos/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-encargos">
      <h2>Encargos</h2>
      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit} className="form-encargo">
        <select name="cliente_id" aria-label="Cliente" value={form.cliente_id} onChange={handleChange} required>
          <option value="">Selecciona cliente *</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          aria-label="Par de idiomas"
          value={form.idioma_origen && form.idioma_destino ? `${form.idioma_origen}|${form.idioma_destino}` : ''}
          onChange={(e) => {
            const [origen, destino] = e.target.value.split('|');
            setForm({ ...form, idioma_origen: origen || '', idioma_destino: destino || '' });
          }}
          required
        >
          <option value="">Par de idiomas *</option>
          {idiomas.map((i) => (
            <option key={i.id} value={`${i.idioma_origen}|${i.idioma_destino}`}>
              {i.idioma_origen} → {i.idioma_destino}
            </option>
          ))}
        </select>
        <input name="tipo_documento" aria-label="Tipo de documento" placeholder="Tipo de documento" value={form.tipo_documento} onChange={handleChange} />
        <input name="fecha_entrega" aria-label="Fecha de entrega" type="date" value={form.fecha_entrega} onChange={handleChange} />
        <input name="precio" aria-label="Precio en euros" type="number" step="0.01" placeholder="Precio (€)" value={form.precio} onChange={handleChange} />
        <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
        <button type="submit">Añadir encargo</button>
      </form>

      {cargando ? <p>Cargando...</p> : (
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Idiomas</th><th>Documento</th><th>Estado</th><th>Entrega</th><th>Precio</th><th></th>
          </tr>
        </thead>
        <tbody>
          {encargos.map((e) => (
            <tr key={e.id}>
              <td>{e.cliente_nombre}</td>
              <td>{e.idioma_origen} → {e.idioma_destino}</td>
              <td>{e.tipo_documento}</td>
              <td>
                <select value={e.estado} onChange={(ev) => handleCambiarEstado(e.id, ev.target.value)}>
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td>{e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleDateString() : '-'}</td>
              <td>{e.precio ? `${e.precio} €` : '-'}</td>
              <td>
                <button onClick={() => handleEliminar(e.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
