# Mejora de Navegación Frontend — CMS Traductor Jurado

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactorizar la navegación del CRM para que el sidebar cambie de modo global a contextual al entrar en un cliente, y añadir un drawer lateral para ver/editar encargos sin cambiar de página.

**Architecture:** El sidebar recibe contexto de la ruta activa vía `useMatch` de React Router para alternar entre modo global y modo cliente. `ClienteDetalle` incorpora tabs (Encargos / Documentos / Notas) y abre un `Drawer` al pulsar un encargo. El drawer reutiliza los datos ya cargados en el componente padre.

**Tech Stack:** React 18, React Router v6, CSS custom properties (existentes), lucide-react (nuevo)

## Global Constraints

- No modificar ningún archivo de backend ni de API (`server/`)
- No modificar `services/api.js` ni `hooks/useCrud.js`
- Mantener variables CSS existentes en `App.css` (`--naranja`, `--oscuro`, `--gris`, etc.)
- No añadir frameworks UI pesados (no MUI, no Ant Design)
- Drawer y Tabs implementados en CSS puro
- `lucide-react` es la única dependencia nueva permitida

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `client/src/components/Breadcrumb.jsx` | Crear | Barra de navegación contextual clickable |
| `client/src/components/Drawer.jsx` | Crear | Panel deslizante reutilizable desde la derecha |
| `client/src/components/Tabs.jsx` | Crear | Tabs accesibles con borde inferior naranja |
| `client/src/hooks/useClienteContexto.js` | Crear | Detecta clienteId en ruta, carga nombre del cliente |
| `client/src/components/Sidebar.jsx` | Modificar | Alternar modo global/contextual; añadir iconos |
| `client/src/components/Panel.jsx` | Sin cambios | Panel.jsx no necesita modificación — Sidebar usa el hook directamente |
| `client/src/pages/ClienteDetalle.jsx` | Modificar | Añadir tabs + drawer para encargos |
| `client/src/App.css` | Modificar | Estilos de drawer, tabs, breadcrumb, badge azul |
| `client/package.json` | Modificar | Añadir lucide-react |

---

## Task 1: Instalar lucide-react y añadir estilos base

**Files:**
- Modify: `client/package.json`
- Modify: `client/src/App.css`

**Interfaces:**
- Produces: Clases CSS `.drawer`, `.drawer-overlay`, `.tabs`, `.tabs-tab`, `.tabs-tab.activo`, `.breadcrumb`, `.badge-en-curso` disponibles para tasks siguientes

- [ ] **Step 1: Instalar lucide-react**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm install lucide-react
```

Esperado: `added 1 package` sin errores

- [ ] **Step 2: Verificar instalación**

```bash
node -e "require('lucide-react'); console.log('OK')"
```

Esperado: `OK`

- [ ] **Step 3: Añadir estilos al final de App.css**

Añadir al final de `client/src/App.css`:

```css
/* BREADCRUMB */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--gris);
  margin-bottom: 1.5rem;
}
.breadcrumb a {
  color: var(--gris);
  text-decoration: none;
  font-weight: 600;
}
.breadcrumb a:hover { color: var(--naranja); }
.breadcrumb-sep { color: var(--borde); }

/* TABS */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--borde);
  margin-bottom: 1.5rem;
}
.tabs-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gris);
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease;
}
.tabs-tab:hover { color: var(--texto); }
.tabs-tab.activo {
  color: var(--texto);
  border-bottom-color: var(--naranja);
}

/* DRAWER */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 999;
}
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100vh;
  background: white;
  z-index: 1000;
  box-shadow: -8px 0 32px rgba(15,21,38,0.12);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  animation: drawerEntrar 0.22s ease;
}
@keyframes drawerEntrar {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.drawer-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--borde);
  flex-shrink: 0;
}
.drawer-cabecera h3 { margin: 0; font-size: 1rem; }
.drawer-cerrar {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gris);
  display: flex;
  align-items: center;
  padding: 0.3rem;
  border-radius: 6px;
}
.drawer-cerrar:hover { background: var(--fondo); color: var(--texto); }
.drawer-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  flex: 1;
}
.drawer-campo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.drawer-campo label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gris);
}
.drawer-campo span, .drawer-campo select {
  font-size: 0.95rem;
  font-weight: 600;
}
.drawer-acciones {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--borde);
  flex-shrink: 0;
}
.btn-ia {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--naranja);
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: not-allowed;
  opacity: 0.45;
  font-family: inherit;
}
.btn-peligro {
  background: transparent;
  border: 1.5px solid #FECACA;
  color: #DC2626;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
}
.btn-peligro:hover { background: #FEF2F2; }

/* BADGE EN CURSO */
.badge-en-curso {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1D4ED8;
  background: #EFF6FF;
}

/* SIDEBAR ICONS */
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.sidebar-link svg { flex-shrink: 0; }
.sidebar-volver {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9AA3B5;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
}
.sidebar-volver:hover { color: white; }
.sidebar-cliente-nombre {
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--oscuro-2);
}
```

- [ ] **Step 4: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

Esperado: `built in` sin errores

- [ ] **Step 5: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/package.json client/package-lock.json client/src/App.css
git commit -m "feat: instalar lucide-react y añadir estilos de drawer/tabs/breadcrumb"
```

