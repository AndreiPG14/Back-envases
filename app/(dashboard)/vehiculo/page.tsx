'use client';

import { useEffect, useState } from 'react';
import { Truck, Plus, X, Loader2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';

const columns = [
  { key: 'id',    label: 'ID' },
  { key: 'placa', label: 'Placa', render: (v: any) => (
    <span className="font-mono font-bold text-xs bg-slate-800 text-white px-2.5 py-1 rounded-md tracking-widest">
      {v}
    </span>
  )},
  { key: 'marca', label: 'Marca', render: (v: any) => (
    <span className="font-medium text-gray-700">{v ?? <span className="text-gray-300">—</span>}</span>
  )},
];

const EMPTY = { placa: '', marca: '' };

export default function VehiculoPage() {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/vehiculo')
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => setError('Error al cargar vehículos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openModal = () => { setForm(EMPTY); setFormErr(''); setModal(true); };
  const closeModal = () => setModal(false);

  const handleSave = async () => {
    if (!form.placa.trim()) { setFormErr('La placa es requerida'); return; }
    setSaving(true);
    setFormErr('');
    try {
      const res = await fetch('/api/vehiculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa: form.placa.toUpperCase(), marca: form.marca || null }),
      });
      const json = await res.json();
      if (!res.ok) { setFormErr(json.error ?? 'Error al guardar'); return; }
      closeModal();
      load();
    } catch {
      setFormErr('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter((v) =>
    v.placa?.toLowerCase().includes(search.toLowerCase()) ||
    v.marca?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader icon={<Truck size={20} />} title="Vehículos" subtitle="Flota de vehículos registrada" count={filtered.length} />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por placa o marca..." />
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            <Plus size={15} /> Nuevo
          </button>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Nuevo vehículo</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Placa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.placa}
                  onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value.toUpperCase() }))}
                  placeholder="ABC-123"
                  maxLength={20}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-400 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Marca
                </label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                  placeholder="Toyota, Volvo..."
                  maxLength={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>

            {formErr && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">
                {formErr}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
