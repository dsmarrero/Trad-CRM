import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Panel from './Panel';

export function RutaPrivada({ children }) {
  const { estaAutenticado } = useAuth();
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }
  return <Panel>{children}</Panel>;
}
