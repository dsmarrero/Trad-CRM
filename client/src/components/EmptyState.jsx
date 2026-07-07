export default function EmptyState({ icono: Icono, texto, accion }) {
  return (
    <div className="empty-state">
      {Icono && <Icono size={28} className="empty-state-icono" />}
      <p>{texto}</p>
      {accion}
    </div>
  );
}
