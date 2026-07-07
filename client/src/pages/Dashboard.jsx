import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { badgeEstado } from '../utils/estado';
import { formatMoneda } from '../utils/moneda';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [rentabilidad, setRentabilidad] = useState(null);
  const [error, setError] = useState('');

  function cargar() {
    setError('');
    api.get('/dashboard/resumen')
      .then(setResumen)
      .catch(() => setError('No hemos podido cargar el resumen. Comprueba tu conexión e inténtalo de nuevo.'));
    api.get('/dashboard/rentabilidad')
      .then(setRentabilidad)
      .catch(() => setError('No hemos podido cargar los datos de rentabilidad. Comprueba tu conexión e inténtalo de nuevo.'));
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div className="pagina-dashboard">
      <h1>Bienvenido, {usuario?.nombre}</h1>
      {error && (
        <div className="error-msg">
          {error} <Button variante="fantasma" onClick={cargar}>Reintentar</Button>
        </div>
      )}

      {!resumen && !error && <Skeleton variante="tarjetas" filas={4} />}

      {resumen && (
        <>
          <div className="tarjetas-resumen">
            <StatCard valor={resumen.encargos_pendientes} label="Encargos pendientes" />
            <StatCard valor={formatMoneda(resumen.facturacion_mes)} label="Facturado este mes" />
            <StatCard
              valor={formatMoneda(resumen.pagos_pendientes)}
              label="Pendiente de cobro"
              alerta={resumen.pagos_pendientes > 0}
              to="/facturas"
            />
            <StatCard valor={resumen.total_clientes} label="Clientes" />
          </div>

          <section className="dashboard-seccion">
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
                      <td className="td-truncate">{e.cliente_nombre}</td>
                      <td className="td-truncate">{e.tipo_documento}</td>
                      <td><span className={badgeEstado(e.estado)}>{e.estado}</span></td>
                      <td>{new Date(e.fecha_entrega).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {rentabilidad && (
        <section className="dashboard-seccion dashboard-rentabilidad">
          <div className="dashboard-rentabilidad-grid">
            <div>
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
                        <td>{formatMoneda(r.total_facturado)}</td>
                        <td>{r.precio_por_palabra != null ? Number(r.precio_por_palabra).toFixed(4) + ' €' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
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
                        <td>{formatMoneda(r.total_facturado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
