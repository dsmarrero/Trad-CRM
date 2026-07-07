# Rediseño de interfaz — CRM Traductor Jurado

**Fecha:** 2026-07-07
**Estado:** Aprobado para planificación

## Contexto

El CRM (React + Vite en `client/`, Express en `server/`) ya tiene una base funcional: sidebar con modo global/contextual, tema claro/oscuro, componentes `Drawer`, `Tabs` y `Breadcrumb`. Las 9 páginas (Dashboard, Clientes, ClienteDetalle, Encargos, Facturas, Presupuestos, Documentos, Calendario, Configuración) comparten un CSS global (`App.css`/`index.css`) con variables de tema, pero cada página repite a mano el patrón "formulario arriba + tabla abajo" con botones y estados de carga/vacío sin componer.

Objetivo: elevar la interfaz a un nivel "súper profesional y ágil" (estética SaaS moderno minimalista, tipo Linear/Notion) y mejorar la eficiencia de flujo real en las páginas de gestión, sin ampliar el alcance a funcionalidad de negocio nueva (sin backend nuevo, sin filtros de servidor, sin gráficas).

## Objetivos

- Estética SaaS minimalista: más aire, tipografía como jerarquía principal, color muy contenido.
- Un único acento de color (naranja de marca) reservado para acción primaria y alertas.
- Sensación de agilidad tanto visual (transiciones, skeletons) como de flujo (menos fricción para crear/editar/buscar registros).
- Aplicar el mismo nivel de cambio a todas las páginas, sin priorizar unas sobre otras.
- Reutilizar y extender lo que ya existe (`Drawer`, variables CSS, iconos Lucide) en vez de introducir un framework nuevo.

## Fuera de alcance

- Cambios de backend, API o modelo de datos.
- Búsqueda/filtrado en servidor (el buscador de listados es 100% cliente sobre los datos ya cargados).
- Gráficas/visualizaciones en el Dashboard (se mantienen las tablas de rentabilidad).
- Edición inline campo-a-campo en tablas (excepto el `<select>` de estado en Encargos, que ya existe hoy).
- Rebranding (logo, nombre "CMS Traductor Jurado" en el sidebar se mantiene).
- Migración a Tailwind u otro framework de utilidades.

## Diseño visual

### Tokens de color (`client/src/index.css`)

Se redefinen las variables existentes, mismo mecanismo de tema (`:root` / `:root[data-tema="dark"]`):

- `--oscuro`: pasa de azul-marino (`#0F1526`) a grafito neutro (ej. `#1C1E22`). Aplica a sidebar y cabecera de tablas.
- `--oscuro-2`: grafito ligeramente más claro, coherente con el nuevo `--oscuro` (hover de sidebar).
- `--fondo`: gris casi blanco más frío que el actual `#F7F8FA`.
- `--borde`: más sutil (menor contraste con `--fondo`).
- `--naranja` y `--naranja-suave`: se mantienen tal cual — es el único acento de color del sistema.
- Tema oscuro (`data-tema="dark"`): mismos criterios de grafito neutro en vez de azulado, manteniendo legibilidad.
- Tipografía: se mantiene Inter; no se introduce una segunda familia.

### Sidebar

- El estado activo (`.sidebar-link.activo`) deja de ser un bloque naranja sólido. Pasa a: barra indicadora fina a la izquierda del enlace + texto en naranja + fondo apenas remarcado (similar a `--oscuro-2` con opacidad baja). El resto del comportamiento (modo global/contextual, responsive, toggle de tema) no cambia.
- `.panel-contenido` gana más padding y su `max-width` aumenta para aprovechar mejor pantallas anchas en páginas con tablas densas (Facturas, Encargos).

### `PageHeader` (nuevo componente, `client/src/components/PageHeader.jsx`)

Sustituye los `<h2>Título</h2>` sueltos de cada página.

Props: `titulo`, `descripcion` (opcional), `accion` (nodo opcional, ej. un `<Button>` "Nuevo cliente").

Se usa en las 9 páginas para unificar cabecera.

### `Button` (nuevo componente, `client/src/components/Button.jsx`)

Variantes: `primario` (naranja, relleno), `secundario` (borde, fondo transparente), `fantasma` (sin borde, para acciones de tabla), `peligro` (reutiliza estilo de `.btn-peligro` ya existente).

Sustituye los `<button>` sueltos con clases repetidas en formularios y tablas. Los estilos CSS subyacentes (`form button`, `td button`, `.btn-peligro`) se consolidan en clases `.btn-primario`, `.btn-secundario`, `.btn-fantasma`, `.btn-peligro`.

### `EmptyState` (nuevo componente, `client/src/components/EmptyState.jsx`)

Props: `icono` (componente Lucide opcional), `texto`, `accion` (nodo opcional).

Sustituye los `<p className="ayuda-config">...</p>` usados hoy como mensaje de "no hay datos" en Dashboard, ClienteDetalle, etc.

### `SearchInput` + hook `useFiltroTexto`

- `SearchInput.jsx`: input con icono de lupa (Lucide `Search`), estilo consistente con el resto de inputs.
- `client/src/hooks/useFiltroTexto.js`: hook `useFiltroTexto(items, texto, campos)` que devuelve los `items` filtrados en cliente, comparando `texto` (lowercased, sin acentos no es necesario) contra los `campos` indicados de cada item.
- Se usa en Clientes, Encargos, Facturas, Presupuestos, Documentos. Cada página decide qué campos son "buscables" (ej. Clientes: `nombre`, `email`, `empresa`; Facturas: `numero`, `cliente_nombre`).

### Patrón de creación/edición: Drawer

En Clientes, Encargos, Facturas, Presupuestos, Documentos:

