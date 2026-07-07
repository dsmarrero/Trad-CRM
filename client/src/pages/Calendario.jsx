import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../services/api';
import { badgeEstado } from '../utils/estado';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es }
});

const MENSAJES = {
  next: 'Siguiente', previous: 'Anterior', today: 'Hoy', month: 'Mes',
  noEventsInRange: 'No hay entregas ni días bloqueados en este rango.'
};

// El grid del mes muestra también días del mes anterior/siguiente para completar
// semanas, así que se piden entregas/bloqueos para ese rango visible completo,
// no solo para el mes en curso.
function rangoVisible(fecha) {
  const desde = startOfWeek(startOfMonth(fecha), { weekStartsOn: 1 });
  const hasta = endOfWeek(endOfMonth(fecha), { weekStartsOn: 1 });
  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') };
}

function eventPropGetter(evento) {
  return {
    style: {
      backgroundColor: evento.tipo === 'bloqueado' ? 'var(--gris)' : 'var(--naranja)',
      borderRadius: '6px',
      border: 'none'
    }
  };
}

export default function Calendario() {
  const [mesActual, setMesActual] = useState(new Date());
  const [entregas, setEntregas] = useState([]);
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const { desde, hasta } = rangoVisible(mesActual);
    api.get(`/dashboard/calendario?desde=${desde}&hasta=${hasta}`)
      .then((data) => {
        setEntregas(data.entregas);
        setDiasBloqueados(data.dias_bloqueados);
      })
      .catch((err) => setError(err.message));
  }, [mesActual]);

  const eventos = [
    ...entregas.map((e) => ({
      id: `encargo-${e.id}`,
      title: `${e.cliente_nombre} — ${e.tipo_documento || 'documento'}`,
      start: new Date(e.fecha_entrega),
      end: new Date(e.fecha_entrega),
      allDay: true,
      tipo: 'encargo'
    })),
    ...diasBloqueados.map((d) => ({
      id: `bloqueado-${d.id}`,
      title: `Bloqueado${d.motivo ? `: ${d.motivo}` : ''}`,
      start: new Date(d.fecha),
      end: new Date(d.fecha),
      allDay: true,
      tipo: 'bloqueado'
    }))
  ];

  return (
    <div className="pagina-calendario">
      <div className="cabecera-pagina">
        <h2>Calendario de entregas</h2>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <div className="calendario-grid">
        <Calendar
          localizer={localizer}
          culture="es"
          messages={MENSAJES}
          events={eventos}
          views={['month']}
          defaultView="month"
          date={mesActual}
          onNavigate={setMesActual}
          eventPropGetter={eventPropGetter}
          style={{ height: 600 }}
        />
      </div>

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
                <td><span className={badgeEstado(e.estado)}>{e.estado}</span></td>
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
