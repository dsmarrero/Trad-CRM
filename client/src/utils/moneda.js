const formateador = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function formatMoneda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return formateador.format(numero);
}
