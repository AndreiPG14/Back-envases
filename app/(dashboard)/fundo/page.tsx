'use client';

import { useEffect, useState } from 'react';
import { Sprout, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';

interface Empresa { id: number; descripcion: string }
interface Fundo   { id: number; descripcion: string; idempresa: number; empresa: Empresa | null }

export default function FundoPage() {
  const [data, setData]         = useState<Fundo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState<Fundo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/fundo')
      .then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setError(''); })
      .catch(() => setError('Error al cargar ubicaciones'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetch('/api/empresa').then((r) => r.json()).then((res) => setEmpresas(res.data ?? []));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta ubicación?')) return;
    setDeleting(id);
    await fetch(`/api/fundo/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchData();
  };

  const filtered = data.filter((f) =>
    f.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    f.empresa?.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Sprout size={20} />}
        title="Ubicaciones"
        subtitle="Ubicaciones y áreas del sistema"
        count={filtered.length}
        action={
          <button
            onClick={() => { setSelected(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nueva ubicación
          </button>
        }
      />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o empresa..." />
          <span className="text-xs text-gray-400 hidden sm:block">{filtered.length} ubicación{filtered.length !== 1 ? 'es' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
            <div className="text-3xl">🌾</div>
            <p className="text-sm font-medium text-gray-500">Sin ubicaciones registradas</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['ID', 'Descripción', 'Empresa', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{f.id}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-700">{f.descripcion}</td>
                  <td className="px-5 py-3.5">
                    {f.empresa
                      ? <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{f.empresa.descripcion}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelected(f); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deleting === f.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === f.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
        <ModalFundo
          fundo={selected}
          empresas={empresas}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

/* ── Modal crear / editar ── */
function ModalFundo({
  fundo, empresas, onClose, onSaved,
}: {
  fundo: Fundo | null; empresas: Empresa[]; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = fundo !== null;
  const [descripcion, setDescripcion] = useState(fundo?.descripcion ?? '');
  const [idempresa, setIdempresa]     = useState(fundo?.idempresa ? String(fundo.idempresa) : '');
  const [saving, setSaving]           = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) { setErrorMsg('La descripción es requerida'); return; }
    if (!idempresa)          { setErrorMsg('Selecciona una empresa'); return; }

    setSaving(true);
    setErrorMsg('');

    const url    = isEdit ? `/api/fundo/${fundo!.id}` : '/api/fundo';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: descripcion.trim(), idempresa: Number(idempresa) }),
    }).then((r) => r.json());

    setSaving(false);
    if (res.success) onSaved();
    else setErrorMsg(res.error ?? 'Error al guardar');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Sprout size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-800">{isEdit ? 'Editar ubicación' : 'Nueva ubicación'}</h2>
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
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Almacén, Packing, Acopio, Lavadero..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Empresa <span className="text-red-400">*</span>
            </label>
            <select
              value={idempresa}
              onChange={(e) => setIdempresa(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Seleccionar empresa...</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.descripcion}</option>
              ))}
            </select>
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
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear ubicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
