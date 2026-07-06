import { createContext, useContext, useEffect, useState } from 'react';
import { api, registrarManejadorNoAutorizado } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  function limpiarSesion() {
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  useEffect(() => {
    registrarManejadorNoAutorizado(limpiarSesion);
  }, []);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  }

  function actualizarUsuario(datos) {
    const nuevo = { ...usuario, ...datos };
    localStorage.setItem('usuario', JSON.stringify(nuevo));
    setUsuario(nuevo);
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // si falla la llamada igualmente limpiamos la sesión local
    }
    limpiarSesion();
  }

  const estaAutenticado = !!usuario;

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, estaAutenticado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
