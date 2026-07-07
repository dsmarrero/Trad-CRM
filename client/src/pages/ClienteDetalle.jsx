import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, FileText } from 'lucide-react';
import { api } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import Tabs from '../components/Tabs';
import Drawer from '../components/Drawer';
import { badgeEstado } from '../utils/estado';

const TABS = ['Encargos', 'Documentos', 'Notas'];
const ESTADOS = ['recibido', 'en_curso', 'entregado', 'facturado'];

export default function ClienteDetalle({ tabInicial = 'Encargos' }) {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [encargos, setEncargos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [textoNota, setTextoNota] = useState('');
  const [error, setError] = useState('');
  const [tabActivo, setTabActivo] = useState(tabInicial);
  const [encargoAbierto, setEncargoAbierto] = useState(null);

  async function cargarNotas() {
    try { setNotas(await api.get(`/clientes/${id}/notas`)); }
    catch (err) { setError(err.message); }
  }

  async function cargar() {
    try {
      const [dataCliente, dataEncargos] = await Promise.all([
        api.get(`/clientes/${id}`),
        api.get(`/encargos?cliente_id=${id}`)
      ]);
      setCliente(dataCliente);
      setEncargos(dataEncargos);
      await cargarNotas();
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { cargar(); }, [id]);

  async function handleCambiarEstado(encargoId, estado) {
    try {
      await api.patch(`/encargos/${encargoId}/estado`, { estado });
      await cargar();
      if (encargoAbierto?.id === encargoId) {
        setEncargoAbierto((prev) => ({ ...prev, estado }));
      }
    } catch (err) { setError(err.message); }
  }

  async function handleEliminarEncargo(encargoId) {
    if (!confirm('¿Eliminar este encargo?')) return;
    try {
      await api.delete(`/encargos/${encargoId}`);
      setEncargoAbierto(null);
      await cargar();
    } catch (err) { setError(err.message); }
  }

  async function handleAgregarNota(e) {
    e.preventDefault();
    if (!textoNota.trim()) return;
    try {
      await api.post(`/clientes/${id}/notas`, { texto: textoNota });
      setTextoNota('');
      cargarNotas();
    } catch (err) { setError(err.message); }
  }

  async function handleEliminarNota(notaId) {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await api.delete(`/clientes/${id}/notas/${notaId}`);
      cargarNotas();
    } catch (err) { setError(err.message); }
  }

  if (error) return <div className="error-msg">{error}</div>;
  if (!cliente) return <p>Cargando...</p>;

  return (
    <div className="pagina-cliente-detalle">
      <Breadcrumb items={[
        { label: 'Clientes', to: '/clientes' },
        { label: cliente.nombre }
      ]} />

      <div className="cabecera-pagina">
        <div>
          <h2 style={{ margin: 0 }}>{cliente.nombre}</h2>
          <p className="ficha-cliente" style={{ margin: '0.4rem 0 0' }}>
            {cliente.email && <span>{cliente.email}</span>}
            {cliente.telefono && <span>{cliente.telefono}</span>}
            {cliente.empresa && <span>{cliente.empresa}</span>}
            {cliente.nif && <span>NIF/CIF: {cliente.nif}</span>}
          </p>
        </div>
        <Link to="/clientes" className="volver">Editar cliente</Link>
      </div>

      {!cliente.nif && (
        <p className="ayuda-config">
          Este cliente no tiene NIF/CIF registrado — sus facturas pueden no cumplir los requisitos legales.{' '}
          <Link to="/clientes">Añádelo aquí</Link>.
        </p>
      )}

      <Tabs tabs={TABS} activo={tabActivo} onCambiar={setTabActivo} />

      {tabActivo === 'Encargos' && (
        <table>
          <thead>
            <tr>
              <th>Idiomas</th><th>Documento</th><th>Estado</th><th>Entrega</th><th></th>
            </tr>
          </thead>
          <tbody>
            {encargos.map((e) => (
              <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setEncargoAbierto(e)}>
                <td>{e.idioma_origen} → {e.idioma_destino}</td>
                <td>{e.tipo_documento}</td>
                <td><span className={badgeEstado(e.estado)}>{e.estado}</span></td>
                <td>{e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleDateString() : '-'}</td>
                <td>
                  <button onClick={(ev) => { ev.stopPropagation(); setEncargoAbierto(e); }}>
                    Ver
                  </button>
                </td>
              </tr>
            ))}
            {encargos.length === 0 && (
              <tr><td colSpan="5">Este cliente aún no tiene encargos.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {tabActivo === 'Documentos' && (
        <p className="ayuda-config">
          Los documentos se gestionan desde cada encargo. Pulsa un encargo para ver sus documentos adjuntos.
        </p>
      )}

      {tabActivo === 'Notas' && (
        <>
          <form onSubmit={handleAgregarNota} className="form-nota">
            <textarea
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Añadir una nota sobre este cliente..."
              rows={2}
            />
            <button type="submit">Añadir nota</button>
          </form>
          <ul className="lista-notas">
            {notas.map((n) => (
              <li key={n.id}>
                <div className="nota-cabecera">
                  <span className="nota-autor">{n.autor_nombre || 'Usuario'}</span>
                  <span className="nota-fecha">{new Date(n.creado_en).toLocaleString()}</span>
                  <button onClick={() => handleEliminarNota(n.id)}>Eliminar</button>
                </div>
                <p className="nota-texto">{n.texto}</p>
              </li>
            ))}
            {notas.length === 0 && <li>Sin notas todavía.</li>}
          </ul>
        </>
      )}

      <Drawer
        abierto={!!encargoAbierto}
        onCerrar={() => setEncargoAbierto(null)}
        titulo={encargoAbierto?.tipo_documento || 'Encargo'}
      >
        {encargoAbierto && (
          <>
            <div className="drawer-body">
              <div className="drawer-campo">
                <label>Estado</label>
                <select
                  value={encargoAbierto.estado}
                  onChange={(e) => handleCambiarEstado(encargoAbierto.id, e.target.value)}
                >
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="drawer-campo">
                <label>Idiomas</label>
                <span>{encargoAbierto.idioma_origen} → {encargoAbierto.idioma_destino}</span>
              </div>
              <div className="drawer-campo">
                <label>Fecha de entrega</label>
                <span>
                  {encargoAbierto.fecha_entrega
                    ? new Date(encargoAbierto.fecha_entrega).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="drawer-campo">
                <label>Precio</label>
                <span>{encargoAbierto.precio ? `${encargoAbierto.precio} €` : '—'}</span>
              </div>
              {encargoAbierto.notas && (
                <div className="drawer-campo">
                  <label>Notas</label>
                  <span style={{ fontWeight: 400, fontSize: '0.9rem' }}>{encargoAbierto.notas}</span>
                </div>
              )}
              <div className="drawer-campo">
                <label>Documentos adjuntos</label>
                <Link
                  to={`/encargos/${encargoAbierto.id}/documentos`}
                  style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--naranja)' }}
                >
                  <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                  Ver / subir documentos
                </Link>
              </div>
            </div>
            <div className="drawer-acciones">
              <button className="btn-ia" disabled title="Función en desarrollo">
                <Sparkles size={15} /> Traducir con IA
              </button>
              <button
                className="btn-peligro"
                onClick={() => handleEliminarEncargo(encargoAbierto.id)}
              >
                Eliminar encargo
              </button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
