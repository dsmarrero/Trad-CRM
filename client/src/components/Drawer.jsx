// client/src/components/Drawer.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ abierto, onCerrar, titulo, children }) {
  useEffect(() => {
    if (!abierto) return;
    function handleKey(e) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onCerrar} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="drawer-cabecera">
          <h3>{titulo}</h3>
          <button className="drawer-cerrar" onClick={onCerrar} aria-label="Cerrar panel">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
