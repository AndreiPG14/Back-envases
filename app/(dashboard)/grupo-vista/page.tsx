'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, X, Loader2, Pencil, Inbox, Check } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const VISTAS_DISPONIBLES = [
  { grupo: 'Maestros', items: [
    { key: 'tipo-material', label: 'Tipos de Material' },
    { key: 'materiales',    label: 'Materiales' },
    { key: 'vehiculo',      label: 'Vehículos' },
    { key: 'fundo',         label: 'Ubicaciones' },
    { key: 'empresa',       label: 'Empresas' },
    { key: 'operacion',     label: 'Operaciones' },
    { key: 'roles',         label: 'Roles' },
    { key: 'usuario',       label: 'Usuarios' },
    { key: 'grupo-vista',   label: 'Agrupador de Vistas' },
  ]},
  { grupo: 'Transacciones', items: [
    { key: 'ingreso',       label: 'Ingresos' },
    { key: 'movimiento',    label: 'Movimientos' },
    { key: 'transito',      label: 'Tránsito' },
    { key: 'merma-salidas', label: 'Salidas' },
  ]},
  { grupo: 'Inventario', items: [
    { key: 'inventario',    label: 'Stock por Ubicación' },
  ]},
];

interface GrupoVista {
  id: number;
  descripcion: string;
  vistas: string[];
  created_at: string;
}

export default function GrupoVistaPage() {
  const [data, setData]       = useState<GrupoVista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editGrupo, setEditGrupo]       = useState<GrupoVista | null>(null);
  const [deleting, setDeleting]         = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/grupo-vista')
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        setData(res.data ?? []);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este grupo de vistas?')) return;
    setDeleting(id);
    const res = await fetch(`/api/grupo-vista/${id}`, { method: 'DELETE' }).then((r) => r.json());
    setDeleting(null);
    if (!res.success) { setError(res.error); return; }
    fetchData();
  };

  const vistaLabel = (key: string) => {
    for (const g of VISTAS_DISPONIBLES)
      for (const v of g.items)
        if (v.key === key) return v.label;
    return key;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<FolderOpen size={20} />}
        title="Agrupador de Vistas"
        subtitle="Grupos de acceso a menús"
        count={data.length}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo grupo
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
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><Inbox size={22} /></div>
            <p className="text-sm font-medium text-gray-500">Sin grupos registrados</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['ID', 'Descripción', 'Vistas asignadas', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((g) => (
                <tr key={g.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{g.id}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-700">{g.descripcion}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {(g.vistas ?? []).map((v) => (
                        <span key={v} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {vistaLabel(v)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditGrupo(g)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={deleting === g.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === g.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showModal || editGrupo) && (
        <ModalGrupoVista
          grupo={editGrupo}
          onClose={() => { setShowModal(false); setEditGrupo(null); }}
          onSaved={() => { setShowModal(false); setEditGrupo(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function ModalGrupoVista({
  grupo, onClose, onSaved,
}: {
  grupo: GrupoVista | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!grupo;
  const [descripcion, setDescripcion] = useState(grupo?.descripcion ?? '');
  const [vistas, setVistas]           = useState<string[]>(grupo?.vistas ?? []);
  const [saving, setSaving]           = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  const toggleVista = (key: string) => {
    setVistas((prev) => prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]);
  };

  const selectAll = () => {
    const todas = VISTAS_DISPONIBLES.flatMap((g) => g.items.map((v) => v.key));
    setVistas(todas);
  };

  const deselectAll = () => setVistas([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) { setErrorMsg('La descripción es requerida'); return; }
    if (vistas.length === 0)  { setErrorMsg('Selecciona al menos una vista'); return; }

    setSaving(true);
    setErrorMsg('');

    const url    = isEdit ? `/api/grupo-vista/${grupo!.id}` : '/api/grupo-vista';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: descripcion.trim(), vistas }),
    }).then((r) => r.json());

    setSaving(false);
    if (res.success) onSaved();
    else setErrorMsg(res.error ?? 'Error al guardar');
  };

  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2';
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FolderOpen size={16} className="text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-800">{isEdit ? 'Editar grupo' : 'Nuevo grupo de vistas'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Descripción <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Administrador, Operador campo..."
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>Vistas <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-emerald-600 hover:underline">Todas</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={deselectAll} className="text-xs text-gray-500 hover:underline">Ninguna</button>
              </div>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {VISTAS_DISPONIBLES.map((seccion) => (
                <div key={seccion.grupo}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{seccion.grupo}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {seccion.items.map((v) => {
                      const checked = vistas.includes(v.key);
                      return (
                        <label
                          key={v.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                            checked ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                          }`}>
                            {checked && <Check size={10} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVista(v.key)}
                            className="sr-only"
                          />
                          {v.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{vistas.length} vista(s) seleccionada(s)</p>
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
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
