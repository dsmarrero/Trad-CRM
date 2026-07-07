# Rediseño de interfaz del CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar visualmente el CRM (React + Vite en `client/`) hacia una estética SaaS minimalista (grafito + naranja de marca), y convertir el patrón de creación/edición de Clientes, Encargos, Facturas, Presupuestos y Documentos de "formulario siempre visible" a "drawer + buscador".

**Architecture:** Cambios puramente de frontend sobre variables CSS existentes (`client/src/index.css`, `client/src/App.css`) y un conjunto pequeño de componentes React reutilizables nuevos (`Button`, `PageHeader`, `EmptyState`, `SearchInput`, `Skeleton`, `StatCard`) más un hook de filtrado (`useFiltroTexto`). Se reutiliza el componente `Drawer` ya existente sin tocar su API. No hay cambios de backend.

**Tech Stack:** React 19, Vite, react-router-dom, lucide-react (iconos), CSS plano con variables (sin frameworks de utilidades).

## Global Constraints

- No existe framework de tests automatizados en `client/` (no hay vitest/jest instalado, `client/package.json` solo tiene `dev/build/lint/preview`). No instalar uno como parte de este trabajo — está fuera de alcance según la spec. La verificación de cada tarea es manual: `cd client && npm run dev`, abrir `http://localhost:5173` (o el puerto que informe Vite) y comprobar en el navegador, más `npm run lint` (oxlint) para chequeo estático.
- No modificar backend, rutas de API, ni `server/` — spec fuera de alcance.
- Mantener nomenclatura en español de variables/funciones, igual que el resto del código existente.
- El componente `Drawer` (`client/src/components/Drawer.jsx`) no cambia de API (`abierto`, `onCerrar`, `titulo`, `children`) — solo se reutiliza con contenido nuevo.
- El naranja `#F5641E` (`var(--naranja)`) sigue siendo el único acento de color del sistema — no introducir otros colores de marca.
- Cualquier animación nueva debe respetar `prefers-reduced-motion` (ya es el patrón existente en `.drawer` y `.sidebar`).
- Spec de referencia: `docs/superpowers/specs/2026-07-07-rediseno-interfaz-crm-design.md`.

---

### Task 1: Tokens de color (paleta grafito)

**Files:**
- Modify: `client/src/App.css` (corregido: los tokens `:root`/`:root[data-tema="dark"]` viven al principio de `App.css`, no en `index.css` — `index.css` solo tiene el reset de `box-sizing`/`body`. `App.css` se importa después de `index.css` desde `main.jsx`, así que cualquier duplicado en `index.css` queda anulado por la cascada.)

**Interfaces:**
- Consumes: nada (es la base de todo el sistema de tokens).
- Produces: variables CSS `--oscuro`, `--oscuro-2`, `--fondo`, `--borde` con nuevos valores grafito, consumidas por todo el resto del CSS existente (sidebar, tablas, tarjetas, login) sin que ningún componente necesite cambiar.

- [ ] **Step 1: Cambiar los tokens del tema claro**

En `client/src/App.css`, dentro del bloque `:root { ... }` (líneas 3-21), sustituir:

```css
  --naranja: #F5641E;
  --naranja-suave: #FCE9DE;
  --oscuro: #0F1526;
  --oscuro-2: #1A2138;
  --texto: #1A1F2B;
  --gris: #5A6472;
  --borde: #E7E9ED;
  --ok: #2F8F5B;
  --ok-suave: #E7F6EE;
  --fondo: #F7F8FA;
```

por:

```css
  --naranja: #F5641E;
  --naranja-suave: #FCE9DE;
  --oscuro: #1C1E22;
  --oscuro-2: #2A2D33;
  --texto: #1A1F2B;
  --gris: #5A6472;
  --borde: #E9EAEC;
  --ok: #2F8F5B;
  --ok-suave: #E7F6EE;
  --fondo: #F6F7F8;
```

- [ ] **Step 2: Cambiar los tokens del tema oscuro**

En el mismo archivo (`client/src/App.css`), dentro de `:root[data-tema="dark"] { ... }` (líneas 23-34), sustituir:

```css
  --oscuro-2: #202840;
  --texto: #E7E9ED;
  --gris: #9AA3B5;
  --borde: #2A2F3D;
  --ok-suave: rgba(47, 143, 91, 0.18);
  --fondo: #0B0E14;
```

por:

```css
  --oscuro-2: #26292F;
  --texto: #E7E9ED;
  --gris: #9AA3B5;
  --borde: #2C2F35;
  --ok-suave: rgba(47, 143, 91, 0.18);
  --fondo: #0E0F12;
```

- [ ] **Step 3: Confirmar que `index.css` no define estos tokens**

```bash
grep -n "oscuro\|--fondo\|--borde" client/src/index.css
```

Expected: sin resultados. Si `index.css` ya define alguno de estos tokens (por ejemplo, por un cambio manual anterior), hay que eliminarlos de `index.css` en este mismo paso — solo debe existir una fuente de verdad (`App.css`) para evitar que la cascada (index.css se importa antes que App.css en `main.jsx`) anule el cambio silenciosamente.

- [ ] **Step 4: Verificar visualmente**

Ejecutar:

```bash
cd client
npm run dev
```

Abrir la URL que indique Vite, iniciar sesión y comprobar:
- El sidebar (fondo) ya no es azul-marino, es gris grafito neutro.
- La página de login (`/login` o pantalla inicial si no hay sesión) tiene el mismo fondo grafito en su gradiente, sin tono azulado.
- Cambiar el tema con el botón sol/luna del sidebar y confirmar que el tema oscuro también usa grafito, no azul, en fondo y bordes.

- [ ] **Step 5: Lint**

```bash
npm run lint
```

Expected: sin errores (es un cambio solo de CSS, no debería afectar al lint de JS).

- [ ] **Step 6: Commit**

```bash
git add client/src/App.css
git commit -m "style: paleta grafito neutro en lugar de azul-marino"
```

---

### Task 2: Ajustes globales de layout, tabla y badges

**Files:**
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: `var(--naranja)`, `var(--borde)`, `var(--fondo)`, `var(--gris)`, `var(--oscuro-2)` (de Task 1).
- Produces: nuevo estilo de `.sidebar-link.activo` (indicador sutil en vez de bloque sólido), `.panel-contenido` más ancho, `th` con fondo neutro, badges más compactos. No introduce clases nuevas que otras tareas necesiten consumir.

- [ ] **Step 1: Indicador de enlace activo en el sidebar**

En `client/src/App.css`, sustituir el bloque (líneas 185-202):

```css
.sidebar-link {
  color: #C7CCDA;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
}

.sidebar-link:hover {
  background: var(--oscuro-2);
  color: white;
}

.sidebar-link.activo {
  background: var(--naranja);
  color: white;
}
```

por:

```css
.sidebar-link {
  position: relative;
  color: #C7CCDA;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-link:hover {
  background: var(--oscuro-2);
  color: white;
}

.sidebar-link.activo {
  background: rgba(245, 100, 30, 0.14);
  color: var(--naranja);
}

.sidebar-link.activo::before {
  content: '';
  position: absolute;
  left: -0.9rem;
  top: 0.15rem;
  bottom: 0.15rem;
  width: 3px;
  border-radius: 2px;
  background: var(--naranja);
}
```

No hace falta tocar `client/src/components/Sidebar.jsx` — el indicador es puramente CSS sobre el `NavLink` que ya recibe la clase `activo`.

- [ ] **Step 2: Más aire en el contenido principal**

Sustituir (líneas 248-253):

