'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface StockFundo {
  idmaterial: number;
  idfundo: number;
  stock: number;
  material?: { id: number; descripcion: string; um: string };
  fundo?: { id: number; descripcion: string };
}

interface FundoGroup {
  id: number;
  descripcion: string;
  items: StockFundo[];
  total: number;
}

export default function InventarioPage() {
  const [data, setData]       = useState<StockFundo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchData = () => {
    setLoading(true);
    fetch('/api/stock-fundo')
      .then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setError(''); })
      .catch(() => setError('Error al cargar inventario'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Agrupar por fundo
  const groups: FundoGroup[] = [];
  data.forEach((sf) => {
    const fId = sf.idfundo;
    let g = groups.find((g) => g.id === fId);
    if (!g) {
      g = { id: fId, descripcion: sf.fundo?.descripcion ?? `Fundo #${fId}`, items: [], total: 0 };
      groups.push(g);
    }
    g.items.push(sf);
    g.total += Number(sf.stock);
  });

  const totalGlobal = data.reduce((s, sf) => s + Number(sf.stock), 0);

  const stockColor = (stock: number) => {
    if (stock <= 0)  return 'text-gray-400';
    if (stock < 10)  return 'text-red-600';
    if (stock < 50)  return 'text-amber-600';
    return 'text-emerald-600';
  };

  const badgeColor = (stock: number) => {
    if (stock <= 0)  return 'bg-gray-100 text-gray-500';
    if (stock < 10)  return 'bg-red-50 text-red-700';
    if (stock < 50)  return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<LayoutGrid size={20} />}
        title="Inventario por Ubicación"
        subtitle="Stock actual de materiales en cada ubicación"
        count={data.length}
        action={
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        }
      />

      {/* Resumen global */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total unidades</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalGlobal.toLocaleString('es-PE')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicaciones</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipos de material</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{new Set(data.map((d) => d.idmaterial)).size}</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-2">
          <div className="text-4xl">📊</div>
          <p className="text-sm font-medium text-gray-500">Sin datos de inventario</p>
          <p className="text-xs text-gray-400">Registra ingresos para ver el stock por ubicación</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header fundo */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <LayoutGrid size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{group.descripcion}</p>
                    <p className="text-xs text-gray-400">{group.items.length} material(es)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total unidades</p>
                  <p className="font-bold text-gray-700">{group.total.toLocaleString('es-PE')}</p>
                </div>
              </div>

              {/* Tabla de materiales */}
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {['Material', 'UM', 'Stock', 'Estado'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.items.map((sf) => (
                    <tr key={`${sf.idmaterial}-${sf.idfundo}`} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-700">{sf.material?.descripcion ?? `Material #${sf.idmaterial}`}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{sf.material?.um ?? '—'}</td>
                      <td className={`px-5 py-3 font-bold text-base ${stockColor(sf.stock)}`}>
                        {Number(sf.stock).toLocaleString('es-PE')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor(sf.stock)}`}>
                          {sf.stock <= 0 ? 'Agotado' : sf.stock < 10 ? 'Crítico' : sf.stock < 50 ? 'Bajo' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
