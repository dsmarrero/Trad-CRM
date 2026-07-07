export default function Skeleton({ variante = 'tabla', filas = 3, columnas = 4 }) {
  if (variante === 'tarjetas') {
    return (
      <div className="tarjetas-resumen">
        {Array.from({ length: filas }).map((_, i) => (
          <div className="tarjeta" key={i}>
            <span className="skeleton-bloque" style={{ width: '50%', height: '1.6rem' }} />
            <span className="skeleton-bloque" style={{ width: '80%' }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <table className="skeleton-tabla">
      <tbody>
        {Array.from({ length: filas }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: columnas }).map((_, j) => (
              <td key={j}><span className="skeleton-bloque" /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
