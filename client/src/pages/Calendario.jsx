import { useEffect, useState } from 'react';
import { api } from '../services/api';

function inicioMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().slice(0, 10);
}

function finMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function Calendario() {
  const [mesActual, setMesActual] = useState(new Date());
  const [entregas, setEntregas] = useState([]);
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/dashboard/calendario?desde=${inicioMes(mesActual)}&hasta=${finMes(mesActual)}`)
      .then((data) => {
        setEntregas(data.entregas);
        setDiasBloqueados(data.dias_bloqueados);
      })
      .catch((err) => setError(err.message));
  }, [mesActual]);

  function cambiarMes(delta) {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + delta, 1));
  }

  const nombreMes = mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="pagina-calendario">
      <div className="cabecera-pagina">
        <h2>Calendario de entregas</h2>
        <div>
          <button onClick={() => cambiarMes(-1)}>← Anterior</button>
          <span style={{ margin: '0 1rem', textTransform: 'capitalize' }}>{nombreMes}</span>
          <button onClick={() => cambiarMes(1)}>Siguiente →</button>
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <h3>Entregas previstas</h3>
      {entregas.length === 0 ? (
        <p className="ayuda-config">No hay entregas previstas este mes.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Fecha</th><th>Cliente</th><th>Documento</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {entregas.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.fecha_entrega).toLocaleDateString()}</td>
                <td>{e.cliente_nombre}</td>
                <td>{e.tipo_documento}</td>
                <td><span className="badge-tipo">{e.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Días bloqueados</h3>
      {diasBloqueados.length === 0 ? (
        <p className="ayuda-config">No hay días bloqueados este mes.</p>
      ) : (
        <ul className="lista-documentos">
          {diasBloqueados.map((d) => (
            <li key={d.id}>
              {new Date(d.fecha).toLocaleDateString()} {d.motivo && `— ${d.motivo}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
