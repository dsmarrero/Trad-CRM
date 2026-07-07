import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClienteContexto } from '../hooks/useClienteContexto';
import { useTema } from '../hooks/useTema';
import {
  LayoutDashboard, Users, Calendar, Receipt,
  FileText, Settings, ClipboardList, FileSearch,
  StickyNote, ChevronLeft, Sun, Moon, Menu, X
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
  const { tema, alternar } = useTema();
  const navigate = useNavigate();
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setAbierta(true)}
        aria-label="Abrir menú"
        aria-expanded={abierta}
      >
        <Menu size={20} />
      </button>

      {abierta && <div className="sidebar-overlay" onClick={() => setAbierta(false)} />}

      <aside className={'sidebar' + (abierta ? ' abierta' : '')}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-nombre">Trad-CRM</span>
          <button
            className="sidebar-toggle sidebar-toggle-cerrar"
            onClick={() => setAbierta(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {clienteId ? (
          <nav className="sidebar-nav">
            <button className="sidebar-volver" onClick={() => { navigate('/clientes'); setAbierta(false); }}>
              <ChevronLeft size={14} /> Clientes
            </button>
            <div className="sidebar-cliente-nombre">{clienteNombre || '…'}</div>
            {enlacesCliente(clienteId).map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                onClick={() => setAbierta(false)}
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
                onClick={() => setAbierta(false)}
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
          <div className="sidebar-footer-acciones">
            <button
              className="sidebar-tema-btn"
              onClick={alternar}
              title={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Cambiar tema"
            >
              {tema === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={logout}>Salir</button>
          </div>
        </div>
      </aside>
    </>
  );
}
