import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