---

## Task 2: Componente Breadcrumb

**Files:**
- Create: `client/src/components/Breadcrumb.jsx`

**Interfaces:**
- Produces: `<Breadcrumb items={[{label, to?}]} />` — `to` opcional; si se omite, el segmento es texto plano

- [ ] **Step 1: Crear Breadcrumb.jsx**

```jsx
// client/src/components/Breadcrumb.jsx
import { Link } from 'react-router-dom';

/**
 * items: Array<{ label: string, to?: string }>
 */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Migas de pan">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span style={{ color: 'var(--texto)', fontWeight: 600 }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/components/Breadcrumb.jsx
git commit -m "feat: componente Breadcrumb de navegación contextual"
```

---

## Task 3: Componente Tabs

**Files:**
- Create: `client/src/components/Tabs.jsx`

**Interfaces:**
- Produces: `<Tabs tabs={string[]} activo={string} onCambiar={fn} />`

- [ ] **Step 1: Crear Tabs.jsx**

```jsx
// client/src/components/Tabs.jsx
export default function Tabs({ tabs, activo, onCambiar }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={tab === activo}
          className={'tabs-tab' + (tab === activo ? ' activo' : '')}
          onClick={() => onCambiar(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/components/Tabs.jsx
git commit -m "feat: componente Tabs accesible"
```

---

## Task 4: Componente Drawer

**Files:**
- Create: `client/src/components/Drawer.jsx`

**Interfaces:**
- Produces: `<Drawer abierto={bool} onCerrar={fn} titulo={string}>{children}</Drawer>`

- [ ] **Step 1: Crear Drawer.jsx**

```jsx
// client/src/components/Drawer.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ abierto, onCerrar, titulo, children }) {
  useEffect(() => {
    if (!abierto) return;
    function handleKey(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onCerrar} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="drawer-cabecera">
          <h3>{titulo}</h3>
          <button className="drawer-cerrar" onClick={onCerrar} aria-label="Cerrar panel">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/components/Drawer.jsx
git commit -m "feat: componente Drawer deslizante con cierre por ESC y overlay"
```

---

## Task 5: Hook useClienteContexto

**Files:**
- Create: `client/src/hooks/useClienteContexto.js`

**Interfaces:**
- Produces: `useClienteContexto()` devuelve `{ clienteId: string|null, clienteNombre: string|null }`

- [ ] **Step 1: Crear useClienteContexto.js**

```js
// client/src/hooks/useClienteContexto.js
import { useEffect, useState } from 'react';
import { useMatch } from 'react-router-dom';
import { api } from '../services/api';

export function useClienteContexto() {
  const match = useMatch('/clientes/:id');
  const matchSub = useMatch('/clientes/:id/*');
  const clienteId = (match || matchSub)?.params?.id || null;
  const [clienteNombre, setClienteNombre] = useState(null);

  useEffect(() => {
    if (!clienteId) { setClienteNombre(null); return; }
    api.get(`/clientes/${clienteId}`)
      .then((c) => setClienteNombre(c.nombre))
      .catch(() => setClienteNombre(null));
  }, [clienteId]);

  return { clienteId, clienteNombre };
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/hooks/useClienteContexto.js
git commit -m "feat: hook useClienteContexto detecta cliente activo en la ruta"
```

---

## Task 6: Refactorizar Sidebar con modos global/contextual e iconos

**Files:**
- Modify: `client/src/components/Sidebar.jsx`