```css
.panel-contenido {
  flex: 1;
  padding: 2.5rem;
  max-width: 1100px;
  min-width: 0;
}
```

por:

```css
.panel-contenido {
  flex: 1;
  padding: 3rem 3.5rem;
  max-width: 1280px;
  min-width: 0;
}
```

- [ ] **Step 3: Cabecera de tabla más ligera**

Sustituir (líneas 543-550):

```css
th {
  background: var(--oscuro);
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}
```

por:

```css
th {
  background: var(--fondo);
  color: var(--gris);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  border-bottom: 2px solid var(--borde);
}
```

- [ ] **Step 4: Badges más compactos**

Sustituir (líneas 585-591):

```css
.badge-ok, .badge-pendiente, .badge-tipo {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}
```

por:

```css
.badge-ok, .badge-pendiente, .badge-tipo {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}
```

Y sustituir el bloque `.badge-en-curso` (líneas 887-896):

```css
.badge-en-curso {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1D4ED8;
  background: #EFF6FF;
}
```

por:

```css
.badge-en-curso {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #1D4ED8;
  background: #EFF6FF;
}
```

- [ ] **Step 5: Verificar visualmente**

Con `npm run dev` corriendo (Task 1), navegar a `/clientes`, `/encargos` o `/facturas` (cualquier tabla con datos) y comprobar:
- El enlace activo del sidebar muestra una barra naranja fina a la izquierda + texto naranja, ya no un bloque naranja sólido.
- Las cabeceras de tabla (`th`) tienen fondo claro con texto gris, no un bloque oscuro.
- Las páginas con tablas anchas (Facturas, Encargos) usan más ancho de pantalla que antes.
- Los badges de estado se ven ligeramente más compactos.

- [ ] **Step 6: Lint y commit**

```bash
npm run lint
git add client/src/App.css
git commit -m "style: sidebar activo sutil, tabla mas ligera, mas aire en el contenido"
```

---

### Task 3: Componentes compartidos (Button, PageHeader, EmptyState, SearchInput, Skeleton, StatCard, useFiltroTexto)

**Files:**
- Create: `client/src/components/Button.jsx`
- Create: `client/src/components/PageHeader.jsx`
- Create: `client/src/components/EmptyState.jsx`
- Create: `client/src/components/SearchInput.jsx`
- Create: `client/src/components/Skeleton.jsx`
- Create: `client/src/components/StatCard.jsx`
- Create: `client/src/hooks/useFiltroTexto.js`
- Modify: `client/src/App.css`

**Interfaces:**
- Consumes: `.cabecera-pagina`, `.tarjeta`, `.tarjeta-alerta`, `.btn-peligro`, `var(--naranja)`, `var(--borde)`, `var(--gris)`, `var(--superficie)`, `var(--fondo)`, `var(--texto)` (ya existentes).
- Produces (nombres exactos que las Tasks 4-9 importan):
  - `Button` (`client/src/components/Button.jsx`), default export, props `{ variante = 'primario' | 'secundario' | 'fantasma' | 'peligro', children, ...propsDeBoton }`.
  - `PageHeader` (`client/src/components/PageHeader.jsx`), default export, props `{ titulo, descripcion, accion }`.
  - `EmptyState` (`client/src/components/EmptyState.jsx`), default export, props `{ icono, texto, accion }` (`icono` es un componente de icono de `lucide-react`).
  - `SearchInput` (`client/src/components/SearchInput.jsx`), default export, props `{ value, onChange, placeholder }` (`onChange` recibe directamente el string, no el evento).
  - `Skeleton` (`client/src/components/Skeleton.jsx`), default export, props `{ variante = 'tabla' | 'tarjetas', filas = 3, columnas = 4 }`.
  - `StatCard` (`client/src/components/StatCard.jsx`), default export, props `{ valor, label, alerta = false, to }`.
  - `useFiltroTexto` (`client/src/hooks/useFiltroTexto.js`), named export `useFiltroTexto(items, texto, campos)` devuelve el array `items` filtrado.

- [ ] **Step 1: Crear `useFiltroTexto`**

`client/src/hooks/useFiltroTexto.js`:

```js
// Filtra `items` por coincidencia de texto (sin distinguir mayúsculas) en cualquiera
// de los `campos` indicados. Si `texto` está vacío devuelve `items` sin tocar.
export function useFiltroTexto(items, texto, campos) {
  const busqueda = texto.trim().toLowerCase();
  if (!busqueda) return items;
  return items.filter((item) =>
    campos.some((campo) => String(item[campo] ?? '').toLowerCase().includes(busqueda))
  );
}
```

- [ ] **Step 2: Crear `Button`**

`client/src/components/Button.jsx`:

```jsx
export default function Button({ variante = 'primario', className = '', children, ...props }) {
  const clases = `btn-${variante}${className ? ' ' + className : ''}`;
  return (
    <button className={clases} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Crear `PageHeader`**

`client/src/components/PageHeader.jsx`:

```jsx
export default function PageHeader({ titulo, descripcion, accion }) {
  return (
    <div className="cabecera-pagina">
      <div>
        <h2>{titulo}</h2>
        {descripcion && <p className="page-header-descripcion">{descripcion}</p>}
      </div>
      {accion && <div className="page-header-accion">{accion}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Crear `EmptyState`**

`client/src/components/EmptyState.jsx`:

```jsx
export default function EmptyState({ icono: Icono, texto, accion }) {
  return (
    <div className="empty-state">
      {Icono && <Icono size={28} className="empty-state-icono" />}
      <p>{texto}</p>
      {accion}
    </div>
  );
}
```

- [ ] **Step 5: Crear `SearchInput`**

`client/src/components/SearchInput.jsx`:

```jsx
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
```

- [ ] **Step 6: Crear `Skeleton`**

`client/src/components/Skeleton.jsx`:

```jsx
export default function Skeleton({ variante = 'tabla', filas = 3, columnas = 4 }) {
  if (variante === 'tarjetas') {
    return (
      <div className="tarjetas-resumen">
        {Array.from({ length: filas }).map((_, i) => (
          <div className="tarjeta" key={i}>
            <span className="skeleton-bloque" style={{ width: '50%', height: '1.6rem' }} />
            <span className="skeleton-bloque" style={{ width: '80%' }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <table className="skeleton-tabla">
      <tbody>
        {Array.from({ length: filas }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: columnas }).map((_, j) => (
              <td key={j}><span className="skeleton-bloque" /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 7: Crear `StatCard`**

`client/src/components/StatCard.jsx`:

```jsx
import { Link } from 'react-router-dom';

export default function StatCard({ valor, label, alerta = false, to }) {
  const clase = 'tarjeta' + (alerta ? ' tarjeta-alerta' : '');
  const contenido = (
    <>
      <span className="tarjeta-valor">{valor}</span>
      <span className="tarjeta-label">{label}</span>
    </>
  );
  return to ? <Link to={to} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>;
}
```

- [ ] **Step 8: Añadir el CSS de todos los componentes nuevos**

Al final de `client/src/App.css`, añadir:

```css
/* PAGE HEADER */
.page-header-descripcion {
  margin: 0.3rem 0 0;
  color: var(--gris);
  font-size: 0.9rem;
}
.page-header-accion {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* BOTONES COMPARTIDOS */
.btn-primario {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--naranja);
  color: white;
  border: none;
  padding: 0.65rem 1.3rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}
.btn-primario:hover { background: #E15414; box-shadow: 0 4px 12px rgba(245,100,30,0.28); }
.btn-primario:active { transform: translateY(1px); }
.btn-primario:disabled { background: var(--gris); cursor: not-allowed; box-shadow: none; opacity: 0.6; }

.btn-secundario {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  color: var(--texto);
  border: 1.5px solid var(--borde);
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.btn-secundario:hover { border-color: var(--naranja); color: var(--naranja); }
.btn-secundario:disabled { cursor: not-allowed; opacity: 0.6; }

.btn-fantasma {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1.5px solid var(--borde);
  color: var(--gris);
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  margin-right: 0.3rem;
  transition: all 0.15s ease;
}
.btn-fantasma:hover { border-color: var(--naranja); color: var(--naranja); background: var(--naranja-suave); }

/* EMPTY STATE */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--gris);
  background: var(--superficie);
  border: 1px dashed var(--borde);
  border-radius: 14px;
}
.empty-state-icono { color: var(--gris); opacity: 0.6; }
.empty-state p { margin: 0; font-size: 0.9rem; }

/* SEARCH INPUT */
.search-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--superficie);
  border: 1.5px solid var(--borde);
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  color: var(--gris);
  max-width: 320px;
  margin-bottom: 1.2rem;
}
.search-input input {
  border: none;
  outline: none;
  background: none;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--texto);
  width: 100%;
  padding: 0;
  flex: 1;
  min-width: 0;
}
.search-input:focus-within { border-color: var(--naranja); }

