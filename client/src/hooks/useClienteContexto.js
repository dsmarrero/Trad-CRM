import { useEffect, useState } from 'react';
import { useMatch } from 'react-router-dom';
import { api } from '../services/api';

export function useClienteContexto() {
  const match = useMatch('/clientes/:id');
  const matchSub = useMatch('/clientes/:id/*');
  const clienteId = (match || matchSub)?.params?.id || null;
  const [clienteNombre, setClienteNombre] = useState(null);

  useEffect(() => {
    if (!clienteId) { setClienteNombre(null); return; }
    api.get(`/clientes/${clienteId}`)
      .then((c) => setClienteNombre(c.nombre))
      .catch(() => setClienteNombre(null));
  }, [clienteId]);

  return { clienteId, clienteNombre };
}
