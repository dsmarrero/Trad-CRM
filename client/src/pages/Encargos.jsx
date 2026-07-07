import { useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

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
  const [editandoId, setEditandoId] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const encargosFiltrados = useFiltroTexto(encargos, busqueda, ['cliente_nombre', 'tipo_documento']);

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

  function handleNuevo() {
    setForm(VACIO);
    setEditandoId(null);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await api.put(`/encargos/${editandoId}`, form);
      } else {
        await api.post('/encargos', form);
      }
      setForm(VACIO);
      setEditandoId(null);
      setDrawerAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditar(encargo) {
    setForm({
      cliente_id: String(encargo.cliente_id),
      idioma_origen: encargo.idioma_origen,
      idioma_destino: encargo.idioma_destino,
      tipo_documento: encargo.tipo_documento || '',
      fecha_entrega: encargo.fecha_entrega ? encargo.fecha_entrega.slice(0, 10) : '',
      precio: encargo.precio || '',
      notas: encargo.notas || ''
    });
    setEditandoId(encargo.id);
    setDrawerAbierto(true);
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setEditandoId(null);
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
      <PageHeader
        titulo="Encargos"
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo encargo</Button>}
      />
      {error && <div className="error-msg">{error}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente o documento..." />

      {cargando ? <Skeleton columnas={7} /> : encargosFiltrados.length === 0 ? (
        <EmptyState
          icono={ClipboardList}
          texto={busqueda ? 'Ningún encargo coincide con la búsqueda.' : 'Todavía no tienes encargos. Añade el primero.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Añadir encargo</Button>}
        />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Idiomas</th><th>Documento</th><th>Estado</th><th>Entrega</th><th>Precio</th><th></th>
          </tr>
        </thead>
        <tbody>
          {encargosFiltrados.map((e) => (
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
                <Button variante="fantasma" onClick={() => handleEditar(e)}>Editar</Button>
                <Button variante="fantasma" onClick={() => handleEliminar(e.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo={editandoId ? 'Editar encargo' : 'Nuevo encargo'}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
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
          <Button type="submit" variante="primario">{editandoId ? 'Guardar cambios' : 'Añadir encargo'}</Button>
        </form>
      </Drawer>
    </div>
  );
}
