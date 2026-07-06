const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let onNoAutorizado = null;
export function registrarManejadorNoAutorizado(fn) {
  onNoAutorizado = fn;
}

async function request(endpoint, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers
  };

  const respuesta = await fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: 'include' });

  if (respuesta.status === 401 || respuesta.status === 403) {
    if (onNoAutorizado) onNoAutorizado();
  }

  const contentType = respuesta.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await respuesta.json() : null;

  if (!respuesta.ok) {
    throw new Error((data && data.error) || 'Error en la petición');
  }
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  descargarArchivo: async (endpoint) => {
    const respuesta = await fetch(`${API_URL}${endpoint}`, { credentials: 'include' });
    if (respuesta.status === 401 || respuesta.status === 403) {
      if (onNoAutorizado) onNoAutorizado();
    }
    if (!respuesta.ok) throw new Error('No se pudo descargar el archivo');
    return respuesta.blob();
  }
};
