# Trad-CRM

CRM para un traductor jurado: clientes, encargos, presupuestos, facturación con PDF, gestión de documentos con recuento automático de palabras (OCR incluido) y recordatorios por email.

- **Frontend:** https://trad-crm.netlify.app
- **API:** https://backend-production-4886.up.railway.app

## Funcionalidades

- **Clientes**: alta/edición/baja, ficha con encargos, documentos, facturas y notas internas.
- **Presupuestos**: creación con archivo adjunto opcional; el número de palabras y el precio estimado se calculan automáticamente a partir del archivo (DOCX, PDF con texto o escaneado vía OCR, imágenes) y de las tarifas configuradas para el par de idiomas. Se pueden convertir en encargos.
- **Encargos**: seguimiento por estado (recibido → en curso → entregado → facturado), filtrado por cliente.
- **Facturas**: numeración automática, cálculo de IVA/IGIC/exento y retención de IRPF, generación de PDF con los datos de facturación y logo propios, exportación a CSV, recordatorio de impago por email.
- **Documentos**: subida versionada por encargo, recuento de palabras automático (mammoth para DOCX, pdf-parse + OCR de respaldo para PDF escaneados, Tesseract para imágenes), sugerencia de precio a partir de la tarifa configurada.
- **Calendario**: entregas próximas y días bloqueados (vacaciones, etc.).
- **Configuración**: perfil, contraseña, datos de facturación y logo, tarifas por par de idiomas, disponibilidad.
- **Administración** (solo rol `admin`): alta, listado y baja de cuentas de usuario.
- **Recordatorios automáticos**: resumen diario interno y avisos de entregas próximas / facturas impagadas por email (cron diario).

## Stack

| | |
|---|---|
| Frontend | React 19 + Vite, React Router, CSS plano con variables (tema claro/oscuro) |
| Backend | Node.js + Express, PostgreSQL (`pg`), JWT en cookie httpOnly |
| Documentos | mammoth, pdf-parse, pdf-to-img, tesseract.js, sharp, pdfkit |
| Email | nodemailer + node-cron |
| Despliegue | Netlify (frontend) · Railway (backend + PostgreSQL) |

## Estructura

```
client/   React + Vite (SPA)
server/   API Express + PostgreSQL
```

## Desarrollo local

Requiere Node 18+ y una base de datos PostgreSQL (puede ser la misma de Railway u otra local).

```bash
# Backend
cd server
npm install
cp .env.example .env   # completar DATABASE_URL, JWT_SECRET, etc.
npm run dev             # http://localhost:4000

# Frontend (en otra terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

Variables de entorno del backend (`server/.env`, ver `server/.env.example`):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Secreto para firmar los tokens de sesión |
| `PORT` | Puerto del servidor (Railway lo asigna automáticamente en producción) |
| `NODE_ENV` | `development` / `production` — controla cookies seguras y `sameSite` |
| `CLIENT_URL` | Origen permitido por CORS (URL del frontend) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Envío de emails de recordatorio (opcional; si se dejan vacíos, solo se registra un aviso en consola) |
| `RECORDATORIO_DIAS_ENTREGA` / `RECORDATORIO_DIAS_IMPAGO` | Umbrales de los recordatorios automáticos |

Variable de entorno del frontend (`client/.env` o variable de build en Netlify):

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (por defecto `http://localhost:4000/api` en desarrollo) |

El esquema base de la base de datos está en `server/config/schema.sql`; las migraciones incrementales posteriores están en `server/config/migracion_*.sql`.

## Despliegue

- **Backend**: Railway, servicio Node con volumen persistente montado en `/app/uploads` (documentos, logos y presupuestos subidos). Deploy con `railway up` desde `server/`.
- **Frontend**: Netlify, build con `npm run build` (Vite) y `client/public/_redirects` para el enrutado de la SPA. Deploy con `netlify deploy --prod` desde `client/`.

La cookie de sesión usa `sameSite: 'none'` en producción porque frontend y backend viven en dominios distintos.

## Estado del proyecto

No hay suite de tests automatizados; la verificación se hace manualmente (build + comprobación en navegador). El registro de cuentas (`POST /api/auth/registro`) requiere ser administrador autenticado — no hay alta pública.
