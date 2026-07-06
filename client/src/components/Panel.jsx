import Sidebar from './Sidebar';

export default function Panel({ children }) {
  return (
    <div className="panel-layout">
      <Sidebar />
      <main className="panel-contenido">{children}</main>
    </div>
  );
}
