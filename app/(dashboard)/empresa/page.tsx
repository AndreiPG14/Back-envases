'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';

const columns = [
  { key: 'id',          label: 'ID' },
  { key: 'descripcion', label: 'Descripción' },
];

export default function EmpresaPage() {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/empresa')
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => setError('Error al cargar empresas'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader icon={<Building2 size={20} />} title="Empresas" subtitle="Empresas registradas" count={data.length} />

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}
