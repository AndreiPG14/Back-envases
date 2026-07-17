'use client';

import { useEffect, useState } from 'react';
import { HardHat } from 'lucide-react';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';

const columns = [
  { key: 'dni', label: 'DNI', render: (v: any) => (
    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{v}</span>
  )},
  { key: 'nombres',          label: 'Nombres', render: (v: any) => <span className="font-medium">{v}</span> },
  { key: 'apellido_paterno', label: 'Ap. Paterno' },
  { key: 'apellido_materno', label: 'Ap. Materno' },
  { key: 'supervisor', label: 'Supervisor', render: (v: any) => v
    ? <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Sí</span>
    : <span className="text-gray-300 text-xs">No</span>
  },
  { key: 'eliminado', label: 'Estado', render: (v: any) => v
    ? <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">Inactivo</span>
    : <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">Activo</span>
  },
];

export default function TrabajadoresPage() {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/trabajadores')
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => setError('Error al cargar trabajadores'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((t) =>
    t.nombres?.toLowerCase().includes(search.toLowerCase()) ||
    t.apellido_paterno?.toLowerCase().includes(search.toLowerCase()) ||
    t.dni?.includes(search)
  );

  const activos  = data.filter((t) => !t.eliminado).length;
  const inactivos = data.length - activos;

  return (
    <div className="space-y-5">
      <PageHeader icon={<HardHat size={20} />} title="Trabajadores" subtitle="Personal sincronizado desde QBIZ" count={filtered.length} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-emerald-700">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs mt-0.5 opacity-75">Total registros</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-blue-700">
          <p className="text-2xl font-bold">{activos}</p>
          <p className="text-xs mt-0.5 opacity-75">Activos</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-red-600">
          <p className="text-2xl font-bold">{inactivos}</p>
          <p className="text-xs mt-0.5 opacity-75">Inactivos</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, apellido o DNI..." />
          <span className="text-xs text-gray-400 hidden sm:block">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
