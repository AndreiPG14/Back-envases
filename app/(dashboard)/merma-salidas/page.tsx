'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PackageX, RefreshCw, Inbox, MapPin, Truck, User, CheckCircle2, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface MermaSalidaItem {
  id: number;
  cantidad: number;
  merma: number;
  tipo_merma: string;
  created_at: string;
  fecha_recepcion: string | null;
  observaciones: string | null;
  merma_salida_registrada: boolean;
  material: { id: number; descripcion: string; um: string } | null;
  fundo_destino: { id: number; descripcion: string } | null;
  usuario_recepcion: { id: number; username: string } | null;
  movimiento: {
    id: number;
    fecha: string;
    fundo_origen: { id: number; descripcion: string } | null;
    vehiculo: { id: number; placa: string } | null;
  } | null;
}

function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function MermaSalidasPage() {
  const [items, setItems]     = useState<MermaSalidaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);
  const [error, setError]     = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/merma-salidas');
      const j = await r.json();
      if (j.success) setItems(j.data ?? []);
      else setError(j.error ?? 'Error al cargar');
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const registrarSalida = async (id: number) => {
    setSaving(id);
    try {
      const r = await fetch(`/api/merma-salidas/${id}/registrar`, { method: 'POST' });
      const j = await r.json();
      if (j.success) {
        setItems(prev => prev.filter(i => i.id !== id));
      } else {
        setError(j.error ?? 'Error al registrar');
      }
    } catch { setError('Error de conexión'); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<PackageX size={20} />}
        title="Salidas"
        count={items.length}
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={32} className="animate-spin text-red-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-2">
          <CheckCircle2 size={40} className="text-emerald-400" />
          <p className="text-sm font-semibold text-gray-600">Sin merma pendiente</p>
          <p className="text-xs text-gray-400">Todas las salidas de material roto han sido registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Mov', 'Fecha recepción', 'Material', 'Origen', 'Destino', 'Vehículo', 'Enviado', 'Merma ROTO', 'Recepcionó', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400 whitespace-nowrap">
                    #{item.movimiento?.id ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {item.fecha_recepcion ? fmtDate(item.fecha_recepcion) : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {item.material?.descripcion ?? '—'}
                    <span className="ml-1 text-xs font-normal text-gray-400">{item.material?.um}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} className="text-gray-300" />
                      {item.movimiento?.fundo_origen?.descripcion ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} className="text-gray-300" />
                      {item.fundo_destino?.descripcion ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs font-mono font-semibold text-gray-700">
                      <Truck size={11} className="text-gray-300" />
                      {item.movimiento?.vehiculo?.placa ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {item.cantidad} <span className="text-xs text-gray-400">{item.material?.um}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full text-sm">
                      {item.merma} <span className="text-xs font-normal">{item.material?.um}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.usuario_recepcion ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={11} className="text-gray-300" />
                        {item.usuario_recepcion.username}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => registrarSalida(item.id)}
                      disabled={saving === item.id}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {saving === item.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <CheckCircle2 size={12} />
                      }
                      Registrar salida
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
