import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClienteContexto } from '../hooks/useClienteContexto';
import {
  LayoutDashboard, Users, Calendar, Receipt,
  FileText, Settings, ClipboardList, FileSearch,
  StickyNote, ChevronLeft
} from 'lucide-react';

const ENLACES_GLOBAL = [
  { to: '/dashboard',     label: 'Panel',        Icon: LayoutDashboard },
  { to: '/clientes',      label: 'Clientes',      Icon: Users },
  { to: '/presupuestos',  label: 'Presupuestos',  Icon: FileSearch },
  { to: '/encargos',      label: 'Encargos',      Icon: ClipboardList },
  { to: '/calendario',    label: 'Calendario',    Icon: Calendar },
  { to: '/facturas',      label: 'Facturas',      Icon: Receipt },
  { to: '/documentos',    label: 'Documentos',    Icon: FileText },
  { to: '/configuracion', label: 'Configuración', Icon: Settings },
];

const enlacesCliente = (id) => [
  { to: `/clientes/${id}`,            label: 'Encargos',   Icon: ClipboardList },
  { to: `/clientes/${id}/documentos`, label: 'Documentos', Icon: FileText },
  { to: `/clientes/${id}/facturas`,   label: 'Facturas',   Icon: Receipt },
  { to: `/clientes/${id}/notas`,      label: 'Notas',      Icon: StickyNote },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const { clienteId, clienteNombre } = useClienteContexto();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-nombre">CMS</span>
        <span className="sidebar-brand-sub">Traductor Jurado</span>
      </div>

      {clienteId ? (
        <nav className="sidebar-nav">
          <button className="sidebar-volver" onClick={() => navigate('/clientes')}>
            <ChevronLeft size={14} /> Clientes
          </button>
          <div className="sidebar-cliente-nombre">{clienteNombre || '…'}</div>
          {enlacesCliente(clienteId).map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' activo' : '')}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      ) : (
        <nav className="sidebar-nav">
          {ENLACES_GLOBAL.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' activo' : '')}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="sidebar-footer">
        <span className="sidebar-usuario">{usuario?.nombre}</span>
        <button onClick={logout}>Salir</button>
      </div>
    </aside>
  );
}