- El formulario deja de estar siempre visible sobre la tabla. `PageHeader` incluye un botón primario ("Nuevo cliente", "Nuevo encargo"...) que abre el `Drawer` existente (`client/src/components/Drawer.jsx`, sin modificar su API) con el formulario vacío.
- El botón "Editar" de cada fila abre el mismo `Drawer` precargado con los datos de esa fila.
- El formulario dentro del drawer reutiliza los mismos campos/validación (`required`, etc.) que ya existen hoy — solo cambia el contenedor (de `<form className="form-cliente">` inline a dentro de `drawer-body`).
- El `<select>` inline de cambio de estado en Encargos se mantiene igual (no es un flujo de creación/edición completo).
- Confirmación de borrado: se mantiene el `confirm()` nativo actual (fuera de alcance mejorarlo).

### Tablas y badges

- Cabecera de tabla (`th`): pasa de fondo `--oscuro` sólido a fondo neutro claro con texto en mayúsculas pequeño (sin bloque de color), manteniendo `letter-spacing` actual.
- Filas: hover se mantiene (`tbody tr:hover`), ligeramente más sutil.
- Badges (`badge-ok`, `badge-pendiente`, `badge-tipo`, `badge-en-curso`, `badge-version`, `badge-superado`): se mantienen conceptualmente, se ajustan tamaños/paddings para coherencia con la nueva paleta.

### Dashboard

- Las `.tarjeta` de `tarjetas-resumen` pasan a un componente `StatCard` (`client/src/components/StatCard.jsx`): mismo layout (valor + label), pero el naranja en `.tarjeta-valor` deja de ser el color por defecto de todos los números — solo se usa naranja cuando la tarjeta representa una alerta/atención (ej. "Pendiente de cobro" cuando hay importe pendiente, que ya tiene hoy su propia variante `.tarjeta-alerta`). El resto de valores usan el color de texto principal (`--texto`) con el mismo peso tipográfico grande.
- Tablas de "Próximas entregas" y "Rentabilidad" (por idioma / por tipo documento): solo restyling de tabla (ver arriba), sin cambios de estructura ni gráficas.

### Estados de carga (skeletons)

- Se sustituyen los `<p>Cargando...</p>` de Dashboard, Clientes, Encargos, Facturas, Presupuestos, Documentos por un componente `Skeleton.jsx` simple: bloques grises con animación shimmer, dimensionados según el contexto (filas de tabla o stat cards).
- Respeta `prefers-reduced-motion` (igual que ya hace `.drawer` y `.sidebar` hoy: animación desactivada si el usuario lo prefiere).

### Micro-interacciones

- Se mantienen las transiciones ya existentes (hover de botones, apertura de drawer, sidebar responsive).
- Se añaden transiciones sutiles de color/fondo en filas de tabla y enlaces de sidebar, coherentes con las duraciones ya usadas en el proyecto (`0.15s`–`0.22s` ease).

### Calendario y Configuración

- Solo restyling de tokens (colores, tipografía, bordes) heredado de las variables CSS globales. Sin cambios estructurales ni de componentes nuevos — no forman parte de los flujos CRUD priorizados en este proyecto.

## Componentes nuevos (resumen)

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| `PageHeader` | `client/src/components/PageHeader.jsx` | Título + descripción opcional + acción primaria por página |
| `Button` | `client/src/components/Button.jsx` | Botón con variantes primario/secundario/fantasma/peligro |
| `EmptyState` | `client/src/components/EmptyState.jsx` | Mensaje consistente cuando no hay datos |
| `SearchInput` | `client/src/components/SearchInput.jsx` | Input de búsqueda con icono |
| `StatCard` | `client/src/components/StatCard.jsx` | Tarjeta de métrica del Dashboard |
| `Skeleton` | `client/src/components/Skeleton.jsx` | Placeholder de carga con shimmer |
| `useFiltroTexto` | `client/src/hooks/useFiltroTexto.js` | Filtrado en cliente de listas por texto |

Componentes existentes que se reutilizan sin cambios de API: `Drawer`, `Tabs`, `Breadcrumb`, `Sidebar` (solo se retoca su CSS de estado activo).

## Riesgos / puntos de atención

- El `Drawer` actual está dimensionado (480px) y estilado para mostrar datos de solo lectura (ficha de encargo). Al usarlo también para formularios de creación con `required`/validación, hay que verificar que los estilos de `drawer-body`/`drawer-campo` funcionan bien con `<input>`/`<select>` editables, no solo con `<span>` de solo lectura. No se cambia la API del componente, solo el contenido que se le pasa como `children`.
- Cinco páginas (Clientes, Encargos, Facturas, Presupuestos, Documentos) migran su formulario de "siempre visible" a "dentro de drawer" — esto toca la lógica de estado de cada página (`editandoId`, `form`, `handleEditar`, etc.), no solo el JSX. Se hace página por página, no en un cambio atómico gigante.
- El cambio de paleta (`--oscuro` de azul a grafito) afecta a sidebar, cabeceras de tabla y `login-page` (que usa `--oscuro`/`--oscuro-2` en su gradiente) — hay que revisar el login también aunque no se mencionó explícitamente, para que no quede visualmente inconsistente con el resto.

## Criterios de aceptación

- Las 9 páginas usan la nueva paleta de tokens (grafito + naranja único acento) en ambos temas (claro/oscuro).
- Clientes, Encargos, Facturas, Presupuestos y Documentos: crear y editar se hace vía `Drawer`; ya no hay formulario permanente sobre la tabla.
- Esas mismas 5 páginas tienen buscador funcional que filtra la tabla en cliente.
- Dashboard usa `StatCard` con el naranja reservado a la tarjeta de alerta, no a todos los valores.
- Estados de carga usan `Skeleton` en vez de texto "Cargando...".
- No hay cambios de backend ni de contrato de API.
