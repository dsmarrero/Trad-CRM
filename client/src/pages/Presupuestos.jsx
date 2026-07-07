import { useEffect, useState } from 'react';
import { Plus, FileSearch } from 'lucide-react';
import { api } from '../services/api';
import { useCrud } from '../hooks/useCrud';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = {
  cliente_id: '', idioma_origen: '', idioma_destino: '',
  tipo_documento: '', palabras_estimadas: '', precio_estimado: '', notas: ''
};

export default function Presupuestos() {
  const { items: presupuestos, error, setError, cargando, cargar, crear, eliminar } = useCrud('/presupuestos');
  const [clientes, setClientes] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [archivo, setArchivo] = useState(null);
  const [info, setInfo] = useState('');
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const presupuestosFiltrados = useFiltroTexto(presupuestos, busqueda, ['cliente_nombre', 'tipo_documento']);

  useEffect(() => {
    api.get('/clientes').then(setClientes).catch((err) => setError(err.message));
    api.get('/idiomas').then(setIdiomas).catch((err) => setError(err.message));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNuevo() {
    setForm(VACIO);
    setArchivo(null);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (archivo) {
        // El orden importa: multer necesita cliente_id antes que el archivo
        // en el multipart para poder resolver la carpeta de destino.
        const formData = new FormData();
        Object.entries(form).forEach(([clave, valor]) => formData.append(clave, valor));
        formData.append('archivo', archivo);
        await crear(formData);
      } else {
        await crear(form);
      }
      setForm(VACIO);
      setArchivo(null);
      setDrawerAbierto(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDescargar(id, nombreArchivo) {
    try {
      const blob = await api.descargarArchivo(`/presupuestos/${id}/descargar`);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo;
      enlace.click();
      URL.revokeObjectURL(url);
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

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setArchivo(null);
  }

  return (
    <div className="pagina-presupuestos">
      <PageHeader
        titulo="Presupuestos"
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo presupuesto</Button>}
      />
      {error && <div className="error-msg">{error}</div>}
      {info && <div className="ok-msg">{info}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente o documento..." />

      {cargando ? <Skeleton columnas={6} /> : presupuestosFiltrados.length === 0 ? (
        <EmptyState
          icono={FileSearch}
          texto={busqueda ? 'Ningún presupuesto coincide con la búsqueda.' : 'Todavía no tienes presupuestos. Crea el primero.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Crear presupuesto</Button>}
        />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Idiomas</th><th>Documento</th><th>Estimado</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          {presupuestosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.cliente_nombre}</td>
              <td>{p.idioma_origen} → {p.idioma_destino}</td>
              <td>
                {p.tipo_documento || '-'}
                {p.nombre_archivo && (
                  <>
                    {' '}
                    <button className="enlace-documento" onClick={() => handleDescargar(p.id, p.nombre_archivo)}>
                      {p.nombre_archivo}
                    </button>
                  </>
                )}
              </td>
              <td>
                {p.precio_estimado != null ? Number(p.precio_estimado).toFixed(2) + ' €' : '-'}
                {p.palabras_estimadas != null && (
                  <>
                    {' '}<span className="badge-palabras">{p.palabras_estimadas} palabras</span>
                  </>
                )}
              </td>
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
                    <Button variante="fantasma" onClick={() => handleConvertir(p.id)}>Convertir en encargo</Button>
                    <Button variante="fantasma" onClick={() => handleCambiarEstado(p.id, 'rechazado')}>Rechazar</Button>
                  </>
                )}
                <Button variante="fantasma" onClick={() => handleEliminar(p.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo="Nuevo presupuesto">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <select name="cliente_id" aria-label="Cliente" value={form.cliente_id} onChange={handleChange} required>
            <option value="">Selecciona cliente *</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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
          <input name="palabras_estimadas" aria-label="Palabras estimadas" type="number" placeholder="Palabras estimadas" value={form.palabras_estimadas} onChange={handleChange} />
          <input name="precio_estimado" aria-label="Precio estimado en euros" type="number" step="0.01" placeholder="Precio estimado (€)" value={form.precio_estimado} onChange={handleChange} />
          <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
          <input type="file" aria-label="Documento a traducir (opcional)" onChange={(e) => setArchivo(e.target.files[0])} />
          {archivo && (
            <span className="ayuda-calculo">
              Al subir "{archivo.name}" se calculan las palabras y el precio estimado automáticamente
              (sustituye los valores manuales de arriba).
            </span>
          )}
          <Button type="submit" variante="primario">Crear presupuesto</Button>
        </form>
      </Drawer>
    </div>
  );
}
