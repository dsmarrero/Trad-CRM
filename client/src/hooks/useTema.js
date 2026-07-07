import { useEffect, useState } from 'react';

const CLAVE = 'cms-tema';

export function obtenerTemaInicial() {
  const guardado = localStorage.getItem(CLAVE);
  if (guardado === 'dark' || guardado === 'light') return guardado;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTema() {
  const [tema, setTema] = useState(obtenerTemaInicial);

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  function alternar() {
    setTema((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return { tema, alternar };
}
