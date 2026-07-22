'use client';

import { useEffect, useRef, useState } from 'react';
import { PackagePlus, Plus, X, Loader2, Calendar, ChevronDown } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Material { id: number; descripcion: string; um: string }
interface Fundo    { id: number; descripcion: string }
interface Usuario  { id: number; username: string }
interface Ingreso  {
  id: number;
  idmaterial: number;
  idfundo: number;
  cantidad: number;
  fecha: string;
  observaciones: string | null;
  material?: Material;
  fundo?: Fundo;
}

export default function IngresoPage() {
  const [data, setData]         = useState<Ingreso[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/ingreso')
      .then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setError(''); })
      .catch(() => setError('Error al cargar ingresos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (fechaStr: string) => {
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<PackagePlus size={20} />}
        title="Ingresos"
        subtitle="Registro de nuevos materiales al sistema"
        count={data.length}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo ingreso
          </button>
        }
      />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="text-3xl">📦</div>
            <p className="text-sm font-medium text-gray-500">Sin ingresos registrados</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['#', 'Fecha', 'Material', 'Ubicación destino', 'Cantidad', 'Observaciones'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((ing) => (
                <tr key={ing.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{ing.id}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-300" />
                      {fmt(ing.fecha)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-700">{ing.material?.descripcion ?? '—'}</p>
                    <p className="text-xs text-gray-400">{ing.material?.um}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {ing.fundo?.descripcion ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-600">
                    +{Number(ing.cantidad).toLocaleString('es-PE')}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs max-w-[200px] truncate">
                    {ing.observaciones ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ModalIngreso
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function ModalIngreso({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [fundos, setFundos]         = useState<Fundo[]>([]);
  const [saving, setSaving]         = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [idusuario, setIdusuario]   = useState<number | null>(null);
  const [now, setNow]               = useState(new Date());

  const [idmaterial, setIdmaterial]     = useState('');
  const [idfundo, setIdfundo]           = useState('');
  const [cantidad, setCantidad]         = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Reloj en vivo
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtLocal = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/materiales').then((r) => r.json()),
      fetch('/api/fundo').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ]).then(([mRes, fRes, meRes]) => {
      setMateriales(mRes.data ?? []);
      const fundoList: Fundo[] = fRes.data ?? [];
      setFundos(fundoList);
      const almacen = fundoList.find((f) => f.descripcion.toUpperCase().includes('ALMACEN'));
      if (almacen) setIdfundo(String(almacen.id));
      if (meRes.user?.id) setIdusuario(meRes.user.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idmaterial) { setErrorMsg('Selecciona un material'); return; }
    if (!idfundo)    { setErrorMsg('Selecciona la ubicación destino'); return; }
    if (!cantidad || Number(cantidad) <= 0) { setErrorMsg('Ingresa una cantidad válida'); return; }

    setSaving(true);
    setErrorMsg('');

    const res = await fetch('/api/ingreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idmaterial: Number(idmaterial),
        idfundo: Number(idfundo),
        idusuario: idusuario,
        cantidad: Number(cantidad),
        fecha: fmtLocal(new Date()),
        observaciones: observaciones.trim() || null,
      }),
    }).then((r) => r.json());

    setSaving(false);
    if (res.success) onSaved();
    else setErrorMsg(res.error ?? 'Error al registrar ingreso');
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <PackagePlus size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Nuevo ingreso de material</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Material */}
          <div>
            <label className={labelCls}>Material <span className="text-red-400">*</span></label>
            <div className="relative">
              <select value={idmaterial} onChange={(e) => setIdmaterial(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Seleccionar material...</option>
                {materiales.map((m) => (
                  <option key={m.id} value={m.id}>{m.descripcion} ({m.um})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Fundo destino */}
          <div>
            <label className={labelCls}>Ubicación destino <span className="text-red-400">*</span></label>
            <div className="relative">
              <select value={idfundo} onChange={(e) => setIdfundo(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Seleccionar ubicación...</option>
                {fundos.map((f) => (
                  <option key={f.id} value={f.id}>{f.descripcion}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>


          {/* Cantidad */}
          <div>
            <label className={labelCls}>Cantidad <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Reloj en vivo */}
          <div>
            <label className={labelCls}>Fecha y hora de registro</label>
            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
              <span className="text-lg font-mono font-bold text-gray-800 tabular-nums tracking-widest">
                {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}
                <span className="text-emerald-500">:{String(now.getSeconds()).padStart(2,'0')}</span>
              </span>
              <span className="text-xs text-gray-400">
                {now.toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })}
              </span>
              <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">EN VIVO</span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
              className={inputCls + ' resize-none'}
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{errorMsg}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Registrando...' : 'Registrar ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
