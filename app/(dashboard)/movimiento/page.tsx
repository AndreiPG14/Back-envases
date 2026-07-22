'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, TrendingDown, ChevronDown, ChevronRight, X, CheckCircle2, Clock, AlertTriangle, Pencil, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

// ── Modal detalle ─────────────────────────────────────────────────────────────
function ModalDetalle({ detalle: detalleInicial, mov, onClose, onDetalleUpdated }: {
  detalle: any; mov: any; onClose: () => void; onDetalleUpdated?: (d: any) => void;
}) {
  const [detalle, setDetalle]     = useState(detalleInicial);
  const [editMode, setEditMode]   = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(detalleInicial.estado ?? 'PENDIENTE');
  const [cantConf, setCantConf]   = useState<string>('');
  const [observacion, setObs]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const tipo       = detalle.operacion?.descripcion?.toUpperCase();
  const esTraslado = tipo === 'TRASLADO';
  const estado     = detalle.estado ?? '';
  const confirmada = detalle.cantidad_confirmada;
  const merma      = detalle.merma;
  const um         = detalle.material?.um ?? '';

  const mermaPreview = nuevoEstado === 'COMPLETO'
    ? 0
    : nuevoEstado === 'INCOMPLETO' && cantConf !== ''
      ? Math.max(0, detalle.cantidad - Number(cantConf))
      : null;

  const fmtFecha = (v: string) => v
    ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const fmtHora = (v: string) => v
    ? new Date(v).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';

  const EstadoBadge = ({ e }: { e: string }) => {
    if (e === 'COMPLETO') return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
        <CheckCircle2 size={14} /> Completo
      </span>
    );
    if (e === 'INCOMPLETO') return (
      <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">
        <AlertTriangle size={14} /> Incompleto
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-1 rounded-full">
        <Clock size={14} /> Pendiente
      </span>
    );
  };

  const handleSave = async () => {
    if (!observacion.trim()) { setErr('La observación es requerida'); return; }
    if (nuevoEstado === 'INCOMPLETO' && cantConf === '') { setErr('Ingresa la cantidad confirmada'); return; }
    if (nuevoEstado === 'INCOMPLETO' && Number(cantConf) >= detalle.cantidad) {
      setErr(`La cantidad confirmada debe ser menor a ${detalle.cantidad}`); return;
    }
    setSaving(true); setErr('');
    try {
      const body: any = { estado: nuevoEstado, observaciones: observacion };
      if (nuevoEstado === 'INCOMPLETO') body.cantidad_confirmada = Number(cantConf);
      const res = await fetch(`/api/movimiento_detalle/${detalle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error ?? 'Error al guardar'); return; }
      setDetalle(json.data);
      onDetalleUpdated?.(json.data);
      setEditMode(false);
    } catch { setErr('Error de conexión'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* header */}
        <div className={`px-6 py-4 flex items-center justify-between ${esTraslado ? 'bg-indigo-600' : 'bg-red-500'}`}>
          <div className="flex items-center gap-2 text-white">
            {esTraslado ? <ArrowLeftRight size={18} /> : <TrendingDown size={18} />}
            <span className="font-semibold">{detalle.operacion?.descripcion ?? tipo}</span>
            <span className="opacity-70 text-sm">· #{detalle.id}</span>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <button onClick={() => { setNuevoEstado(detalle.estado ?? 'PENDIENTE'); setCantConf(''); setObs(''); setErr(''); setEditMode(true); }}
                className="text-white/70 hover:text-white transition-colors p-1" title="Editar">
                <Pencil size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado</span>
            <EstadoBadge e={estado} />
          </div>

          <hr className="border-gray-100" />

          {/* info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Material</p>
              <p className="font-semibold text-gray-800">
                {detalle.material?.descripcion ?? '—'}
                {um && <span className="ml-1 text-gray-400 font-normal">{um}</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Registrado</p>
              <p className="font-medium text-gray-700">{fmtFecha(mov.fecha)}</p>
              <p className="text-xs text-gray-400">{fmtHora(detalle.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Ubic. Origen</p>
              <p className="font-medium text-gray-700">{mov.fundo_origen?.descripcion ?? '—'}</p>
            </div>
            {esTraslado && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Ubic. Destino</p>
                <p className="font-medium text-gray-700">{detalle.fundo_destino?.descripcion ?? '—'}</p>
              </div>
            )}
            {mov.vehiculo?.placa && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Vehículo</p>
                <p className="font-mono font-semibold text-gray-800 bg-slate-100 inline-block px-2 py-0.5 rounded">{mov.vehiculo.placa}</p>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* cantidades */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Enviado</p>
              <p className="text-xl font-bold text-gray-800">{detalle.cantidad ?? '—'}</p>
              <p className="text-xs text-gray-400">{um}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 text-center ${estado === 'COMPLETO' || estado === 'INCOMPLETO' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-400 mb-1">Confirmado</p>
              <p className={`text-xl font-bold ${estado === 'COMPLETO' || estado === 'INCOMPLETO' ? 'text-emerald-700' : 'text-gray-300'}`}>
                {confirmada != null ? confirmada : '—'}
              </p>
              <p className="text-xs text-gray-400">{um}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 text-center ${merma != null && merma > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-400 mb-1">Merma</p>
              <p className={`text-xl font-bold ${merma != null && merma > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                {merma != null ? merma : '—'}
              </p>
              <p className="text-xs text-gray-400">{um}</p>
            </div>
          </div>

          {estado !== 'PENDIENTE' && confirmada != null && detalle.cantidad > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Recibido</span>
                <span>{Math.round((confirmada / detalle.cantidad) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (confirmada / detalle.cantidad) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* ── Modo edición ── */}
          {editMode && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cambiar estado</p>

              {/* Selector estado */}
              <div className="flex gap-2">
                {(['PENDIENTE','COMPLETO','INCOMPLETO'] as const).map((e) => (
                  <button key={e} onClick={() => { setNuevoEstado(e); if (e === 'COMPLETO') setCantConf(''); }}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      nuevoEstado === e
                        ? e === 'COMPLETO' ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : e === 'INCOMPLETO' ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-yellow-400 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}>
                    {e === 'PENDIENTE' ? 'Pendiente' : e === 'COMPLETO' ? 'Completo' : 'Incompleto'}
                  </button>
                ))}
              </div>

              {/* Cantidad confirmada — solo si INCOMPLETO */}
              {nuevoEstado === 'INCOMPLETO' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Cantidad recibida <span className="text-gray-400 font-normal">(enviado: {detalle.cantidad} {um})</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={detalle.cantidad - 0.01}
                    step="any"
                    value={cantConf}
                    onChange={(e) => setCantConf(e.target.value)}
                    placeholder={`< ${detalle.cantidad}`}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  {cantConf !== '' && mermaPreview !== null && (
                    <p className="text-xs text-red-500 mt-1">
                      Merma: <strong>{mermaPreview} {um}</strong>
                    </p>
                  )}
                </div>
              )}

              {nuevoEstado === 'COMPLETO' && (
                <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                  Se registrará cantidad confirmada = <strong>{detalle.cantidad} {um}</strong> · merma = 0
                </p>
              )}

              {/* Observación */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Observación <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => setObs(e.target.value)}
                  rows={2}
                  placeholder="Motivo del cambio..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {err && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">{err}</div>}

              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving || !observacion.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {!editMode && (
          <div className="px-6 pb-5">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MovimientoPage() {
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());
  const [selected, setSelected]   = useState<{ detalle: any; mov: any } | null>(null);

  useEffect(() => {
    fetch('/api/movimiento')
      .then((r) => r.json())
      .then((res) => {
        // Filtrar cabeceras huérfanas (sin detalles)
        const all = res.data ?? [];
        setData(all.filter((m: any) => (m.movimiento_detalle?.length ?? 0) > 0));
      })
      .catch(() => setError('Error al cargar movimientos'))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalDetalles = data.reduce((s, m) => s + (m.movimiento_detalle?.length ?? 0), 0);
  const traslados = data.reduce((s, m) => s + (m.movimiento_detalle?.filter((d: any) => d.operacion?.descripcion?.toUpperCase() === 'TRASLADO').length ?? 0), 0);
  const salidas   = data.reduce((s, m) => s + (m.movimiento_detalle?.filter((d: any) => d.operacion?.descripcion?.toUpperCase() === 'SALIDA').length ?? 0), 0);

  const fmtFecha = (v: string) => v
    ? new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima' })
    : '—';

  const fmtHora = (v: string) => v
    ? new Date(v).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' })
    : '—';

  return (
    <div className="space-y-5">
      <PageHeader icon={<ArrowLeftRight size={20} />} title="Movimientos" subtitle="Historial de movimientos de inventario" count={data.length} />

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-slate-700">
          <p className="text-2xl font-bold">{totalDetalles}</p>
          <p className="text-xs mt-0.5 opacity-75">Total detalles</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3.5 text-indigo-700">
          <p className="text-2xl font-bold">{traslados}</p>
          <p className="text-xs mt-0.5 opacity-75">Traslados</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-red-600">
          <p className="text-2xl font-bold">{salidas}</p>
          <p className="text-xs mt-0.5 opacity-75">Salidas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400 text-sm">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <div className="text-3xl">📭</div>
            <p className="text-sm font-medium text-gray-500">Sin movimientos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((mov) => {
              const isOpen = expanded.has(mov.id);
              const detalles: any[] = mov.movimiento_detalle ?? [];
              return (
                <div key={mov.id}>
                  {/* Cabecera */}
                  <button
                    onClick={() => toggleExpand(mov.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {isOpen ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                    <span className="text-xs text-gray-400 w-6 shrink-0">#{mov.id}</span>
                    <span className="text-xs text-gray-500 w-40 shrink-0">{fmtFecha(mov.fecha)}</span>
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {mov.fundo_origen?.descripcion ?? '—'}
                      {mov.vehiculo?.placa && (
                        <span className="ml-2 font-mono text-xs bg-slate-800 text-white px-1.5 py-0.5 rounded">{mov.vehiculo.placa}</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{detalles.length} detalle{detalles.length !== 1 ? 's' : ''}</span>
                  </button>

                  {/* Detalles expandidos */}
                  {isOpen && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {detalles.length === 0 ? (
                        <p className="px-12 py-3 text-xs text-gray-400">Sin detalles</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              {['Hora', 'Tipo', 'Material', 'Cantidad', 'Ubic. Destino', 'Estado'].map((h) => (
                                <th key={h} className="px-5 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detalles.map((d: any) => {
                              const tipo = d.operacion?.descripcion?.toUpperCase();
                              const esTraslado = tipo === 'TRASLADO';
                              return (
                                <tr
                                  key={d.id}
                                  onClick={() => setSelected({ detalle: d, mov })}
                                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                                >
                                  <td className="px-5 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                                    {fmtHora(d.created_at)}
                                  </td>
                                  <td className="px-5 py-2.5">
                                    {esTraslado
                                      ? <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">⇄ Traslado</span>
                                      : <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full"><TrendingDown size={10} /> Salida</span>
                                    }
                                  </td>
                                  <td className="px-5 py-2.5 font-medium text-gray-700">
                                    {d.material?.descripcion ?? '—'}
                                    {d.material?.um && <span className="ml-1 text-xs text-gray-400">{d.material.um}</span>}
                                  </td>
                                  <td className="px-5 py-2.5 font-semibold text-gray-800">{d.cantidad}</td>
                                  <td className="px-5 py-2.5">
                                    {d.fundo_destino?.descripcion
                                      ? <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{d.fundo_destino.descripcion}</span>
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-5 py-2.5">
                                    {d.estado === 'PENDIENTE'
                                      ? <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">Pendiente</span>
                                      : d.estado === 'INCOMPLETO'
                                      ? <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">Incompleto</span>
                                      : <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">Completo</span>
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <ModalDetalle
          detalle={selected.detalle}
          mov={selected.mov}
          onClose={() => setSelected(null)}
          onDetalleUpdated={(updated) => {
            setData((prev) => prev.map((m) => ({
              ...m,
              movimiento_detalle: m.movimiento_detalle?.map((d: any) => d.id === updated.id ? { ...d, ...updated } : d),
            })));
          }}
        />
      )}

    </div>
  );
}
