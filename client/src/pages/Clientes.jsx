import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = { nombre: '', email: '', telefono: '', empresa: '', nif: '', direccion: '', notas: '' };

export default function Clientes() {
  const { items: clientes, error, setError, cargando, crear, actualizar, eliminar } = useCrud('/clientes');
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const clientesFiltrados = useFiltroTexto(clientes, busqueda, ['nombre', 'email', 'empresa']);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleNuevo() {
    setForm(VACIO);
    setEditandoId(null);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await actualizar(editandoId, form);
      } else {
        await crear(form);
      }
      setForm(VACIO);
      setEditandoId(null);
      setDrawerAbierto(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditar(cliente) {
    setForm({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      empresa: cliente.empresa || '',
      nif: cliente.nif || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    });
    setEditandoId(cliente.id);
    setDrawerAbierto(true);
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await eliminar(id);
    } catch (err) {
      setError(err.message);
    }
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setEditandoId(null);
  }

  return (
    <div className="pagina-clientes">
      <PageHeader
        titulo="Clientes"
        accion={<Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nuevo cliente</Button>}
      />
      {error && <div className="error-msg">{error}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, email o empresa..." />

      {cargando ? <Skeleton columnas={6} /> : clientesFiltrados.length === 0 ? (
        <EmptyState
          icono={Users}
          texto={busqueda ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no tienes clientes. Añade el primero.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Añadir cliente</Button>}
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Email</th><th>Teléfono</th><th>Empresa</th><th>NIF/CIF</th><th></th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.email}</td>
                <td>{c.telefono}</td>
                <td>{c.empresa}</td>
                <td>{c.nif || <span className="badge-pendiente">falta</span>}</td>
                <td>
                  <Link to={`/clientes/${c.id}`}>Ver ficha</Link>{' '}
                  <Button variante="fantasma" onClick={() => handleEditar(c)}>Editar</Button>
                  <Button variante="fantasma" onClick={() => handleEliminar(c.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo={editandoId ? 'Editar cliente' : 'Nuevo cliente'}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <input name="nombre" aria-label="Nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} required />
          <input name="email" aria-label="Email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="telefono" aria-label="Teléfono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
          <input name="empresa" aria-label="Empresa" placeholder="Empresa" value={form.empresa} onChange={handleChange} />
          <input name="nif" aria-label="NIF o CIF" placeholder="NIF/CIF (para facturar)" value={form.nif} onChange={handleChange} />
          <input name="direccion" aria-label="Dirección fiscal" placeholder="Dirección fiscal *" value={form.direccion} onChange={handleChange} required />
          <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
          <Button type="submit" variante="primario">{editandoId ? 'Guardar cambios' : 'Añadir cliente'}</Button>
        </form>
      </Drawer>
    </div>
  );
}
