const MAPA_BADGE_ESTADO = {
  recibido:  'badge-pendiente',
  en_curso:  'badge-en-curso',
  entregado: 'badge-ok',
  facturado: 'badge-ok',
};

export function badgeEstado(estado) {
  return MAPA_BADGE_ESTADO[estado] || 'badge-tipo';
}
