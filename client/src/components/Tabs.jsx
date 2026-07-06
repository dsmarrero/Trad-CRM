export default function Tabs({ tabs, activo, onCambiar }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={tab === activo}
          className={'tabs-tab' + (tab === activo ? ' activo' : '')}
          onClick={() => onCambiar(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