/* SKELETON */
.skeleton-tabla { width: 100%; border-collapse: collapse; }
.skeleton-tabla td { padding: 0.8rem 1rem; }
.skeleton-bloque {
  display: block;
  height: 0.9rem;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--borde) 25%, var(--fondo) 50%, var(--borde) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.4s ease-in-out infinite;
}
@keyframes skeletonShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-bloque { animation: none; }
}

/* STAT CARD: el naranja ya no es el color por defecto de todos los valores */
.tarjeta-alerta .tarjeta-valor {
  color: var(--naranja);
}
```

Y sustituir la regla existente (líneas 293-297):

```css
.tarjeta-valor {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--naranja);
}
```

por:

```css
.tarjeta-valor {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--texto);
}
```

(la nueva regla `.tarjeta-alerta .tarjeta-valor` del bloque anterior es la que devuelve el naranja solo para la tarjeta de alerta).

- [ ] **Step 9: Lint**

```bash
cd client
npm run lint
```

Expected: sin errores. Estos componentes todavía no se usan en ninguna página — se verifican visualmente al integrarlos en la Task 4.

- [ ] **Step 10: Commit**

```bash
git add client/src/components/Button.jsx client/src/components/PageHeader.jsx client/src/components/EmptyState.jsx client/src/components/SearchInput.jsx client/src/components/Skeleton.jsx client/src/components/StatCard.jsx client/src/hooks/useFiltroTexto.js client/src/App.css
git commit -m "feat: componentes compartidos Button, PageHeader, EmptyState, SearchInput, Skeleton, StatCard"
```

---

### Task 4: Clientes — drawer + buscador + empty state

**Files:**
- Modify: `client/src/pages/Clientes.jsx` (reescritura completa del archivo)

**Interfaces:**
- Consumes: `useFiltroTexto`, `Button`, `PageHeader`, `EmptyState`, `SearchInput`, `Skeleton`, `Drawer` (Tasks 1-3).
- Produces: nada que otras tareas consuman — es una página hoja.

- [ ] **Step 1: Reescribir `client/src/pages/Clientes.jsx`**

```jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = { nombre: '', email: '', telefono: '', empresa: '', nif: '', direccion: '', notas: '' };

