'use client';

import { Loader2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Props {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable({ columns, data, loading, emptyMessage = 'Sin registros' }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
        <span className="text-sm">Cargando datos...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">📭</div>
        <span className="text-sm font-medium text-gray-500">{emptyMessage}</span>
        <span className="text-xs text-gray-400">No hay registros para mostrar</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, i) => (
            <tr
              key={i}
              className="hover:bg-emerald-50/40 transition-colors duration-100 group"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-5 py-3.5 text-gray-700 whitespace-nowrap text-sm"
                >
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? <span className="text-gray-300">—</span>)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
