import { useEffect, useState } from 'react';
import { api } from '../services/api';

const VACIO = { encargo_id: '', importe: '' };

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [encargos, setEncargos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      const [dataFacturas, dataEncargos] = await Promise.all([
        api.get('/facturas'),
        api.get('/encargos')
      ]);
      setFacturas(dataFacturas);
      setEncargos(dataEncargos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/facturas', form);
      setForm(VACIO);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVerPdf(id) {
    try {
      const blob = await api.descargarArchivo(`/facturas/${id}/pdf`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarcarPagada(id) {
    try {
      await api.patch(`/facturas/${id}/pagar`, {});
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar esta factura?')) return;
    try {
      await api.delete(`/facturas/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEnviarRecordatorio(id) {
    if (!confirm('¿Enviar un recordatorio de pago por email a este cliente?')) return;
    try {
      await api.post(`/facturas/${id}/recordatorio`, {});
      alert('Recordatorio enviado');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExportarCSV() {
    try {
      const blob = await api.descargarArchivo('/facturas/exportar');
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'facturas.csv';
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina-facturas">
      <div className="cabecera-pagina">
        <h2>Facturas</h2>
        <button onClick={handleExportarCSV}>Exportar CSV</button>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit} className="form-factura">
        <select name="encargo_id" aria-label="Encargo" value={form.encargo_id} onChange={handleChange} required>
          <option value="">Selecciona encargo *</option>
          {encargos.map((e) => (
            <option key={e.id} value={e.id}>
              #{e.id} - {e.cliente_nombre} ({e.idioma_origen}→{e.idioma_destino})
            </option>
          ))}
        </select>
        <input name="importe" aria-label="Importe en euros" type="number" step="0.01" placeholder="Importe (€) *" value={form.importe} onChange={handleChange} required />
        <button type="submit">Crear factura</button>
      </form>

      {cargando ? <p>Cargando...</p> : (
      <table>
        <thead>
          <tr>
            <th>Nº</th><th>Cliente</th><th>Importe</th><th>Estado</th><th>Emisión</th><th></th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((f) => (
            <tr key={f.id}>
              <td>{f.numero}</td>
              <td>{f.cliente_nombre}</td>
              <td>{f.importe} €</td>
              <td>
                <span className={f.estado_pago === 'pagada' ? 'badge-ok' : 'badge-pendiente'}>
                  {f.estado_pago}
                </span>
              </td>
              <td>{new Date(f.fecha_emision).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleVerPdf(f.id)}>Ver PDF</button>
                {f.estado_pago !== 'pagada' && (
                  <>
                    <button onClick={() => handleMarcarPagada(f.id)}>Marcar pagada</button>
                    <button onClick={() => handleEnviarRecordatorio(f.id)}>Recordar pago</button>
                  </>
                )}
                <button onClick={() => handleEliminar(f.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
