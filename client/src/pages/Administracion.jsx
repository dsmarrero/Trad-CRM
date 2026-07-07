import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

const VACIO = { nombre: '', email: '', password: '', rol: 'traductor' };

export default function Administracion() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  async function cargar() {
    try {
      setUsuarios(await api.get('/auth/usuarios'));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  if (usuario?.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNuevo() {
    setForm(VACIO);
    setDrawerAbierto(true);
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/registro', form);
      setDrawerAbierto(false);
      setForm(VACIO);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-administracion">
      <PageHeader
        titulo="Administración"
        descripcion="Cuentas con acceso a este CRM."
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo usuario</Button>}
      />
      {error && <div className="error-msg">{error}</div>}

      {cargando ? <Skeleton columnas={4} /> : usuarios.length === 0 ? (
        <EmptyState icono={ShieldCheck} texto="No hay usuarios registrados." />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Email</th><th>Rol</th><th>Creado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td><span className={u.rol === 'admin' ? 'badge-ok' : 'badge-tipo'}>{u.rol}</span></td>
                <td>{new Date(u.creado_en).toLocaleDateString()}</td>
                <td>
                  {u.id !== usuario.id && (
                    <Button variante="fantasma" onClick={() => handleEliminar(u.id)}>Eliminar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo="Nuevo usuario">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <input name="nombre" aria-label="Nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} required />
          <input name="email" aria-label="Email" type="email" placeholder="Email *" value={form.email} onChange={handleChange} required />
          <input name="password" aria-label="Contraseña" type="password" placeholder="Contraseña *" value={form.password} onChange={handleChange} required />
          <select name="rol" aria-label="Rol" value={form.rol} onChange={handleChange}>
            <option value="traductor">Traductor</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" variante="primario">Crear usuario</Button>
        </form>
      </Drawer>
    </div>
  );
}
