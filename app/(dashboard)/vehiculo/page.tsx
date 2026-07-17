'use client';

import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
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

export default function VehiculoPage() {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/vehiculo')
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => setError('Error al cargar vehículos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((v) =>
    v.placa?.toLowerCase().includes(search.toLowerCase()) ||
    v.marca?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader icon={<Truck size={20} />} title="Vehículos" subtitle="Flota de vehículos registrada" count={filtered.length} />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por placa o marca..." />
          <span className="text-xs text-gray-400 hidden sm:block">{filtered.length} vehículo{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
