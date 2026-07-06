import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [rentabilidad, setRentabilidad] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/resumen')
      .then(setResumen)
      .catch((err) => setError(err.message));
    api.get('/dashboard/rentabilidad')
      .then(setRentabilidad)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="pagina-dashboard">
      <h1>Bienvenido, {usuario?.nombre}</h1>
      {error && <div className="error-msg">{error}</div>}
      {!resumen && !error && <p>Cargando...</p>}

      {resumen && (
        <>
          <div className="tarjetas-resumen">
            <div className="tarjeta">
              <span className="tarjeta-valor">{resumen.encargos_pendientes}</span>
              <span className="tarjeta-label">Encargos pendientes</span>
            </div>
            <div className="tarjeta">
              <span className="tarjeta-valor">{resumen.facturacion_mes.toFixed(2)} €</span>
              <span className="tarjeta-label">Facturado este mes</span>
            </div>
            <div className="tarjeta">
              <span className="tarjeta-valor">{resumen.pagos_pendientes.toFixed(2)} €</span>
              <span className="tarjeta-label">Pendiente de cobro</span>
            </div>
            <div className="tarjeta">
              <span className="tarjeta-valor">{resumen.total_clientes}</span>
              <span className="tarjeta-label">Clientes</span>
            </div>
          </div>

          <h3>Próximas entregas</h3>
          {resumen.proximas_entregas.length === 0 ? (
            <p className="ayuda-config">No hay encargos con fecha de entrega pendiente.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Cliente</th><th>Documento</th><th>Estado</th><th>Entrega</th></tr>
              </thead>
              <tbody>
                {resumen.proximas_entregas.map((e) => (
                  <tr key={e.id}>
                    <td>{e.cliente_nombre}</td>
                    <td>{e.tipo_documento}</td>
                    <td><span className="badge-tipo">{e.estado}</span></td>
                    <td>{new Date(e.fecha_entrega).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {rentabilidad && (
        <>
          <h3>Rentabilidad por par de idiomas</h3>
          {rentabilidad.por_idioma.length === 0 ? (
            <p className="ayuda-config">Aún no hay encargos con precio para calcular rentabilidad.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Idiomas</th><th>Encargos</th><th>Facturado</th><th>€/palabra</th></tr>
              </thead>
              <tbody>
                {rentabilidad.por_idioma.map((r, i) => (
                  <tr key={i}>
                    <td>{r.idioma_origen} → {r.idioma_destino}</td>
                    <td>{r.encargos}</td>
                    <td>{Number(r.total_facturado).toFixed(2)} €</td>
                    <td>{r.precio_por_palabra != null ? Number(r.precio_por_palabra).toFixed(4) + ' €' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Rentabilidad por tipo de documento</h3>
          {rentabilidad.por_tipo_documento.length === 0 ? (
            <p className="ayuda-config">Aún no hay datos suficientes.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Tipo de documento</th><th>Encargos</th><th>Facturado</th></tr>
              </thead>
              <tbody>
                {rentabilidad.por_tipo_documento.map((r, i) => (
                  <tr key={i}>
                    <td>{r.tipo_documento}</td>
                    <td>{r.encargos}</td>
                    <td>{Number(r.total_facturado).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