**Interfaces:**
- Consumes: `useClienteContexto()` de `../hooks/useClienteContexto`
- Produces: sidebar con modo global o contextual según ruta

- [ ] **Step 1: Reescribir Sidebar.jsx**

Reemplazar contenido completo de `client/src/components/Sidebar.jsx`:

```jsx
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
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/components/Sidebar.jsx
git commit -m "feat: sidebar con modo global/contextual e iconos lucide"
```

---

## Task 7: Añadir rutas de subnav de cliente en App.jsx

**Files:**
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `ClienteDetalle` con prop `tabInicial?: string`
- Produces: rutas `/clientes/:id/documentos`, `/clientes/:id/facturas`, `/clientes/:id/notas` registradas

- [ ] **Step 1: Añadir rutas en App.jsx**

Tras la ruta existente `path="/clientes/:id"` (aproximadamente línea 39), añadir:

```jsx
<Route
  path="/clientes/:id/documentos"
  element={
    <RutaPrivada>
      <ClienteDetalle tabInicial="Documentos" />
    </RutaPrivada>
  }
/>
<Route
  path="/clientes/:id/facturas"
  element={
    <RutaPrivada>
      <ClienteDetalle tabInicial="Facturas" />
    </RutaPrivada>
  }
/>
<Route
  path="/clientes/:id/notas"
  element={
    <RutaPrivada>
      <ClienteDetalle tabInicial="Notas" />
    </RutaPrivada>
  }
/>
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/App.jsx
git commit -m "feat: rutas de subnav de cliente (docs/facturas/notas)"
```

---

## Task 8: Refactorizar ClienteDetalle con tabs y drawer

**Files:**
- Modify: `client/src/pages/ClienteDetalle.jsx`

**Interfaces:**
- Consumes:
  - `Breadcrumb` — `<Breadcrumb items={[{label, to?}]} />`
  - `Tabs` — `<Tabs tabs={string[]} activo={string} onCambiar={fn} />`
  - `Drawer` — `<Drawer abierto={bool} onCerrar={fn} titulo={string}>{children}</Drawer>`
  - `api.patch('/encargos/:id/estado', { estado })` — existente
  - `api.delete('/encargos/:id')` — existente
  - Prop `tabInicial?: string` — tab activo inicial, por defecto `'Encargos'`

- [ ] **Step 1: Reescribir ClienteDetalle.jsx**

Reemplazar contenido completo:

```jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, FileText } from 'lucide-react';
import { api } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import Tabs from '../components/Tabs';
import Drawer from '../components/Drawer';

const TABS = ['Encargos', 'Documentos', 'Notas'];
const ESTADOS = ['recibido', 'en_curso', 'entregado', 'facturado'];

function badgeEstado(estado) {
  const mapa = {
    recibido:  'badge-pendiente',
    en_curso:  'badge-en-curso',
    entregado: 'badge-ok',
    facturado: 'badge-ok',
  };
  return mapa[estado] || 'badge-tipo';
}

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
```

- [ ] **Step 2: Verificar build**

```bash
cd "C:/Desarrollo/CMS traductor/client"
npm run build 2>&1 | tail -5
```

Esperado: sin errores

- [ ] **Step 3: Commit**

```bash
cd "C:/Desarrollo/CMS traductor"
git add client/src/pages/ClienteDetalle.jsx
git commit -m "feat: ClienteDetalle con tabs, drawer de encargo y botón IA placeholder"
```

---

## Verificación end-to-end

1. Arrancar servidor: `cd "C:/Desarrollo/CMS traductor/server" && node index.js`
2. Arrancar cliente: `cd "C:/Desarrollo/CMS traductor/client" && npm run dev`
3. Abrir `http://localhost:5173`
4. **Sidebar global:** iconos en todos los enlaces, activo naranja
5. **Entrar en un cliente:** sidebar cambia a modo contextual con nombre y "← Clientes"
6. **Breadcrumb:** `Clientes / Nombre Cliente` arriba del contenido, clickable
7. **Tabs:** Encargos / Documentos / Notas — cambio sin recargar
8. **Drawer:** pulsar fila de encargo → drawer se abre desde la derecha
9. **Cerrar drawer:** ESC, clic en overlay, botón X — todos cierran
10. **Cambio de estado:** select en drawer → tabla actualizada
11. **Botón IA:** visible, deshabilitado, cursor not-allowed
12. **Volver modo global:** "← Clientes" en sidebar contextual
