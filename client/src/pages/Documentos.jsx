import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';

export default function Documentos() {
  const { encargoId: encargoIdRuta } = useParams();
  const [idiomas, setIdiomas] = useState([]);
  const [encargos, setEncargos] = useState([]);
  const [encargoId, setEncargoId] = useState(encargoIdRuta || '');
  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('original');
  const [error, setError] = useState('');
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const documentosFiltrados = useFiltroTexto(documentos, busqueda, ['nombre_archivo', 'tipo']);

  useEffect(() => {
    api.get('/encargos').then(setEncargos).catch((err) => setError(err.message));
    api.get('/idiomas').then(setIdiomas).catch(() => {});
  }, []);

  const encargoActual = encargos.find((e) => String(e.id) === String(encargoId));
  const parIdiomas = encargoActual && idiomas.find(
    (i) => i.idioma_origen === encargoActual.idioma_origen && i.idioma_destino === encargoActual.idioma_destino
  );
  const tarifa = parIdiomas ? Number(parIdiomas.tarifa_traduccion) : null;

  useEffect(() => {
    if (encargoIdRuta) {
      setEncargoId(encargoIdRuta);
      cargarDocumentos(encargoIdRuta);
    }
  }, [encargoIdRuta]);

  async function cargarDocumentos(id) {
    if (!id) { setDocumentos([]); return; }
    try {
      const data = await api.get(`/documentos/encargo/${id}`);
      setDocumentos(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSeleccionEncargo(e) {
    const id = e.target.value;
    setEncargoId(id);
    cargarDocumentos(id);
  }

  function handleNuevo() {
    setArchivo(null);
    setTipo('original');
    setDrawerAbierto(true);
  }

  async function handleSubir(e) {
    e.preventDefault();
    setError('');
    if (!encargoId || !archivo) {
      setError('Selecciona un encargo y un archivo');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('encargo_id', encargoId);
      formData.append('tipo', tipo);
      formData.append('archivo', archivo);
      await api.post('/documentos', formData);
      setArchivo(null);
      setDrawerAbierto(false);
      cargarDocumentos(encargoId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSugerirPrecio(palabras) {
    if (!tarifa) {
      setError('No hay tarifa configurada para este par de idiomas. Ve a Configuración.');
      return;
    }
    const calculo = palabras * tarifa;
    const aplicaMinima = parIdiomas.palabras_minimas && palabras <= Number(parIdiomas.palabras_minimas);
    const precioFinal = aplicaMinima
      ? Math.max(calculo, Number(parIdiomas.tarifa_minima))
      : calculo;
    const precioSugerido = precioFinal.toFixed(2);
    const detalle = aplicaMinima
      ? `${palabras} palabras — se aplica tarifa mínima (hasta ${parIdiomas.palabras_minimas} palabras)`
      : `${palabras} palabras × ${tarifa} €`;
    if (!confirm(`¿Fijar precio del encargo en ${precioSugerido} € (${detalle})?`)) return;
    try {
      await api.patch(`/encargos/${encargoId}/precio`, { precio: precioSugerido });
      alert('Precio actualizado en el encargo');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete(`/documentos/${id}`);
      cargarDocumentos(encargoId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDescargar(id, nombreArchivo) {
    try {
      const blob = await api.descargarArchivo(`/documentos/${id}/descargar`);
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

  return (
    <div className="pagina-documentos">
      <PageHeader
        titulo="Documentos"
        accion={encargoId && <Button variante="primario" onClick={handleNuevo}><Upload size={16} /> Subir documento</Button>}
      />
      {encargoIdRuta && <Link to="/clientes" className="volver">← Volver a clientes</Link>}
      {error && <div className="error-msg">{error}</div>}

      <select value={encargoId} onChange={handleSeleccionEncargo} disabled={!!encargoIdRuta}>
        <option value="">Selecciona un encargo</option>
        {encargos.map((e) => (
          <option key={e.id} value={e.id}>
            #{e.id} - {e.cliente_nombre} ({e.idioma_origen}→{e.idioma_destino})
          </option>
        ))}
      </select>

      {encargoId && (
        <>
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o tipo..." />

          {documentosFiltrados.length === 0 ? (
            <EmptyState
              icono={FileText}
              texto={busqueda ? 'Ningún documento coincide con la búsqueda.' : 'Este encargo aún no tiene documentos.'}
              accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Subir documento</Button>}
            />
          ) : (
          <ul className="lista-documentos">
            {documentosFiltrados.map((d) => {
              const esVigente = !documentos.some((otro) => otro.reemplaza_a === d.id);
              return (
                <li key={d.id} className={esVigente ? '' : 'documento-superado'}>
                  <span className="badge-tipo">{d.tipo}</span>{' '}
                  <span className="badge-version">v{d.version}</span>{' '}
                  <button className="enlace-documento" onClick={() => handleDescargar(d.id, d.nombre_archivo)}>
                    {d.nombre_archivo}
                  </button>
                  {!esVigente && <span className="badge-superado">sustituido</span>}
                  {d.palabras != null && <span className="badge-palabras">{d.palabras} palabras</span>}
                  {esVigente && d.tipo === 'original' && d.palabras != null && tarifa && (
                    <Button variante="fantasma" onClick={() => handleSugerirPrecio(d.palabras)}>
                      Sugerir precio ({(d.palabras * tarifa).toFixed(2)} €)
                    </Button>
                  )}
                  <Button variante="fantasma" onClick={() => handleEliminar(d.id)}>Eliminar</Button>
                </li>
              );
            })}
          </ul>
          )}
        </>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={() => setDrawerAbierto(false)} titulo="Subir documento">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubir} className="drawer-body">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="original">Original</option>
            <option value="traducido">Traducido</option>
          </select>
          <input type="file" onChange={(e) => setArchivo(e.target.files[0])} required />
          <Button type="submit" variante="primario">Subir documento</Button>
        </form>
      </Drawer>
    </div>
  );
}
