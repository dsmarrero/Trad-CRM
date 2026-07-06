import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ClienteDetalle() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [encargos, setEncargos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [textoNota, setTextoNota] = useState('');
  const [error, setError] = useState('');

  async function cargarNotas() {
    try {
      setNotas(await api.get(`/clientes/${id}/notas`));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    async function cargar() {
      try {
        const [dataCliente, dataEncargos] = await Promise.all([
          api.get(`/clientes/${id}`),
          api.get(`/encargos?cliente_id=${id}`)
        ]);
        setCliente(dataCliente);
        setEncargos(dataEncargos);
        await cargarNotas();
      } catch (err) {
        setError(err.message);
      }
    }
    cargar();
  }, [id]);

  async function handleAgregarNota(e) {
    e.preventDefault();
    if (!textoNota.trim()) return;
    try {
      await api.post(`/clientes/${id}/notas`, { texto: textoNota });
      setTextoNota('');
      cargarNotas();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminarNota(notaId) {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await api.delete(`/clientes/${id}/notas/${notaId}`);
      cargarNotas();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="error-msg">{error}</div>;
  if (!cliente) return <p>Cargando...</p>;

  return (
    <div className="pagina-cliente-detalle">
      <Link to="/clientes" className="volver">← Volver a clientes</Link>
      <h2>{cliente.nombre}</h2>
      <p className="ficha-cliente">
        {cliente.email && <span>{cliente.email}</span>}
        {cliente.telefono && <span>{cliente.telefono}</span>}
        {cliente.empresa && <span>{cliente.empresa}</span>}
      </p>

      <h3>Proyectos / Encargos</h3>
      <table>
        <thead>
          <tr>
            <th>Idiomas</th><th>Documento</th><th>Estado</th><th>Entrega</th><th></th>
          </tr>
        </thead>
        <tbody>
          {encargos.map((e) => (
            <tr key={e.id}>
              <td>{e.idioma_origen} → {e.idioma_destino}</td>
              <td>{e.tipo_documento}</td>
              <td><span className="badge-tipo">{e.estado}</span></td>
              <td>{e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleDateString() : '-'}</td>
              <td>
                <Link to={`/encargos/${e.id}/documentos`}>Ver documentos</Link>
              </td>
            </tr>
          ))}
          {encargos.length === 0 && (
            <tr><td colSpan="5">Este cliente aún no tiene encargos.</td></tr>
          )}
        </tbody>
      </table>

      <h3>Notas de seguimiento</h3>
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
    </div>
  );
}
