import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ENLACES = [
  { to: '/dashboard', label: 'Panel' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/presupuestos', label: 'Presupuestos' },
  { to: '/encargos', label: 'Encargos' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/facturas', label: 'Facturas' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/configuracion', label: 'Configuración' },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-nombre">CMS</span>
        <span className="sidebar-brand-sub">Traductor Jurado</span>
      </div>

      <nav className="sidebar-nav">
        {ENLACES.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' activo' : '')}
          >
            {e.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-usuario">{usuario?.nombre}</span>
        <button onClick={logout}>Salir</button>
      </div>
    </aside>
  );
}
