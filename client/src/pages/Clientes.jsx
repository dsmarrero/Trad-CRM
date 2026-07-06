import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCrud } from '../hooks/useCrud';

const VACIO = { nombre: '', email: '', telefono: '', empresa: '', notas: '' };

export default function Clientes() {
  const { items: clientes, error, setError, cargando, crear, actualizar, eliminar } = useCrud('/clientes');
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      notas: cliente.notas || ''
    });
    setEditandoId(cliente.id);
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await eliminar(id);
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelarEdicion() {
    setForm(VACIO);
    setEditandoId(null);
  }

  return (
    <div className="pagina-clientes">
      <h2>Clientes</h2>
      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit} className="form-cliente">
        <input name="nombre" aria-label="Nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} required />
        <input name="email" aria-label="Email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="telefono" aria-label="Teléfono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
        <input name="empresa" aria-label="Empresa" placeholder="Empresa" value={form.empresa} onChange={handleChange} />
        <input name="notas" aria-label="Notas" placeholder="Notas" value={form.notas} onChange={handleChange} />
        <button type="submit">{editandoId ? 'Guardar cambios' : 'Añadir cliente'}</button>
        {editandoId && <button type="button" onClick={cancelarEdicion}>Cancelar</button>}
      </form>

      {cargando ? <p>Cargando...</p> : (
      <table>
        <thead>
          <tr>
            <th>Nombre</th><th>Email</th><th>Teléfono</th><th>Empresa</th><th></th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.email}</td>
              <td>{c.telefono}</td>
              <td>{c.empresa}</td>
              <td>
                <Link to={`/clientes/${c.id}`}>Ver ficha</Link>{' '}
                <button onClick={() => handleEditar(c)}>Editar</button>
                <button onClick={() => handleEliminar(c.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
