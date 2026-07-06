import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RutaPrivada } from './components/RutaPrivada';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Encargos from './pages/Encargos';
import Facturas from './pages/Facturas';
import Documentos from './pages/Documentos';
import ClienteDetalle from './pages/ClienteDetalle';
import Configuracion from './pages/Configuracion';
import Calendario from './pages/Calendario';
import Presupuestos from './pages/Presupuestos';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RutaPrivada>
                <Dashboard />
              </RutaPrivada>
            }
          />
          <Route
            path="/clientes"
            element={
              <RutaPrivada>
                <Clientes />
              </RutaPrivada>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <RutaPrivada>
                <ClienteDetalle />
              </RutaPrivada>
            }
          />
          <Route
            path="/encargos"
            element={
              <RutaPrivada>
                <Encargos />
              </RutaPrivada>
            }
          />
          <Route
            path="/facturas"
            element={
              <RutaPrivada>
                <Facturas />
              </RutaPrivada>
            }
          />
          <Route
            path="/documentos"
            element={
              <RutaPrivada>
                <Documentos />
              </RutaPrivada>
            }
          />
          <Route
            path="/encargos/:encargoId/documentos"
            element={
              <RutaPrivada>
                <Documentos />
              </RutaPrivada>
            }
          />
          <Route
            path="/presupuestos"
            element={
              <RutaPrivada>
                <Presupuestos />
              </RutaPrivada>
            }
          />
          <Route
            path="/calendario"
            element={
              <RutaPrivada>
                <Calendario />
              </RutaPrivada>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RutaPrivada>
                <Configuracion />
              </RutaPrivada>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
