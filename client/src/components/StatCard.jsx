import { Link } from 'react-router-dom';

export default function StatCard({ valor, label, alerta = false, to }) {
  const clase = 'tarjeta' + (alerta ? ' tarjeta-alerta' : '');
  const contenido = (
    <>
      <span className="tarjeta-valor">{valor}</span>
      <span className="tarjeta-label">{label}</span>
    </>
  );
  return to ? <Link to={to} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>;
}
