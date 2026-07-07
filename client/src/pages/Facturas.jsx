import { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { api } from '../services/api';
import { useFiltroTexto } from '../hooks/useFiltroTexto';
import Drawer from '../components/Drawer';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import SearchInput from '../components/SearchInput';
import Skeleton from '../components/Skeleton';

const VACIO = {
  encargo_id: '', importe: '', tipo_impuesto: 'exento', porcentaje_impuesto: '',
  aplica_retencion_irpf: false, porcentaje_retencion_irpf: ''
};
const PORCENTAJES_SUGERIDOS = { iva: 21, igic: 7 };
const PORCENTAJE_RETENCION_SUGERIDO = 15;

// Palabras del/de los documento(s) original(es) vigentes de un encargo, multiplicadas por la
// tarifa configurada para su par de idiomas (con tarifa mínima si aplica). Se usa tanto para
// la sugerencia en vivo al elegir un encargo como para el texto de ayuda bajo el campo.
function calcularBaseImponible(documentos, parIdiomas) {
  const palabras = documentos
    .filter((d) => d.tipo === 'original' && d.palabras != null
      && !documentos.some((otro) => otro.reemplaza_a === d.id))
    .reduce((suma, d) => suma + d.palabras, 0);

  const tarifa = parIdiomas ? Number(parIdiomas.tarifa_traduccion) : NaN;
  if (!parIdiomas || palabras <= 0 || !Number.isFinite(tarifa)) {
    return { base: null, detalle: '' };
  }
  const aplicaMinima = parIdiomas.palabras_minimas && palabras <= Number(parIdiomas.palabras_minimas);
  const base = aplicaMinima
    ? Math.max(palabras * tarifa, Number(parIdiomas.tarifa_minima))
    : palabras * tarifa;
  const detalle = aplicaMinima
    ? `${palabras} palabras (tarifa mínima aplicada)`
    : `${palabras} palabras × ${tarifa} €/palabra`;
  return { base, detalle };
}

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [encargos, setEncargos] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [documentosEncargo, setDocumentosEncargo] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [idiomaPdf, setIdiomaPdf] = useState({});

  const facturasFiltradas = useFiltroTexto(facturas, busqueda, ['numero', 'cliente_nombre']);

  async function cargar() {
    try {
      const [dataFacturas, dataEncargos, dataIdiomas] = await Promise.all([
        api.get('/facturas'),
        api.get('/encargos'),
        api.get('/idiomas')
      ]);
      setFacturas(dataFacturas);
      setEncargos(dataEncargos);
      setIdiomas(dataIdiomas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function buscarParIdiomas(encargoId) {
    const encargo = encargos.find((e) => String(e.id) === String(encargoId));
    return encargo && idiomas.find(
      (i) => i.idioma_origen === encargo.idioma_origen && i.idioma_destino === encargo.idioma_destino
    );
  }

  const parIdiomas = buscarParIdiomas(form.encargo_id);
  const { base: baseCalculada, detalle: detalleCalculo } = calcularBaseImponible(documentosEncargo, parIdiomas);

  // Cambiar de encargo sugiere la base imponible automáticamente. Al editar una factura ya
  // existente, `handleEditar` carga el importe real guardado sin pasar por aquí, para no
  // sobrescribirlo con una sugerencia hasta que el usuario cambie el encargo a propósito.
  async function handleChangeEncargo(e) {
    const id = e.target.value;
    setForm((f) => ({ ...f, encargo_id: id, importe: '' }));
    if (!id) { setDocumentosEncargo([]); return; }
    try {
      const docs = await api.get(`/documentos/encargo/${id}`);
      setDocumentosEncargo(docs);
      const { base } = calcularBaseImponible(docs, buscarParIdiomas(id));
      if (base != null) {
        setForm((f) => ({ ...f, importe: base.toFixed(2) }));
      }
    } catch {
      setDocumentosEncargo([]);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleChangeTipoImpuesto(e) {
    const tipo = e.target.value;
    setForm({
      ...form,
      tipo_impuesto: tipo,
      porcentaje_impuesto: tipo === 'exento' ? '' : (PORCENTAJES_SUGERIDOS[tipo] ?? '')
    });
  }

  function handleToggleRetencion(e) {
    const activa = e.target.checked;
    setForm({
      ...form,
      aplica_retencion_irpf: activa,
      porcentaje_retencion_irpf: activa ? PORCENTAJE_RETENCION_SUGERIDO : ''
    });
  }

  function handleNuevo() {
    setForm(VACIO);
    setEditandoId(null);
    setDocumentosEncargo([]);
    setDrawerAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        porcentaje_impuesto: form.tipo_impuesto === 'exento' ? 0 : form.porcentaje_impuesto,
        porcentaje_retencion_irpf: form.aplica_retencion_irpf ? form.porcentaje_retencion_irpf : 0
      };
      if (editandoId) {
        await api.put(`/facturas/${editandoId}`, payload);
      } else {
        await api.post('/facturas', payload);
      }
      setForm(VACIO);
      setEditandoId(null);
      setDocumentosEncargo([]);
      setDrawerAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditar(factura) {
    setForm({
      encargo_id: String(factura.encargo_id),
      importe: factura.importe,
      tipo_impuesto: factura.tipo_impuesto,
      porcentaje_impuesto: factura.tipo_impuesto === 'exento' ? '' : factura.porcentaje_impuesto,
      aplica_retencion_irpf: factura.aplica_retencion_irpf,
      porcentaje_retencion_irpf: factura.aplica_retencion_irpf ? factura.porcentaje_retencion_irpf : ''
    });
    setEditandoId(factura.id);
    setDrawerAbierto(true);
    try {
      const docs = await api.get(`/documentos/encargo/${factura.encargo_id}`);
      setDocumentosEncargo(docs);
    } catch {
      setDocumentosEncargo([]);
    }
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setForm(VACIO);
    setEditandoId(null);
    setDocumentosEncargo([]);
  }

  function idiomaPdfDe(id) {
    return idiomaPdf[id] || 'es';
  }

  async function handleVerPdf(id) {
    try {
      const blob = await api.descargarArchivo(`/facturas/${id}/pdf?idioma=${idiomaPdfDe(id)}`);
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
      <PageHeader
        titulo="Facturas"
        accion={<>
          <Button variante="secundario" onClick={handleExportarCSV}>Exportar CSV</Button>
          <Button variante="primario" onClick={handleNuevo}><Plus size={16} /> Nueva factura</Button>
        </>}
      />
      {error && <div className="error-msg">{error}</div>}

      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por número o cliente..." />

      {cargando ? <Skeleton columnas={9} /> : facturasFiltradas.length === 0 ? (
        <EmptyState
          icono={Receipt}
          texto={busqueda ? 'Ninguna factura coincide con la búsqueda.' : 'Todavía no tienes facturas. Crea la primera.'}
          accion={!busqueda && <Button variante="secundario" onClick={handleNuevo}>Crear factura</Button>}
        />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Nº</th><th>Cliente</th><th>Base</th><th>Impuesto</th><th>Retención</th><th>Total</th><th>Estado</th><th>Emisión</th><th></th>
          </tr>
        </thead>
        <tbody>
          {facturasFiltradas.map((f) => {
            const base = Number(f.importe);
            const porcentaje = Number(f.porcentaje_impuesto) || 0;
            const porcentajeRetencion = Number(f.porcentaje_retencion_irpf) || 0;
            const importeRetencion = f.aplica_retencion_irpf ? base * (porcentajeRetencion / 100) : 0;
            const total = base * (1 + porcentaje / 100) - importeRetencion;
            return (
            <tr key={f.id}>
              <td>{f.numero}</td>
              <td>{f.cliente_nombre}</td>
              <td>{base.toFixed(2)} €</td>
              <td>{f.tipo_impuesto === 'exento' ? 'Exento' : `${f.tipo_impuesto.toUpperCase()} ${porcentaje}%`}</td>
              <td>{f.aplica_retencion_irpf ? `-${porcentajeRetencion}%` : '-'}</td>
              <td>{total.toFixed(2)} €</td>
              <td>
                <span className={f.estado_pago === 'pagada' ? 'badge-ok' : 'badge-pendiente'}>
                  {f.estado_pago}
                </span>
              </td>
              <td>{new Date(f.fecha_emision).toLocaleDateString()}</td>
              <td>
                <select
                  aria-label="Idioma del PDF"
                  value={idiomaPdfDe(f.id)}
                  onChange={(e) => setIdiomaPdf({ ...idiomaPdf, [f.id]: e.target.value })}
                >
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                </select>
                <Button variante="fantasma" onClick={() => handleVerPdf(f.id)}>Ver PDF</Button>
                <Button variante="fantasma" onClick={() => handleEditar(f)}>Editar</Button>
                {f.estado_pago !== 'pagada' && (
                  <>
                    <Button variante="fantasma" onClick={() => handleMarcarPagada(f.id)}>Marcar pagada</Button>
                    <Button variante="fantasma" onClick={() => handleEnviarRecordatorio(f.id)}>Recordar pago</Button>
                  </>
                )}
                <Button variante="fantasma" onClick={() => handleEliminar(f.id)}>Eliminar</Button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      )}

      <Drawer abierto={drawerAbierto} onCerrar={cerrarDrawer} titulo={editandoId ? 'Editar factura' : 'Nueva factura'}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="drawer-body">
          <select name="encargo_id" aria-label="Encargo" value={form.encargo_id} onChange={handleChangeEncargo} required>
            <option value="">Selecciona encargo *</option>
            {encargos.map((e) => (
              <option key={e.id} value={e.id}>
                #{e.id} - {e.cliente_nombre} ({e.idioma_origen}→{e.idioma_destino})
              </option>
            ))}
          </select>
          <input name="importe" aria-label="Base imponible en euros" type="number" step="0.01" placeholder="Base imponible (€) *" value={form.importe} onChange={handleChange} required />
          {form.encargo_id && (
            baseCalculada != null
              ? <span className="ayuda-calculo">Calculado: {detalleCalculo} = {baseCalculada.toFixed(2)} €</span>
              : <span className="ayuda-calculo">Sin cálculo automático (falta documento original con palabras extraídas o tarifa configurada) — introduce la base manualmente</span>
          )}
          <select name="tipo_impuesto" aria-label="Tipo de impuesto" value={form.tipo_impuesto} onChange={handleChangeTipoImpuesto}>
            <option value="exento">Exento</option>
            <option value="iva">IVA</option>
            <option value="igic">IGIC</option>
          </select>
          {form.tipo_impuesto !== 'exento' && (
            <input
              name="porcentaje_impuesto"
              aria-label="Porcentaje de impuesto"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="% impuesto *"
              value={form.porcentaje_impuesto}
              onChange={handleChange}
              required
            />
          )}
          <label className="check-retencion">
            <input type="checkbox" checked={form.aplica_retencion_irpf} onChange={handleToggleRetencion} />
            Retención IRPF
          </label>
          {form.aplica_retencion_irpf && (
            <input
              name="porcentaje_retencion_irpf"
              aria-label="Porcentaje de retención de IRPF"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="% retención *"
              value={form.porcentaje_retencion_irpf}
              onChange={handleChange}
              required
            />
          )}
          <Button type="submit" variante="primario">{editandoId ? 'Guardar cambios' : 'Crear factura'}</Button>
        </form>
      </Drawer>
    </div>
  );
}
