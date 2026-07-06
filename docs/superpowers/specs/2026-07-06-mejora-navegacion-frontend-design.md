# Mejora de navegación frontend — CMS Traductor Jurado

**Fecha:** 2026-07-06
**Estado:** Aprobado
**Alcance:** Fase 1 — Navegación y UX del CRM (sin motor IA)

## Objetivo

Mejorar la navegación para que refleje el flujo real:
Entrar → crear/buscar cliente → crear/buscar encargo → subir documento → (futuro) traducir con IA

## Flujo principal

1. Usuario entra al panel
2. Va a Clientes → busca o crea un cliente
3. Entra al cliente → ve sus Encargos en tabs
4. Pulsa un encargo → se abre un drawer lateral con detalle
5. Desde el drawer: sube documentos, cambia estado, genera factura
6. Botón "Traducir con IA" visible pero deshabilitado (Fase 2)

## Arquitectura de navegación

### Sidebar en dos modos

Modo global (rutas fuera de cliente): Panel, Clientes, Calendario, Facturas, Documentos, Configuración

Modo contextual (dentro de cliente): flecha volver, Nombre Cliente, Encargos, Documentos, Facturas, Notas

Detección: useMatch de React Router sobre el patron /clientes/:id

### Breadcrumb superior
Clientes / María López / Encargos — cada segmento clickable.

## Vista de cliente (ClienteDetalle)

Tabs: Encargos (por defecto), Documentos, Facturas
Tab activo: borde inferior naranja. Tab inactivo: texto gris.

## Drawer de encargo

- Ancho 480px, altura 100vh, position fixed, z-index 1000
- Overlay rgba(0,0,0,0.35)
- Cierre: botón X, clic en overlay, ESC

Contenido:
1. Cabecera: tipo documento + badge estado
2. Metadatos: idiomas, fecha entrega, precio, palabras
3. Cambio de estado
4. Documentos adjuntos + subir documento
5. Botón "Traducir con IA" (disabled, Fase 2)
6. Acciones: Generar factura | Eliminar

## Sistema de diseño

Badges de estado:
- Pendiente: naranja / naranja-suave
- En curso: #1D4ED8 / #EFF6FF (nuevo)
- Entregado: verde / verde-suave
- Archivado: gris / fondo

Iconos: lucide-react, 16px sidebar, 18px acciones

## Componentes

Nuevos:
- components/Breadcrumb.jsx
- components/Drawer.jsx
- components/Tabs.jsx
- hooks/useClienteContexto.js

Modificados:
- components/Sidebar.jsx — modo global/contextual
- components/Panel.jsx — pasa contexto cliente al sidebar
- pages/ClienteDetalle.jsx — añade tabs + drawer
- App.css — estilos drawer, tabs, breadcrumb, badge azul

Sin tocar:
- services/api.js, hooks/useCrud.js
- Facturas.jsx, Documentos.jsx, Configuracion.jsx, Calendario.jsx
- Backend y rutas Express

## Dependencias nuevas

lucide-react (~50KB, iconos SVG)

## Fuera de alcance (Fase 2)

- Motor de traducción IA (OCR, traducción automática, RAG)
- Integración con API de IA (Claude, DeepL u otra)
- El botón "Traducir con IA" queda como placeholder visual en el drawer
