'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';

const columns = [
  { key: 'id',    label: 'ID' },
  { key: 'fecha', label: 'Fecha', render: (v: any) => v
    ? <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    : '—'
  },
  { key: 'operacion', label: 'Tipo', render: (_: any, row: any) => {
    const tipo = row.operacion?.descripcion?.toUpperCase();
    return tipo === 'INGRESO'
      ? <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full"><TrendingUp size={11} />Ingreso</span>
      : <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full"><TrendingDown size={11} />Salida</span>;
  }},
  { key: 'material',      label: 'Material',  render: (_: any, row: any) => <span className="font-medium text-gray-700">{row.material?.descripcion ?? '—'}</span> },
  { key: 'cantidad',      label: 'Cantidad',  render: (v: any) => <span className="font-semibold">{v}</span> },
  { key: 'fundo_origen',  label: 'Origen',    render: (_: any, row: any) => row.fundo_origen?.descripcion ?? '—' },
  { key: 'fundo_destino', label: 'Destino',   render: (_: any, row: any) => row.fundo_destino?.descripcion ?? '—' },
  { key: 'vehiculo',      label: 'Vehículo',  render: (_: any, row: any) => row.vehiculo?.placa
    ? <span className="font-mono text-xs bg-slate-800 text-white px-2 py-0.5 rounded">{row.vehiculo.placa}</span>
    : <span className="text-gray-300">—</span>
  },
];

export default function MovimientoPage() {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/movimiento')
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => setError('Error al cargar movimientos'))
      .finally(() => setLoading(false));
  }, []);

  const ingresos = data.filter((m) => m.operacion?.descripcion?.toUpperCase() === 'INGRESO').length;
  const salidas  = data.length - ingresos;

  return (
    <div className="space-y-5">
      <PageHeader icon={<ArrowLeftRight size={20} />} title="Movimientos" subtitle="Historial de movimientos de inventario" count={data.length} />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-slate-700">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs mt-0.5 opacity-75">Total movimientos</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-emerald-700">
          <p className="text-2xl font-bold">{ingresos}</p>
          <p className="text-xs mt-0.5 opacity-75">Ingresos</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-red-600">
          <p className="text-2xl font-bold">{salidas}</p>
          <p className="text-xs mt-0.5 opacity-75">Salidas</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}