export default function Clientes() {
  const { items: clientes, error, setError, cargando, crear, actualizar, eliminar } = useCrud('/clientes');
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const clientesFiltrados = useFiltroTexto(clientes, busqueda, ['nombre', 'email', 'empresa']);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNuevo() {
    setForm(VACIO);
    setEditandoId(null);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await actualizar(editandoId, form);
      } else {
        await crear(form);
      }
      setForm(VACIO);
      setEditandoId(null);
      setDrawerAbierto(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditar(cliente) {
    setForm({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      empresa: cliente.empresa || '',
      nif: cliente.nif || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    });
    setEditandoId(cliente.id);
    setDrawerAbierto(true);
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await eliminar(id);
    } catch (err) {
      setError(err.message);
    }
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setEditandoId(null);
  }

  return (
    <div className="pagina-clientes">
      <PageHeader
        titulo="Clientes"
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo cliente</Button>}
      />
      {error && <div className="error-msg">{error}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, email o empresa..." />

      {cargando ? <Skeleton columnas={6} /> : clientesFiltrados.length === 0 ? (
        <EmptyState
          icono={Users}
          texto={busqueda ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no tienes clientes. Añade el primero.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Añadir cliente</Button>}
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Email</th><th>Teléfono</th><th>Empresa</th><th>NIF/CIF</th><th></th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.email}</td>
                <td>{c.telefono}</td>
                <td>{c.empresa}</td>
                <td>{c.nif || <span className="badge-pendiente">falta</span>}</td>
                <td>
                  <Link to={`/clientes/${c.id}`}>Ver ficha</Link>{' '}
                  <Button variante="fantasma" onClick={() => handleEditar(c)}>Editar</Button>
                  <Button variante="fantasma" onClick={() => handleEliminar(c.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo={editandoId ? 'Editar cliente' : 'Nuevo cliente'}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <input name="nombre" aria-label="Nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} required />
          <input name="email" aria-label="Email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="telefono" aria-label="Teléfono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
          <input name="empresa" aria-label="Empresa" placeholder="Empresa" value={form.empresa} onChange={handleChange} />
          <input name="nif" aria-label="NIF o CIF" placeholder="NIF/CIF (para facturar)" value={form.nif} onChange={handleChange} />
          <input name="direccion" aria-label="Dirección fiscal" placeholder="Dirección fiscal *" value={form.direccion} onChange={handleChange} required />
          <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
          <Button type="submit" variante="primario">{editandoId ? 'Guardar cambios' : 'Añadir cliente'}</Button>
        </form>
      </Drawer>
    </div>
  );
}
```

Nota: se elimina el botón "Cancelar" que existía junto al formulario — el `Drawer` ya ofrece tres formas de cerrar sin guardar (botón X, click en overlay, tecla ESC), así que un botón adicional era redundante.

- [ ] **Step 2: Verificar en el navegador**

Con `npm run dev` corriendo, ir a `/clientes` y comprobar:
- La tabla se muestra sola, sin formulario visible encima.
- El botón "Nuevo cliente" (arriba a la derecha) abre un drawer por la derecha con el formulario vacío.
- Rellenar nombre + dirección fiscal (únicos obligatorios) y enviar: el drawer se cierra y el cliente aparece en la tabla.
- Pulsar "Editar" en una fila abre el drawer con los datos precargados; guardar actualiza la fila.
- Escribir en el buscador un nombre parcial: la tabla se filtra en vivo. Si no hay coincidencias, aparece el empty state con el icono de personas.
- Borrar el texto de búsqueda con la tabla vacía de clientes (o crear una cuenta nueva sin clientes) para ver el empty state "Todavía no tienes clientes."
- Pulsar "Eliminar" en una fila: sigue pidiendo confirmación nativa como antes.

- [ ] **Step 3: Lint y commit**

```bash
cd client
npm run lint
git add client/src/pages/Clientes.jsx
git commit -m "refactor: Clientes usa drawer, buscador y empty state"
```

---

### Task 5: Encargos — drawer + buscador + empty state

**Files:**
- Modify: `client/src/pages/Encargos.jsx` (reescritura completa del archivo)

**Interfaces:**
- Consumes: igual que Task 4, más `api` (`client/src/services/api.js`, ya existente).
- Produces: nada.

- [ ] **Step 1: Reescribir `client/src/pages/Encargos.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = {
  cliente_id: '', idioma_origen: '', idioma_destino: '',
  tipo_documento: '', fecha_entrega: '', precio: '', notas: ''
};

const ESTADOS = ['recibido', 'en_curso', 'entregado', 'facturado'];

export default function Encargos() {
  const [encargos, setEncargos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const encargosFiltrados = useFiltroTexto(encargos, busqueda, ['cliente_nombre', 'tipo_documento']);

  async function cargar() {
    try {
      const [dataEncargos, dataClientes, dataIdiomas] = await Promise.all([
        api.get('/encargos'),
        api.get('/clientes'),
        api.get('/idiomas')
      ]);
      setEncargos(dataEncargos);
      setClientes(dataClientes);
      setIdiomas(dataIdiomas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNuevo() {
    setForm(VACIO);
    setEditandoId(null);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await api.put(`/encargos/${editandoId}`, form);
      } else {
        await api.post('/encargos', form);
      }
      setForm(VACIO);
      setEditandoId(null);
      setDrawerAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditar(encargo) {
    setForm({
      cliente_id: String(encargo.cliente_id),
      idioma_origen: encargo.idioma_origen,
      idioma_destino: encargo.idioma_destino,
      tipo_documento: encargo.tipo_documento || '',
      fecha_entrega: encargo.fecha_entrega ? encargo.fecha_entrega.slice(0, 10) : '',
      precio: encargo.precio || '',
      notas: encargo.notas || ''
    });
    setEditandoId(encargo.id);
    setDrawerAbierto(true);
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setEditandoId(null);
  }

  async function handleCambiarEstado(id, estado) {
    try {
      await api.patch(`/encargos/${id}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este encargo?')) return;
    try {
      await api.delete(`/encargos/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-encargos">
      <PageHeader
        titulo="Encargos"
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo encargo</Button>}
      />
      {error && <div className="error-msg">{error}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente o documento..." />

      {cargando ? <Skeleton columnas={7} /> : encargosFiltrados.length === 0 ? (
        <EmptyState
          icono={ClipboardList}
          texto={busqueda ? 'Ningún encargo coincide con la búsqueda.' : 'Todavía no tienes encargos. Añade el primero.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Añadir encargo</Button>}
        />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Idiomas</th><th>Documento</th><th>Estado</th><th>Entrega</th><th>Precio</th><th></th>
          </tr>
        </thead>
        <tbody>
          {encargosFiltrados.map((e) => (
            <tr key={e.id}>
              <td>{e.cliente_nombre}</td>
              <td>{e.idioma_origen} → {e.idioma_destino}</td>
              <td>{e.tipo_documento}</td>
              <td>
                <select value={e.estado} onChange={(ev) => handleCambiarEstado(e.id, ev.target.value)}>
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td>{e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleDateString() : '-'}</td>
              <td>{e.precio ? `${e.precio} €` : '-'}</td>
              <td>
                <Button variante="fantasma" onClick={() => handleEditar(e)}>Editar</Button>
                <Button variante="fantasma" onClick={() => handleEliminar(e.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo={editandoId ? 'Editar encargo' : 'Nuevo encargo'}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <select name="cliente_id" aria-label="Cliente" value={form.cliente_id} onChange={handleChange} required>
            <option value="">Selecciona cliente *</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            aria-label="Par de idiomas"
            value={form.idioma_origen && form.idioma_destino ? `${form.idioma_origen}|${form.idioma_destino}` : ''}
            onChange={(e) => {
              const [origen, destino] = e.target.value.split('|');
              setForm({ ...form, idioma_origen: origen || '', idioma_destino: destino || '' });
            }}
            required
          >
            <option value="">Par de idiomas *</option>
            {idiomas.map((i) => (
              <option key={i.id} value={`${i.idioma_origen}|${i.idioma_destino}`}>
                {i.idioma_origen} → {i.idioma_destino}
              </option>
            ))}
          </select>
          <input name="tipo_documento" aria-label="Tipo de documento" placeholder="Tipo de documento" value={form.tipo_documento} onChange={handleChange} />
          <input name="fecha_entrega" aria-label="Fecha de entrega" type="date" value={form.fecha_entrega} onChange={handleChange} />
          <input name="precio" aria-label="Precio en euros" type="number" step="0.01" placeholder="Precio (€)" value={form.precio} onChange={handleChange} />
          <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
          <Button type="submit" variante="primario">{editandoId ? 'Guardar cambios' : 'Añadir encargo'}</Button>
        </form>
      </Drawer>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en el navegador**

En `/encargos`:
- Tabla sola, botón "Nuevo encargo" abre drawer vacío; el `<select>` de estado en cada fila sigue funcionando inline, sin abrir el drawer.
- Crear un encargo de prueba (cliente + par de idiomas son obligatorios) y confirmar que aparece en la tabla.
- Editar un encargo existente desde el drawer y guardar cambios.
- Buscar por parte del nombre de un cliente y comprobar el filtrado; buscar algo que no exista y ver el empty state con el icono de lista.

- [ ] **Step 3: Lint y commit**

```bash
cd client
npm run lint
git add client/src/pages/Encargos.jsx
git commit -m "refactor: Encargos usa drawer, buscador y empty state"
```

---

### Task 6: Facturas — drawer + buscador + empty state

**Files:**
- Modify: `client/src/pages/Facturas.jsx` (reescritura completa del archivo)

**Interfaces:**
- Consumes: igual que Task 4/5.
- Produces: nada.

- [ ] **Step 1: Reescribir `client/src/pages/Facturas.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { api } from '../services/api';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = {
  encargo_id: '', importe: '', tipo_impuesto: 'exento', porcentaje_impuesto: '',
  aplica_retencion_irpf: false, porcentaje_retencion_irpf: ''
};
const PORCENTAJES_SUGERIDOS = { iva: 21, igic: 7 };
const PORCENTAJE_RETENCION_SUGERIDO = 15;

// Palabras del/de los documento(s) original(es) vigentes de un encargo, multiplicadas por la
// tarifa configurada para su par de idiomas (con tarifa mínima si aplica). Se usa tanto para
// la sugerencia en vivo al elegir un encargo como para el texto de ayuda bajo el campo.
function calcularBaseImponible(documentos, parIdiomas) {
  const palabras = documentos
    .filter((d) => d.tipo === 'original' && d.palabras != null
      && !documentos.some((otro) => otro.reemplaza_a === d.id))
    .reduce((suma, d) => suma + d.palabras, 0);

  const tarifa = parIdiomas ? Number(parIdiomas.tarifa_traduccion) : NaN;
  if (!parIdiomas || palabras <= 0 || !Number.isFinite(tarifa)) {
    return { base: null, detalle: '' };
  }
  const aplicaMinima = parIdiomas.palabras_minimas && palabras <= Number(parIdiomas.palabras_minimas);
  const base = aplicaMinima
    ? Math.max(palabras * tarifa, Number(parIdiomas.tarifa_minima))
    : palabras * tarifa;
  const detalle = aplicaMinima
    ? `${palabras} palabras (tarifa mínima aplicada)`
    : `${palabras} palabras × ${tarifa} €/palabra`;
  return { base, detalle };
}

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [encargos, setEncargos] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [documentosEncargo, setDocumentosEncargo] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [idiomaPdf, setIdiomaPdf] = useState({});

  const facturasFiltradas = useFiltroTexto(facturas, busqueda, ['numero', 'cliente_nombre']);

  async function cargar() {
    try {
      const [dataFacturas, dataEncargos, dataIdiomas] = await Promise.all([
        api.get('/facturas'),
        api.get('/encargos'),
        api.get('/idiomas')
      ]);
      setFacturas(dataFacturas);
      setEncargos(dataEncargos);
      setIdiomas(dataIdiomas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function buscarParIdiomas(encargoId) {
    const encargo = encargos.find((e) => String(e.id) === String(encargoId));
    return encargo && idiomas.find(
      (i) => i.idioma_origen === encargo.idioma_origen && i.idioma_destino === encargo.idioma_destino
    );
  }

  const parIdiomas = buscarParIdiomas(form.encargo_id);
  const { base: baseCalculada, detalle: detalleCalculo } = calcularBaseImponible(documentosEncargo, parIdiomas);

  // Cambiar de encargo sugiere la base imponible automáticamente. Al editar una factura ya
  // existente, `handleEditar` carga el importe real guardado sin pasar por aquí, para no
  // sobrescribirlo con una sugerencia hasta que el usuario cambie el encargo a propósito.
  async function handleChangeEncargo(e) {
    const id = e.target.value;
    setForm((f) => ({ ...f, encargo_id: id, importe: '' }));
    if (!id) { setDocumentosEncargo([]); return; }
    try {
      const docs = await api.get(`/documentos/encargo/${id}`);
      setDocumentosEncargo(docs);
      const { base } = calcularBaseImponible(docs, buscarParIdiomas(id));
      if (base != null) {
        setForm((f) => ({ ...f, importe: base.toFixed(2) }));
      }
    } catch {
      setDocumentosEncargo([]);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleChangeTipoImpuesto(e) {
    const tipo = e.target.value;
    setForm({
      ...form,
      tipo_impuesto: tipo,
      porcentaje_impuesto: tipo === 'exento' ? '' : (PORCENTAJES_SUGERIDOS[tipo] ?? '')
    });
  }

  function handleToggleRetencion(e) {
    const activa = e.target.checked;
    setForm({
      ...form,
      aplica_retencion_irpf: activa,
      porcentaje_retencion_irpf: activa ? PORCENTAJE_RETENCION_SUGERIDO : ''
    });
  }

  function handleNuevo() {
    setForm(VACIO);
    setEditandoId(null);
    setDocumentosEncargo([]);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        porcentaje_impuesto: form.tipo_impuesto === 'exento' ? 0 : form.porcentaje_impuesto,
        porcentaje_retencion_irpf: form.aplica_retencion_irpf ? form.porcentaje_retencion_irpf : 0
      };
      if (editandoId) {
        await api.put(`/facturas/${editandoId}`, payload);
      } else {
        await api.post('/facturas', payload);
      }
      setForm(VACIO);
      setEditandoId(null);
      setDocumentosEncargo([]);
      setDrawerAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditar(factura) {
    setForm({
      encargo_id: String(factura.encargo_id),
      importe: factura.importe,
      tipo_impuesto: factura.tipo_impuesto,
      porcentaje_impuesto: factura.tipo_impuesto === 'exento' ? '' : factura.porcentaje_impuesto,
      aplica_retencion_irpf: factura.aplica_retencion_irpf,
      porcentaje_retencion_irpf: factura.aplica_retencion_irpf ? factura.porcentaje_retencion_irpf : ''
    });
    setEditandoId(factura.id);
    setDrawerAbierto(true);
    try {
      const docs = await api.get(`/documentos/encargo/${factura.encargo_id}`);
      setDocumentosEncargo(docs);
    } catch {
      setDocumentosEncargo([]);
    }
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setEditandoId(null);
    setDocumentosEncargo([]);
  }

  function idiomaPdfDe(id) {
    return idiomaPdf[id] || 'es';
  }

  async function handleVerPdf(id) {
    try {
      const blob = await api.descargarArchivo(`/facturas/${id}/pdf?idioma=${idiomaPdfDe(id)}`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarcarPagada(id) {
    try {
      await api.patch(`/facturas/${id}/pagar`, {});
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar esta factura?')) return;
    try {
      await api.delete(`/facturas/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEnviarRecordatorio(id) {
    if (!confirm('¿Enviar un recordatorio de pago por email a este cliente?')) return;
    try {
      await api.post(`/facturas/${id}/recordatorio`, {});
      alert('Recordatorio enviado');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExportarCSV() {
    try {
      const blob = await api.descargarArchivo('/facturas/exportar');
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'facturas.csv';
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-facturas">
      <PageHeader
        titulo="Facturas"
        accion={<>
          <Button variante="secundario" onClick={handleExportarCSV}>Exportar CSV</Button>
          <Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nueva factura</Button>
        </>}
      />
      {error && <div className="error-msg">{error}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por número o cliente..." />

      {cargando ? <Skeleton columnas={9} /> : facturasFiltradas.length === 0 ? (
        <EmptyState
          icono={Receipt}
          texto={busqueda ? 'Ninguna factura coincide con la búsqueda.' : 'Todavía no tienes facturas. Crea la primera.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Crear factura</Button>}
        />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Nº</th><th>Cliente</th><th>Base</th><th>Impuesto</th><th>Retención</th><th>Total</th><th>Estado</th><th>Emisión</th><th></th>
          </tr>
        </thead>
        <tbody>
          {facturasFiltradas.map((f) => {
            const base = Number(f.importe);
            const porcentaje = Number(f.porcentaje_impuesto) || 0;
            const porcentajeRetencion = Number(f.porcentaje_retencion_irpf) || 0;
            const importeRetencion = f.aplica_retencion_irpf ? base * (porcentajeRetencion / 100) : 0;
            const total = base * (1 + porcentaje / 100) - importeRetencion;
            return (
            <tr key={f.id}>
              <td>{f.numero}</td>
              <td>{f.cliente_nombre}</td>
              <td>{base.toFixed(2)} €</td>
              <td>{f.tipo_impuesto === 'exento' ? 'Exento' : `${f.tipo_impuesto.toUpperCase()} ${porcentaje}%`}</td>
              <td>{f.aplica_retencion_irpf ? `-${porcentajeRetencion}%` : '-'}</td>
              <td>{total.toFixed(2)} €</td>
              <td>
                <span className={f.estado_pago === 'pagada' ? 'badge-ok' : 'badge-pendiente'}>
                  {f.estado_pago}
                </span>
              </td>
              <td>{new Date(f.fecha_emision).toLocaleDateString()}</td>
              <td>
                <select
                  aria-label="Idioma del PDF"
                  value={idiomaPdfDe(f.id)}
                  onChange={(e) => setIdiomaPdf({ ...idiomaPdf, [f.id]: e.target.value })}
                >
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                </select>
                <Button variante="fantasma" onClick={() => handleVerPdf(f.id)}>Ver PDF</Button>
                <Button variante="fantasma" onClick={() => handleEditar(f)}>Editar</Button>
                {f.estado_pago !== 'pagada' && (
                  <>
                    <Button variante="fantasma" onClick={() => handleMarcarPagada(f.id)}>Marcar pagada</Button>
                    <Button variante="fantasma" onClick={() => handleEnviarRecordatorio(f.id)}>Recordar pago</Button>
                  </>
                )}
                <Button variante="fantasma" onClick={() => handleEliminar(f.id)}>Eliminar</Button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo={editandoId ? 'Editar factura' : 'Nueva factura'}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <select name="encargo_id" aria-label="Encargo" value={form.encargo_id} onChange={handleChangeEncargo} required>
            <option value="">Selecciona encargo *</option>
            {encargos.map((e) => (
              <option key={e.id} value={e.id}>
                #{e.id} - {e.cliente_nombre} ({e.idioma_origen}→{e.idioma_destino})
              </option>
            ))}
          </select>
          <input name="importe" aria-label="Base imponible en euros" type="number" step="0.01" placeholder="Base imponible (€) *" value={form.importe} onChange={handleChange} required />
          {form.encargo_id && (
            baseCalculada != null
              ? <span className="ayuda-calculo">Calculado: {detalleCalculo} = {baseCalculada.toFixed(2)} €</span>
              : <span className="ayuda-calculo">Sin cálculo automático (falta documento original con palabras extraídas o tarifa configurada) — introduce la base manualmente</span>
          )}
          <select name="tipo_impuesto" aria-label="Tipo de impuesto" value={form.tipo_impuesto} onChange={handleChangeTipoImpuesto}>
            <option value="exento">Exento</option>
            <option value="iva">IVA</option>
            <option value="igic">IGIC</option>
          </select>
          {form.tipo_impuesto !== 'exento' && (
            <input
              name="porcentaje_impuesto"
              aria-label="Porcentaje de impuesto"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="% impuesto *"
              value={form.porcentaje_impuesto}
              onChange={handleChange}
              required
            />
          )}
          <label className="check-retencion">
            <input type="checkbox" checked={form.aplica_retencion_irpf} onChange={handleToggleRetencion} />
            Retención IRPF
          </label>
          {form.aplica_retencion_irpf && (
            <input
              name="porcentaje_retencion_irpf"
              aria-label="Porcentaje de retención de IRPF"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="% retención *"
              value={form.porcentaje_retencion_irpf}
              onChange={handleChange}
              required
            />
          )}
          <Button type="submit" variante="primario">{editandoId ? 'Guardar cambios' : 'Crear factura'}</Button>
        </form>
      </Drawer>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en el navegador**

En `/facturas`:
- "Exportar CSV" (botón secundario) sigue descargando el CSV igual que antes.
- "Nueva factura" abre el drawer; elegir un encargo con documento original con palabras extraídas debe rellenar automáticamente la base imponible calculada (comprobar el texto de ayuda bajo el campo).
- Marcar "Retención IRPF" muestra el campo de porcentaje con 15 precargado, igual que antes.
- Editar una factura existente carga sus datos en el drawer.
- Buscar por número de factura o nombre de cliente filtra la tabla; sin coincidencias muestra el empty state.
- Los botones de fila (Ver PDF, Editar, Marcar pagada, Recordar pago, Eliminar) siguen funcionando igual, solo con estilo nuevo.

- [ ] **Step 3: Lint y commit**

```bash
cd client
npm run lint
git add client/src/pages/Facturas.jsx
git commit -m "refactor: Facturas usa drawer, buscador y empty state"
```

---

### Task 7: Presupuestos — drawer + buscador + empty state

**Files:**
- Modify: `client/src/pages/Presupuestos.jsx` (reescritura completa del archivo)

**Interfaces:**
- Consumes: igual que tareas anteriores, más `useCrud` (`client/src/hooks/useCrud.js`, ya existente — acepta `FormData` o un objeto plano indistintamente).
- Produces: nada.

- [ ] **Step 1: Reescribir `client/src/pages/Presupuestos.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { Plus, FileSearch } from 'lucide-react';
import { api } from '../services/api';
import { useCrud } from '../hooks/useCrud';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = {
  cliente_id: '', idioma_origen: '', idioma_destino: '',
  tipo_documento: '', palabras_estimadas: '', precio_estimado: '', notas: ''
};

export default function Presupuestos() {
  const { items: presupuestos, error, setError, cargando, cargar, crear, eliminar } = useCrud('/presupuestos');
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [archivo, setArchivo] = useState(null);
  const [info, setInfo] = useState('');
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const presupuestosFiltrados = useFiltroTexto(presupuestos, busqueda, ['cliente_nombre', 'tipo_documento']);

  useEffect(() => {
    api.get('/clientes').then(setClientes).catch((err) => setError(err.message));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNuevo() {
    setForm(VACIO);
    setArchivo(null);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (archivo) {
        // El orden importa: multer necesita cliente_id antes que el archivo
        // en el multipart para poder resolver la carpeta de destino.
        const formData = new FormData();
        Object.entries(form).forEach(([clave, valor]) => formData.append(clave, valor));
        formData.append('archivo', archivo);
        await crear(formData);
      } else {
        await crear(form);
      }
      setForm(VACIO);
      setArchivo(null);
      setDrawerAbierto(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDescargar(id, nombreArchivo) {
    try {
      const blob = await api.descargarArchivo(`/presupuestos/${id}/descargar`);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCambiarEstado(id, estado) {
    try {
      await api.patch(`/presupuestos/${id}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvertir(id) {
    if (!confirm('¿Convertir este presupuesto en un encargo?')) return;
    try {
      await api.post(`/presupuestos/${id}/convertir`, {});
      setInfo('Encargo creado a partir del presupuesto.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try {
      await eliminar(id);
    } catch (err) {
      setError(err.message);
    }
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setArchivo(null);
  }

  return (
    <div className="pagina-presupuestos">
      <PageHeader
        titulo="Presupuestos"
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo presupuesto</Button>}
      />
      {error && <div className="error-msg">{error}</div>}
      {info && <div className="ok-msg">{info}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente o documento..." />

      {cargando ? <Skeleton columnas={6} /> : presupuestosFiltrados.length === 0 ? (
        <EmptyState
          icono={FileSearch}
          texto={busqueda ? 'Ningún presupuesto coincide con la búsqueda.' : 'Todavía no tienes presupuestos. Crea el primero.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Crear presupuesto</Button>}
        />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Idiomas</th><th>Documento</th><th>Estimado</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          {presupuestosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.cliente_nombre}</td>
              <td>{p.idioma_origen} → {p.idioma_destino}</td>
              <td>
                {p.tipo_documento || '-'}
                {p.nombre_archivo && (
                  <>
                    {' '}
                    <button className="enlace-documento" onClick={() => handleDescargar(p.id, p.nombre_archivo)}>
                      {p.nombre_archivo}
                    </button>
                  </>
                )}
              </td>
              <td>
                {p.precio_estimado != null ? Number(p.precio_estimado).toFixed(2) + ' €' : '-'}
                {p.palabras_estimadas != null && (
                  <>
                    {' '}<span className="badge-palabras">{p.palabras_estimadas} palabras</span>
                  </>
                )}
              </td>
              <td>
                <span className={
                  p.estado === 'aceptado' ? 'badge-ok' : p.estado === 'rechazado' ? 'badge-pendiente' : 'badge-tipo'
                }>
                  {p.estado}
                </span>
              </td>
              <td>
                {p.estado === 'pendiente' && (
                  <>
                    <Button variante="fantasma" onClick={() => handleConvertir(p.id)}>Convertir en encargo</Button>
                    <Button variante="fantasma" onClick={() => handleCambiarEstado(p.id, 'rechazado')}>Rechazar</Button>
                  </>
                )}
                <Button variante="fantasma" onClick={() => handleEliminar(p.id)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo="Nuevo presupuesto">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <select name="cliente_id" aria-label="Cliente" value={form.cliente_id} onChange={handleChange} required>
            <option value="">Selecciona cliente *</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input name="idioma_origen" aria-label="Idioma origen" placeholder="Idioma origen *" value={form.idioma_origen} onChange={handleChange} required />
          <input name="idioma_destino" aria-label="Idioma destino" placeholder="Idioma destino *" value={form.idioma_destino} onChange={handleChange} required />
          <input name="tipo_documento" aria-label="Tipo de documento" placeholder="Tipo de documento" value={form.tipo_documento} onChange={handleChange} />
          <input name="palabras_estimadas" aria-label="Palabras estimadas" type="number" placeholder="Palabras estimadas" value={form.palabras_estimadas} onChange={handleChange} />
          <input name="precio_estimado" aria-label="Precio estimado en euros" type="number" step="0.01" placeholder="Precio estimado (€)" value={form.precio_estimado} onChange={handleChange} />
          <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
          <input type="file" aria-label="Documento a traducir (opcional)" onChange={(e) => setArchivo(e.target.files[0])} />
          {archivo && (
            <span className="ayuda-calculo">
              Al subir "{archivo.name}" se calculan las palabras y el precio estimado automáticamente
              (sustituye los valores manuales de arriba).
            </span>
          )}
          <Button type="submit" variante="primario">Crear presupuesto</Button>
        </form>
      </Drawer>
    </div>
  );
}
```

Nota: Presupuestos nunca tuvo edición (solo alta/baja/cambio de estado/conversión), así que el drawer conserva siempre el título "Nuevo presupuesto" — no se añade edición, sería ampliar el alcance.

- [ ] **Step 2: Verificar en el navegador**

En `/presupuestos`:
- "Nuevo presupuesto" abre el drawer; crear uno sin archivo y otro subiendo un archivo, confirmando que ambos caminos siguen funcionando.
- Buscar por cliente o tipo de documento filtra la tabla; sin resultados aparece el empty state.
- "Convertir en encargo", "Rechazar" y "Eliminar" siguen funcionando (solo cambia el estilo del botón).

- [ ] **Step 3: Lint y commit**

```bash
cd client
npm run lint
git add client/src/pages/Presupuestos.jsx
git commit -m "refactor: Presupuestos usa drawer, buscador y empty state"
```

---

### Task 8: Documentos — drawer de subida + buscador + empty state + limpieza de CSS muerto

**Files:**
- Modify: `client/src/pages/Documentos.jsx` (reescritura completa del archivo)
- Modify: `client/src/App.css` (eliminar regla ya no usada por ninguna página)

**Interfaces:**
- Consumes: igual que tareas anteriores.
- Produces: nada.

- [ ] **Step 1: Reescribir `client/src/pages/Documentos.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';

export default function Documentos() {
  const { encargoId: encargoIdRuta } = useParams();
  const [idiomas, setIdiomas] = useState([]);
  const [encargos, setEncargos] = useState([]);
  const [encargoId, setEncargoId] = useState(encargoIdRuta || '');
  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('original');
  const [error, setError] = useState('');
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const documentosFiltrados = useFiltroTexto(documentos, busqueda, ['nombre_archivo', 'tipo']);

  useEffect(() => {
    api.get('/encargos').then(setEncargos).catch((err) => setError(err.message));
    api.get('/idiomas').then(setIdiomas).catch(() => {});
  }, []);

  const encargoActual = encargos.find((e) => String(e.id) === String(encargoId));
  const parIdiomas = encargoActual && idiomas.find(
    (i) => i.idioma_origen === encargoActual.idioma_origen && i.idioma_destino === encargoActual.idioma_destino
  );
  const tarifa = parIdiomas ? Number(parIdiomas.tarifa_traduccion) : null;

  useEffect(() => {
    if (encargoIdRuta) {
      setEncargoId(encargoIdRuta);
      cargarDocumentos(encargoIdRuta);
    }
  }, [encargoIdRuta]);

  async function cargarDocumentos(id) {
    if (!id) { setDocumentos([]); return; }
    try {
      const data = await api.get(`/documentos/encargo/${id}`);
      setDocumentos(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSeleccionEncargo(e) {
    const id = e.target.value;
    setEncargoId(id);
    cargarDocumentos(id);
  }

  function handleNuevo() {
    setArchivo(null);
    setTipo('original');
    setDrawerAbierto(true);
  }

  async function handleSubir(e) {
    e.preventDefault();
    setError('');
    if (!encargoId || !archivo) {
      setError('Selecciona un encargo y un archivo');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('encargo_id', encargoId);
      formData.append('tipo', tipo);
      formData.append('archivo', archivo);
      await api.post('/documentos', formData);
      setArchivo(null);
      setDrawerAbierto(false);
      cargarDocumentos(encargoId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSugerirPrecio(palabras) {
    if (!tarifa) {
      setError('No hay tarifa configurada para este par de idiomas. Ve a Configuración.');
      return;
    }
    const calculo = palabras * tarifa;
    const aplicaMinima = parIdiomas.palabras_minimas && palabras <= Number(parIdiomas.palabras_minimas);
    const precioFinal = aplicaMinima
      ? Math.max(calculo, Number(parIdiomas.tarifa_minima))
      : calculo;
    const precioSugerido = precioFinal.toFixed(2);
    const detalle = aplicaMinima
      ? `${palabras} palabras — se aplica tarifa mínima (hasta ${parIdiomas.palabras_minimas} palabras)`
      : `${palabras} palabras × ${tarifa} €`;
    if (!confirm(`¿Fijar precio del encargo en ${precioSugerido} € (${detalle})?`)) return;
    try {
      await api.patch(`/encargos/${encargoId}/precio`, { precio: precioSugerido });
      alert('Precio actualizado en el encargo');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete(`/documentos/${id}`);
      cargarDocumentos(encargoId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDescargar(id, nombreArchivo) {
    try {
      const blob = await api.descargarArchivo(`/documentos/${id}/descargar`);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-documentos">
      <PageHeader
        titulo="Documentos"
        accion={encargoId && <Button variante="primario" onClick={handleNuevo}><Upload size={16} /> Subir documento</Button>}
      />
      {encargoIdRuta && <Link to="/clientes" className="volver">← Volver a clientes</Link>}
      {error && <div className="error-msg">{error}</div>}

      <select value={encargoId} onChange={handleSeleccionEncargo} disabled={!!encargoIdRuta}>
        <option value="">Selecciona un encargo</option>
        {encargos.map((e) => (
          <option key={e.id} value={e.id}>
            #{e.id} - {e.cliente_nombre} ({e.idioma_origen}→{e.idioma_destino})
          </option>
        ))}
      </select>

      {encargoId && (
        <>
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o tipo..." />

          {documentosFiltrados.length === 0 ? (
            <EmptyState
              icono={FileText}
              texto={busqueda ? 'Ningún documento coincide con la búsqueda.' : 'Este encargo aún no tiene documentos.'}
              accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Subir documento</Button>}
            />
          ) : (
          <ul className="lista-documentos">
            {documentosFiltrados.map((d) => {
              const esVigente = !documentos.some((otro) => otro.reemplaza_a === d.id);
              return (
                <li key={d.id} className={esVigente ? '' : 'documento-superado'}>
                  <span className="badge-tipo">{d.tipo}</span>{' '}
                  <span className="badge-version">v{d.version}</span>{' '}
                  <button className="enlace-documento" onClick={() => handleDescargar(d.id, d.nombre_archivo)}>
                    {d.nombre_archivo}
                  </button>
                  {!esVigente && <span className="badge-superado">sustituido</span>}
                  {d.palabras != null && <span className="badge-palabras">{d.palabras} palabras</span>}
                  {esVigente && d.tipo === 'original' && d.palabras != null && tarifa && (
                    <Button variante="fantasma" onClick={() => handleSugerirPrecio(d.palabras)}>
                      Sugerir precio ({(d.palabras * tarifa).toFixed(2)} €)
                    </Button>
                  )}
                  <Button variante="fantasma" onClick={() => handleEliminar(d.id)}>Eliminar</Button>
                </li>
              );
            })}
          </ul>
          )}
        </>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={() => setDrawerAbierto(false)} titulo="Subir documento">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubir} className="drawer-body">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="original">Original</option>
            <option value="traducido">Traducido</option>
          </select>
          <input type="file" onChange={(e) => setArchivo(e.target.files[0])} required />
          <Button type="submit" variante="primario">Subir documento</Button>
        </form>
      </Drawer>
    </div>
  );
}
```

- [ ] **Step 2: Eliminar la regla CSS que ya no usa ninguna página**

Ahora que Clientes/Encargos/Facturas/Presupuestos/Documentos han dejado de usar las clases `form-cliente`, `form-encargo`, `form-factura`, `form-presupuesto` y `form-documento` (sustituidas por `drawer-body`), la siguiente regla de `client/src/App.css` (líneas 481-492) queda sin ningún consumidor. Eliminarla:

```css
form.form-cliente, form.form-encargo, form.form-factura, form.form-documento, form.form-presupuesto {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  background: var(--superficie);
  padding: 1.3rem;
  border-radius: 14px;
  border: 1px solid var(--borde);
  box-shadow: var(--sombra-tarjeta);
  margin-bottom: 1.5rem;
}
```

Antes de borrar, confirmar que ya no hay coincidencias:

```bash
cd client
grep -rE "form-cliente|form-encargo|form-factura|form-documento|form-presupuesto" src/
```

Expected: sin resultados (0 coincidencias) tras el borrado del CSS.

- [ ] **Step 3: Verificar en el navegador**

En `/documentos`:
- Sin encargo seleccionado no aparece el botón "Subir documento" en la cabecera.
- Al seleccionar un encargo con documentos, aparece el buscador y la lista; buscar por nombre de archivo o por "original"/"traducido" filtra correctamente.
- "Subir documento" abre el drawer con el selector de tipo + archivo; subir un archivo de prueba y confirmar que aparece en la lista y el drawer se cierra.
- Un encargo sin documentos muestra el empty state con botón "Subir documento".
- "Sugerir precio" y "Eliminar" en cada documento siguen funcionando.

- [ ] **Step 4: Lint y commit**

```bash
cd client
npm run lint
git add client/src/pages/Documentos.jsx client/src/App.css
git commit -m "refactor: Documentos usa drawer, buscador y empty state; limpia CSS muerto"
```

---

### Task 9: Dashboard — StatCard + Skeleton + limpieza de CSS muerto

**Files:**
- Modify: `client/src/pages/Dashboard.jsx` (reescritura completa del archivo)
- Modify: `client/src/App.css` (eliminar `.btn-enlace`, ya sin uso)

**Interfaces:**
- Consumes: `StatCard`, `Skeleton`, `Button` (Task 3).
- Produces: nada.

- [ ] **Step 1: Reescribir `client/src/pages/Dashboard.jsx`**

```jsx
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
```

- [ ] **Step 2: Eliminar `.btn-enlace`, ya sin uso**

`Dashboard.jsx` era el único consumidor de `.btn-enlace` (confirmado por búsqueda previa). En `client/src/App.css`, eliminar el bloque (líneas 613-622):

```css
.btn-enlace {
  background: none;
  border: none;
  padding: 0;
  color: var(--naranja);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
```

Confirmar que no queda ninguna referencia:

```bash
cd client
grep -r "btn-enlace" src/
```

Expected: sin resultados.

- [ ] **Step 3: Verificar en el navegador**

En `/dashboard`:
- Mientras carga (recarga forzada de la página), se ven 4 tarjetas-esqueleto con shimmer en vez de "Cargando...".
- Con datos cargados, solo la tarjeta "Pendiente de cobro" se muestra en naranja cuando hay importe pendiente; el resto de valores usa el color de texto normal.
- Si `pagos_pendientes` es 0, la tarjeta "Pendiente de cobro" ya no tiene fondo/borde de alerta ni valor naranja (comprobar ambos casos si es posible, o razonar sobre el código: la condición `alerta={resumen.pagos_pendientes > 0}` reproduce el comportamiento original de `tarjeta-alerta`).
- Provocar el error (parar el backend un momento) y confirmar que el botón "Reintentar" sigue funcionando con el nuevo estilo.

- [ ] **Step 4: Lint y commit**

```bash
cd client
npm run lint
git add client/src/pages/Dashboard.jsx client/src/App.css
git commit -m "refactor: Dashboard usa StatCard y Skeleton; limpia CSS muerto"
```

---

### Task 10: QA final — recorrido completo de la app

**Files:**
- Ninguno (tarea de verificación; solo produce commits de arreglos puntuales si aparece algo roto).

**Interfaces:**
- Consumes: el resultado de las Tasks 1-9 en conjunto.
- Produces: confirmación de que se cumplen los "Criterios de aceptación" de la spec (`docs/superpowers/specs/2026-07-07-rediseno-interfaz-crm-design.md`).

- [ ] **Step 1: Recorrido con tema claro**

Con `cd client && npm run dev` corriendo, y sesión iniciada, visitar en orden y comprobar que se ven correctamente con la paleta grafito+naranja: `/dashboard`, `/clientes` (+ abrir la ficha de un cliente para ver `ClienteDetalle`), `/presupuestos`, `/encargos`, `/calendario`, `/facturas`, `/documentos`, `/configuracion`. Ninguna debe mostrar restos de azul-marino en sidebar, cabeceras de tabla o botones.

- [ ] **Step 2: Recorrido con tema oscuro**

Pulsar el botón de sol/luna en el sidebar y repetir el recorrido del Step 1 en tema oscuro. Confirmar que el sidebar, fondos y bordes usan grafito oscuro (no azul-negro) y que el naranja sigue siendo legible sobre los fondos oscuros.

- [ ] **Step 3: Responsive**

Con las herramientas de desarrollador del navegador, simular un ancho de pantalla móvil (ej. 375px) y comprobar: el botón de menú hamburguesa abre el sidebar como antes, las tablas siguen siendo desplazables horizontalmente, y los drawers (Clientes/Encargos/Facturas/Presupuestos/Documentos) siguen ocupando el ancho disponible sin desbordar la pantalla.

- [ ] **Step 4: Comprobar cada criterio de aceptación de la spec**

Repasar `docs/superpowers/specs/2026-07-07-rediseno-interfaz-crm-design.md`, sección "Criterios de aceptación", y confirmar uno por uno:
- Las 9 páginas usan la nueva paleta en ambos temas — cubierto por Steps 1-2.
- Clientes/Encargos/Facturas/Presupuestos/Documentos crean y editan vía Drawer, sin formulario permanente sobre la tabla — cubierto por Tasks 4-8.
- Esas mismas 5 páginas tienen buscador funcional — cubierto por Tasks 4-8.
- Dashboard usa StatCard con el naranja solo en la tarjeta de alerta — cubierto por Task 9.
- Estados de carga usan Skeleton en vez de "Cargando..." — comprobado en Task 9 (Dashboard) y en Tasks 4-8 (skeleton de tabla); nota: `ClienteDetalle.jsx`, `Calendario.jsx` y `Configuracion.jsx` no se tocaron (fuera de alcance) y siguen mostrando "Cargando..." como antes — esto es intencional, no un defecto.
- Sin cambios de backend — confirmar con `git status`/`git diff` que no hay ningún archivo bajo `server/` modificado por este trabajo.

- [ ] **Step 5: Si algo falla, arreglarlo con un commit puntual**

Si algún paso anterior revela un problema (por ejemplo, un color que no cambió, un botón que quedó sin migrar), corregirlo directamente en el archivo correspondiente y hacer un commit específico describiendo el arreglo. No es necesario un paso de test automatizado — el propio recorrido manual de este Task es la verificación.
