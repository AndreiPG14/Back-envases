'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, X, AlertTriangle, Package, MapPin, User, Calendar } from 'lucide-react';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AlertasMerma() {
  const [alertas, setAlertas]     = useState<any[]>([]);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(true);
  const [nuevas, setNuevas]       = useState(0); // badge de "no vistas"
  const channelRef                = useRef<ReturnType<typeof supabaseClient.channel> | null>(null);

  // Carga inicial
  const fetchAlertas = async () => {
    const res = await fetch('/api/movimiento_detalle?conMerma=1');
    const json = await res.json();
    setAlertas(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlertas();

    // Suscripción Realtime a movimiento_detalle
    const channel = supabaseClient
      .channel('merma-alerts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'movimiento_detalle' },
        (payload) => {
          const row = payload.new as any;
          if ((row.merma ?? 0) > 0) {
            // Traer detalle completo con joins
            fetch(`/api/movimiento_detalle?idmovimiento=${row.idmovimiento}&conMerma=1`)
              .then((r) => r.json())
              .then((res) => {
                const nuevosDetalles: any[] = res.data ?? [];
                setAlertas((prev) => {
                  const ids = new Set(prev.map((a) => a.id));
                  const agregados = nuevosDetalles.filter((d) => !ids.has(d.id));
                  if (agregados.length > 0) setNuevas((n) => n + agregados.length);
                  return [...agregados, ...prev];
                });
              });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setNuevas(0);
  };

  const count = alertas.length;

  const fmtFecha = (v: string) =>
    new Date(v).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
    });

  return (
    <>
      {/* Campana fija */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all group"
      >
        <Bell
          size={22}
          className={`transition-colors ${count > 0 ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`}
        />
        {(nuevas > 0 || count > 0) && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow ${nuevas > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>
            {nuevas > 0 ? nuevas : count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Alertas de merma</h2>
                  <p className="text-xs text-gray-400">{count} detalle{count !== 1 ? 's' : ''} con pérdida · tiempo real</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-16 text-sm text-gray-300">Cargando...</div>
              ) : count === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Bell size={32} className="text-gray-200" />
                  <p className="text-sm text-gray-400">Sin mermas registradas</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {alertas.map((d) => {
                    const pct = d.cantidad > 0 ? Math.round((d.merma / d.cantidad) * 100) : 0;
                    return (
                      <li key={d.id} className="px-6 py-4 hover:bg-orange-50/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Package size={14} className="text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-800 text-sm truncate">
                                {d.material?.descripcion ?? '—'}
                                {d.material?.um && <span className="ml-1 text-gray-400 font-normal text-xs">{d.material.um}</span>}
                              </p>
                              <span className="shrink-0 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                -{d.merma} {d.material?.um ?? ''}
                              </span>
                            </div>

                            <div className="mt-1.5 mb-2">
                              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                <span>Enviado: {d.cantidad}</span>
                                <span>Recibido: {d.cantidad_confirmada} · Merma: {pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${100 - pct}%` }} />
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1">
                                <MapPin size={10} />
                                {d.movimiento?.fundo_origen?.descripcion ?? '—'} → {d.fundo_destino?.descripcion ?? '—'}
                              </span>
                              {d.movimiento?.usuario_origen?.username && (
                                <span className="flex items-center gap-1">
                                  <User size={10} /> {d.movimiento.usuario_origen.username}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={10} /> {fmtFecha(d.movimiento?.fecha ?? d.created_at)}
                              </span>
                              <span className="text-gray-300">Mov #{d.movimiento?.id} · Det #{d.id}</span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
