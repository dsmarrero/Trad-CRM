import { useEffect, useState } from 'react';
import { api } from '../services/api';

// Hook genérico para páginas de listado + alta + baja sobre un mismo endpoint.
// Pensado para CRUDs simples (Clientes, Presupuestos); páginas con lógica propia
// (cambios de estado, descargas, formularios multi-endpoint) se quedan fuera.
export function useCrud(endpoint) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      setItems(await api.get(endpoint));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [endpoint]);

  async function crear(datos) {
    await api.post(endpoint, datos);
    await cargar();
  }

  async function actualizar(id, datos) {
    await api.put(`${endpoint}/${id}`, datos);
    await cargar();
  }

  async function eliminar(id) {
    await api.delete(`${endpoint}/${id}`);
    await cargar();
  }

  return { items, error, setError, cargando, cargar, crear, actualizar, eliminar };
}
