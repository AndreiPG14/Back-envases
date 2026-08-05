'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LayoutGrid, Loader2, RefreshCw, Search, X, FileSpreadsheet,
  TrendingDown, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

type Estado = 'todos' | 'normal' | 'bajo' | 'critico' | 'agotado';

function getEstado(stock: number): Estado {
  if (stock <= 0)  return 'agotado';
  if (stock < 10)  return 'critico';
  if (stock < 50)  return 'bajo';
  return 'normal';
}

const ESTADO_LABEL: Record<Estado, string> = {
  todos: 'Todos',
  normal: 'Normal',
  bajo: 'Bajo',
  critico: 'Crítico',
  agotado: 'Agotado',
};

const ESTADO_BADGE: Record<string, string> = {
  normal:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  bajo:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  critico: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  agotado: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

const ESTADO_TEXT: Record<string, string> = {
  normal:  'text-emerald-600',
  bajo:    'text-amber-600',
  critico: 'text-red-600',
  agotado: 'text-gray-400',
};

export default function InventarioPage() {
  const [data, setData]         = useState<StockFundo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [query, setQuery]       = useState('');
  const [filtroEstado, setFiltroEstado] = useState<Estado>('todos');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const exportExcel = () => {
    const rows: object[] = [];

    // Agrupar todos los datos sin filtro para exportar completo
    const map = new Map<number, FundoGroup>();
    data.forEach((sf) => {
      const fId = sf.idfundo;
      if (!map.has(fId)) {
        map.set(fId, {
          id: fId,
          descripcion: sf.fundo?.descripcion ?? `Fundo #${fId}`,
          items: [],
          total: 0,
        });
      }
      const g = map.get(fId)!;
      g.items.push(sf);
      g.total += Number(sf.stock);
    });

    Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .forEach((g) => {
        g.items
          .slice()
          .sort((a, b) => Number(b.stock) - Number(a.stock))
          .forEach((sf) => {
            const estado = getEstado(sf.stock);
            rows.push({
              Ubicación:  g.descripcion,
              Material:   sf.material?.descripcion ?? `Material #${sf.idmaterial}`,
              UM:         sf.material?.um ?? '',
              Stock:      Number(sf.stock),
              Estado:     ESTADO_LABEL[estado],
            });
          });
      });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 22 }, // Ubicación
      { wch: 32 }, // Material
      { wch: 8  }, // UM
      { wch: 12 }, // Stock
      { wch: 10 }, // Estado
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock por Ubicación');

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `stock_ubicacion_${fecha}.xlsx`);
  };

  const fetchData = () => {
    setLoading(true);
    fetch('/api/stock-fundo')
      .then((r) => r.json())
      .then((res) => { setData(res.data ?? []); setError(''); })
      .catch(() => setError('Error al cargar inventario'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ── Agrupar y filtrar ────────────────────────────────────────────
  const groups: FundoGroup[] = useMemo(() => {
    const q = query.toLowerCase();
    const map = new Map<number, FundoGroup>();

    data.forEach((sf) => {
      const fId = sf.idfundo;
      if (!map.has(fId)) {
        map.set(fId, {
          id: fId,
          descripcion: sf.fundo?.descripcion ?? `Fundo #${fId}`,
          items: [],
          total: 0,
        });
      }
      const g = map.get(fId)!;
      g.items.push(sf);
      g.total += Number(sf.stock);
    });

    return Array.from(map.values())
      .map((g) => ({
        ...g,
        items: g.items.filter((sf) => {
          const matchQ =
            !q ||
            sf.material?.descripcion.toLowerCase().includes(q) ||
            g.descripcion.toLowerCase().includes(q);
          const matchE =
            filtroEstado === 'todos' || getEstado(sf.stock) === filtroEstado;
          return matchQ && matchE;
        }),
      }))
      .filter((g) => g.items.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [data, query, filtroEstado]);

  // ── Totales para chips ────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { normal: 0, bajo: 0, critico: 0, agotado: 0, total: data.length };
    data.forEach((sf) => { const e = getEstado(sf.stock); c[e] = (c[e] ?? 0) + 1; });
    return c;
  }, [data]);

  const totalUnidades = data.reduce((s, sf) => s + Number(sf.stock), 0);

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<LayoutGrid size={20} />}
        title="Stock por Ubicación"
        subtitle="Reporte de stock actual agrupado por fundo"
        count={data.length}
        action={
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />
              Exportar Excel
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        }
      />

      {/* ── Resumen global ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        <SummaryCard
          label="Total unidades"
          value={totalUnidades.toLocaleString('es-PE')}
          sub={`${new Set(data.map((d) => d.idmaterial)).size} materiales`}
          color="emerald"
        />
        <SummaryCard
          label="Ubicaciones"
          value={String(new Set(data.map((d) => d.idfundo)).size)}
          sub="fundos con stock"
          color="blue"
        />
        <SummaryCard
          label="Stock bajo / crítico"
          value={String(counts.bajo + counts.critico)}
          sub="requieren atención"
          color="amber"
          icon={<AlertTriangle size={14} />}
        />
        <SummaryCard
          label="Agotados"
          value={String(counts.agotado)}
          sub="sin stock"
          color="red"
          icon={<TrendingDown size={14} />}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar material o ubicación…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro por estado */}
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'normal', 'bajo', 'critico', 'agotado'] as Estado[]).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filtroEstado === e
                  ? 'bg-slate-800 text-white shadow'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {ESTADO_LABEL[e]}
              {e !== 'todos' && counts[e] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[e]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-2">
          <CheckCircle size={36} className="text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Sin resultados</p>
          <p className="text-xs text-gray-400">
            {query || filtroEstado !== 'todos'
              ? 'Prueba con otros filtros'
              : 'Registra ingresos para ver el stock'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.id);
            const groupTotal  = group.items.reduce((s, i) => s + Number(i.stock), 0);

            return (
              <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:break-inside-avoid">
                {/* Header fundo */}
                <button
                  onClick={() => toggleCollapse(group.id)}
                  className="print:hidden w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-gray-100 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                      <LayoutGrid size={14} className="text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">{group.descripcion}</p>
                      <p className="text-xs text-gray-400">{group.items.length} material(es)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="font-bold text-gray-700">{groupTotal.toLocaleString('es-PE')}</p>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={16} className="text-gray-400" />
                      : <ChevronUp size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Tabla */}
                {!isCollapsed && (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Material</th>
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">UM</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.items
                        .slice()
                        .sort((a, b) => Number(b.stock) - Number(a.stock))
                        .map((sf) => {
                          const estado = getEstado(sf.stock);
                          return (
                            <tr
                              key={`${sf.idmaterial}-${sf.idfundo}`}
                              className="hover:bg-emerald-50/30 transition-colors"
                            >
                              <td className="px-5 py-3 font-medium text-gray-700">
                                {sf.material?.descripcion ?? `Material #${sf.idmaterial}`}
                              </td>
                              <td className="px-5 py-3 text-gray-400 text-xs">
                                {sf.material?.um ?? '—'}
                              </td>
                              <td className={`px-5 py-3 text-right font-bold text-base ${ESTADO_TEXT[estado]}`}>
                                {Number(sf.stock).toLocaleString('es-PE')}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[estado]}`}>
                                  {ESTADO_LABEL[estado]}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ── Componente auxiliar ──────────────────────────────────────────────

function SummaryCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub: string; color: string; icon?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue:    'text-blue-600 bg-blue-50',
    amber:   'text-amber-600 bg-amber-50',
    red:     'text-red-600 bg-red-50',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon && (
          <span className={`p-1 rounded-md ${colors[color]}`}>{icon}</span>
        )}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold mt-1 ${colors[color].split(' ')[0]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
