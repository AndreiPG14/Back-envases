'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Pencil, Trash2, X, Loader2, ChevronDown } from 'lucide-react';

const UMS = ['und', 'kg', 'ha', 't'];
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';

interface Material {
  id: number;
  descripcion: string;
  cod: string | null;
  um: string | null;
  pu: number | null;
}

export default function MaterialesPage() {
  const [data, setData]           = useState<Material[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState<Material | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/materiales')
      .then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setError(''); })
      .catch(() => setError('Error al cargar materiales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este material?')) return;
    setDeleting(id);
    await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchData();
  };

  const filtered = data.filter((m) =>
    m.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    m.cod?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Package size={20} />}
        title="Materiales"
        subtitle="Catálogo maestro de materiales"
        count={filtered.length}
        action={
          <button
            onClick={() => { setSelected(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo material
          </button>
        }
      />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por descripción o código..." />
          <span className="text-xs text-gray-400 hidden sm:block">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
            <div className="text-3xl">📦</div>
            <p className="text-sm font-medium text-gray-500">Sin materiales registrados</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['ID', 'Código', 'Descripción', 'U.M.', 'Precio Unit.', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{m.id}</td>
                  <td className="px-5 py-3.5">
                    {m.cod
                      ? <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{m.cod}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-700">{m.descripcion}</td>
                  <td className="px-5 py-3.5 text-gray-500">{m.um ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {m.pu != null ? `S/ ${Number(m.pu).toFixed(2)}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelected(m); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ModalMaterial
          material={selected}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function ModalMaterial({
  material,
  onClose,
  onSaved,
}: {
  material: Material | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = material !== null;
  const [form, setForm] = useState({
    descripcion: material?.descripcion ?? '',
    cod:         material?.cod         ?? '',
    um:          material?.um          ?? '',
    pu:          material?.pu != null ? String(material.pu) : '',
  });
  const [saving, setSaving]     = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim()) { setErrorMsg('La descripción es requerida'); return; }

    setSaving(true);
    setErrorMsg('');

    const payload = {
      descripcion: form.descripcion.trim(),
      cod: form.cod.trim()  || null,
      um:  form.um.trim()   || null,
      pu:  form.pu !== '' ? Number(form.pu) : null,
    };

    const url    = isEdit ? `/api/materiales/${material!.id}` : '/api/materiales';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    setSaving(false);
    if (res.success) onSaved();
    else setErrorMsg(res.error ?? 'Error al guardar');
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Package size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-800">{isEdit ? 'Editar material' : 'Nuevo material'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Descripción */}
          <div>
            <label className={labelCls}>Descripción <span className="text-red-400">*</span></label>
            <input type="text" value={form.descripcion} onChange={set('descripcion')}
              placeholder="Ej: Jarras, Cemento..." className={inputCls} />
          </div>

          {/* Código */}
          <div>
            <label className={labelCls}>Código <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input type="text" value={form.cod} onChange={set('cod')}
              placeholder="Ej: MAT-001" className={inputCls} />
          </div>

          {/* Unidad de medida — selector */}
          <div>
            <label className={labelCls}>Unidad de medida</label>
            <div className="flex gap-2">
              {UMS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, um: u }))}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${
                    form.um === u
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Precio unitario */}
          <div>
            <label className={labelCls}>Precio unitario <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input type="number" value={form.pu} onChange={set('pu')}
              placeholder="0.00" min={0} step="0.01" className={inputCls} />
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
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
