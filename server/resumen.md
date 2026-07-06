# CMS Traductor Jurado — Resumen del proyecto

**Stack:** React (Vite) + Express + PostgreSQL (Railway) + Netlify (pendiente de desplegar)

## Backend (`server/`)

- **Auth:** JWT, login/registro, perfil editable (nombre/email/contraseña)
- **Clientes:** CRUD completo
- **Encargos:** CRUD + cambio de estado (recibido/en_curso/entregado/facturado) + filtro por cliente
- **Documentos:** subida organizada por cliente/proyecto (`uploads/cliente_X/encargo_Y/`), recuento automático de palabras (DOCX, PDF, JPG/PNG/WEBP con OCR vía tesseract.js)
- **Facturas:** numeración automática (`F-2026-001`...), generación de PDF con diseño de marca real (logo, colores corporativos, IVA exento)
- **Idiomas/tarifas:** pares de idiomas configurables, cada uno con 4 tarifas (traducción, jurada, revisión, edición/hora) + tarifa mínima hasta X palabras
- **Disponibilidad:** días bloqueados (vacaciones, etc.)
- **Dashboard:** resumen real (encargos pendientes, facturación del mes, pagos pendientes, próximas entregas)

## Frontend (`client/`)

- Login + rutas protegidas + menú lateral (Sidebar)
- Identidad de marca: naranja `#F5641E`, oscuro `#0F1526`
- Páginas: Dashboard, Clientes (+ ficha detalle con sus encargos), Encargos, Documentos, Facturas, Configuración

## Pendiente para retomar

1. Verificar que el cambio de nombre de usuario se refleja bien (última corrección aplicada)
2. **Despliegue:** Netlify (frontend) + Railway (backend, BBDD ya está ahí)
3. Ideas opcionales no implementadas:
   - Plantillas de email
   - Recordatorios de entregas próximas
   - Exportar datos / backup
   - Roles multiusuario

## Para retomar

Decir "retomamos el CMS" y seguir desde despliegue o cualquier ajuste pendiente.

**Importante:** asegúrate de tener en tu carpeta local la última versión de todos los archivos entregados, y de haber ejecutado en Railway (`psql $DATABASE_URL`) todas las migraciones SQL generadas durante el proyecto.
