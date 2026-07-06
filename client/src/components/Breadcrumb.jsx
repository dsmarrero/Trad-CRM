// client/src/components/Breadcrumb.jsx
import { Link } from 'react-router-dom';

/**
 * items: Array<{ label: string, to?: string }>
 */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Migas de pan">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span style={{ color: 'var(--texto)', fontWeight: 600 }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
