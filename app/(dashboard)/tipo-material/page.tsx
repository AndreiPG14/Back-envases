'use client';

import { useEffect, useState } from 'react';
import { Layers, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';

interface Tipo { id: number; descripcion: string; created_at: string; }

export default function TipoMaterialPage() {
  const [data, setData]           = useState<Tipo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState<Tipo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/tipo-material').then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setError(''); })
      .catch(() => setError('Error al cargar tipos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este tipo?')) return;
    setDeleting(id);
    const res = await fetch(`/api/tipo-material/${id}`, { method: 'DELETE' }).then((r) => r.json());
    setDeleting(null);
    if (res.success) fetchData();
    else setError(res.error ?? 'Error al eliminar');
  };

  const filtered = data.filter((t) => t.descripcion.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Layers size={20} />}
        title="Tipos de Material"
        subtitle="Catálogo de tipos — se asignan al crear o editar un material"
        count={filtered.length}
        action={
          <button
            onClick={() => { setSelected(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo tipo
          </button>
        }
      />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar tipo..." />
          <span className="text-xs text-gray-400 hidden sm:block">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="text-3xl">🗂️</div>
            <p className="text-sm font-medium text-gray-500">Sin tipos registrados</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['ID', 'Descripción', 'Creado', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{t.id}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-medium text-gray-700">{t.descripcion}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {new Date(t.created_at).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(t); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                        {deleting === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
        <ModalTipo
          tipo={selected}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function ModalTipo({ tipo, onClose, onSaved }: { tipo: Tipo | null; onClose: () => void; onSaved: () => void; }) {
  const isEdit = tipo !== null;
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? '');
  const [saving, setSaving]           = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) { setErrorMsg('La descripción es requerida'); return; }
    setSaving(true); setErrorMsg('');
    const url    = isEdit ? `/api/tipo-material/${tipo!.id}` : '/api/tipo-material';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: descripcion.trim() }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) onSaved();
    else setErrorMsg(res.error ?? 'Error al guardar');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers size={16} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-800">{isEdit ? 'Editar tipo' : 'Nuevo tipo'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Descripción <span className="text-red-400">*</span>
            </label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: BVP, JARRA REDONDA, BABUL..." autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {errorMsg && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{errorMsg}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear tipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
