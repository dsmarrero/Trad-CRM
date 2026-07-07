require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const encargosRoutes = require('./routes/encargos');
const documentosRoutes = require('./routes/documentos');
const facturasRoutes = require('./routes/facturas');
const dashboardRoutes = require('./routes/dashboard');
const idiomasRoutes = require('./routes/idiomas');
const disponibilidadRoutes = require('./routes/disponibilidad');
const recordatoriosRoutes = require('./routes/recordatorios');
const presupuestosRoutes = require('./routes/presupuestos');
const { enviarResumenInterno } = require('./utils/recordatorios');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/encargos', encargosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/idiomas', idiomasRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/recordatorios', recordatoriosRoutes);
app.use('/api/presupuestos', presupuestosRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Trad-CRM funcionando' });
});

// Resumen diario de entregas próximas y facturas impagadas (08:00 hora del servidor)
cron.schedule('0 8 * * *', () => {
  enviarResumenInterno().catch((err) => console.error('Error en el resumen diario:', err.message));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
