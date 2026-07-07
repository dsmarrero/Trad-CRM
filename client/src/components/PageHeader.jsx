export default function PageHeader({ titulo, descripcion, accion }) {
  return (
    <div className="cabecera-pagina">
      <div>
        <h2>{titulo}</h2>
        {descripcion && <p className="page-header-descripcion">{descripcion}</p>}
      </div>
      {accion && <div className="page-header-accion">{accion}</div>}
    </div>
  );
}
