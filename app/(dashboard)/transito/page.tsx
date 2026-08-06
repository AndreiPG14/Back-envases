'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Inbox, Truck, User, MapPin } from 'lucide-react';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';

interface DetalleTransito {
  id: number;
  cantidad: number;
  estado: string;
  created_at: string;
  fecha_recepcion: string | null;
  tipo: string | null;
  cantidad_confirmada: number | null;
  merma: number | null;
  observaciones: string | null;
  material: { id: number; descripcion: string } | null;
  fundo_destino: { id: number; descripcion: string } | null;
  usuario_recepcion: { id: number; username: string } | null;
  movimiento: {
    id: number;
    fundo_origen: { id: number; descripcion: string } | null;
    vehiculo: { id: number; placa: string } | null;
    usuario: { id: number; username: string } | null;
  } | null;
}

interface MovGroup {
  idmovimiento: number;
  vehiculo: string;
  usuario: string;
  fundo_origen: string;
  fecha: string;
  detalles: DetalleTransito[];
  hasPending: boolean;
}

function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function elapsed(created_at: string, end: Date | string) {
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const m = Math.floor((endDate.getTime() - new Date(created_at).getTime()) / 60_000);
  const h = Math.floor(m / 60), mins = m % 60;
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

const ESTADO_CFG: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:  { color: '#3B82F6', bg: '#EFF6FF', label: 'En tránsito'  },
  COMPLETO:   { color: '#10B981', bg: '#F0FDF4', label: 'Recepcionado' },
  INCOMPLETO: { color: '#F59E0B', bg: '#FFFBEB', label: 'Incompleto'   },
};

// ── Location node ─────────────────────────────────────────────────────────
function LocNode({ label, name, color, filled }: { label: string; name: string; color: string; filled: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 100, flexShrink: 0 }}>
      {/* pin circle */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: filled ? color : 'var(--node-ring-bg)',
        border: `2px solid ${filled ? color : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <MapPin size={18} color={filled ? '#fff' : 'var(--t3)'} />
      </div>
      {/* step label */}
      <span style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>
        {label}
      </span>
      {/* location name */}
      <span style={{ fontSize: '.78rem', fontWeight: 700, textAlign: 'center', color: 'var(--t1)', lineHeight: 1.25 }}>
        {name}
      </span>
    </div>
  );
}

// ── Connector ─────────────────────────────────────────────────────────────
function Connector({ color, pending, material, cantidad, statusLabel, elapsed }: {
  color: string; pending: boolean; material: string; cantidad: number; statusLabel: string; elapsed: string;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {/* material chip */}
      <span style={{
        fontSize: '.72rem', fontWeight: 600,
        padding: '3px 10px', borderRadius: 99,
        background: `${color}18`, color,
        whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {material} · {cantidad} u.
      </span>
      {/* track */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0 }}>
        <div style={{ flex: 1, height: 3, borderRadius: '3px 0 0 3px', background: pending ? 'var(--border)' : color }} />
        {pending && (
          <div style={{
            flex: 1, height: 3,
            background: `repeating-linear-gradient(90deg,${color} 0,${color} 6px,transparent 6px,transparent 12px)`,
          }} />
        )}
        <div style={{
          width: 0, height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: `10px solid ${color}`,
          flexShrink: 0,
        }} />
      </div>
      {/* status */}
      <span style={{ fontSize: '.67rem', fontWeight: 600, color, letterSpacing: '.02em' }}>
        {statusLabel}
      </span>
      <span style={{ fontSize: '.63rem', color: 'var(--t3)', fontFamily: 'ui-monospace,monospace' }}>
        {elapsed}
      </span>
    </div>
  );
}

// ── Route card per detalle ────────────────────────────────────────────────
function RouteRow({ d, num, now }: { d: DetalleTransito; num: number; now: Date }) {
  const cfg     = ESTADO_CFG[d.estado] ?? ESTADO_CFG['COMPLETO'];
  const pending = d.estado === 'PENDIENTE';
  const origin  = d.movimiento?.fundo_origen?.descripcion ?? '—';
  const dest    = d.fundo_destino?.descripcion ?? '—';
  const mat     = d.tipo ? `${d.material?.descripcion ?? '—'} — ${d.tipo}` : (d.material?.descripcion ?? '—');
  const el      = elapsed(d.created_at, d.fecha_recepcion ?? now);

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* colored left stripe */}
        <div style={{ width: 4, alignSelf: 'stretch', background: cfg.color, flexShrink: 0 }} />

        {/* seq number */}
        <span style={{
          fontSize: '.65rem', fontWeight: 800, color: 'var(--t3)',
          fontFamily: 'ui-monospace,monospace', flexShrink: 0,
        }}>#{num}</span>

        {/* nodes + connector */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 16px 18px 0' }}>
          <LocNode label="Origen" name={origin} color="#64748b" filled={true} />
          <Connector
            color={cfg.color}
            pending={pending}
            material={mat}
            cantidad={d.cantidad}
            statusLabel={pending ? 'En tránsito' : cfg.label}
            elapsed={el}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <LocNode label="Destino" name={dest} color={cfg.color} filled={!pending} />
            {!pending && d.usuario_recepcion && (
              <span style={{
                fontSize: '.65rem', color: 'var(--t3)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <User size={10} />
                {d.usuario_recepcion.username}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* extra info bar */}
      {!pending && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          padding: '8px 20px 10px 20px',
          borderTop: '1px solid var(--border)',
          background: `${cfg.color}08`,
          fontSize: '.72rem', color: 'var(--t2)',
        }}>
          {d.cantidad_confirmada != null && (
            <span>Confirmado: <b style={{ color: cfg.color }}>{d.cantidad_confirmada} u.</b></span>
          )}
          {d.merma != null && d.merma > 0 && (
            <span>Merma: <b style={{ color: '#F59E0B' }}>{d.merma} u.</b></span>
          )}
          {d.fecha_recepcion && (
            <span>Recepcionado: <b style={{ color: 'var(--t1)' }}>{fmtDate(d.fecha_recepcion)}</b></span>
          )}
          {d.observaciones && (
            <span style={{ fontStyle: 'italic', color: 'var(--t3)' }}>"{d.observaciones}"</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────
export default function TransitoPage() {
  const [detalles, setDetalles] = useState<DetalleTransito[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const now = useNow();

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch('/api/transito');
      const j = await r.json();
      if (j.success) setDetalles(j.data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeRefresh(['movimiento_detalle', 'movimiento'], fetchData, 'transito-page');

  const groups = useMemo<MovGroup[]>(() => {
    const map = new Map<number, MovGroup>();
    for (const d of detalles) {
      const mid = d.movimiento?.id ?? 0;
      if (!map.has(mid)) {
        map.set(mid, {
          idmovimiento: mid,
          vehiculo:     d.movimiento?.vehiculo?.placa ?? '—',
          usuario:      d.movimiento?.usuario?.username ?? '—',
          fundo_origen: d.movimiento?.fundo_origen?.descripcion ?? '—',
          fecha:        d.created_at,
          detalles:     [],
          hasPending:   false,
        });
      }
      const g = map.get(mid)!;
      g.detalles.push(d);
      if (d.estado === 'PENDIENTE') g.hasPending = true;
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [detalles]);

  useEffect(() => {
    if (groups.length > 0 && selected === null) setSelected(groups[0].idmovimiento);
  }, [groups, selected]);

  const activeGroup = groups.find(g => g.idmovimiento === selected) ?? null;
  const pendingAll = detalles.filter(d => d.estado === 'PENDIENTE').length;
  const pendingMov = groups.filter(g => g.hasPending).length;

  return (
    <>
      <style>{`
        :root{
          --t1:#0f172a;--t2:#475569;--t3:#94a3b8;
          --border:#e2e8f0;--surface:#fff;--hover:#f8fafc;--sidebar:#f8fafc;--node-ring-bg:#f1f5f9;
        }
        @media(prefers-color-scheme:dark){:root{
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#4a6080;
          --border:#1e3048;--surface:#162032;--hover:#1a2a3e;--sidebar:#111e2d;--node-ring-bg:#1a2a3e;
        }}
        :root[data-theme="dark"]{
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#4a6080;
          --border:#1e3048;--surface:#162032;--hover:#1a2a3e;--sidebar:#111e2d;--node-ring-bg:#1a2a3e;
        }
        :root[data-theme="light"]{
          --t1:#0f172a;--t2:#475569;--t3:#94a3b8;
          --border:#e2e8f0;--surface:#fff;--hover:#f8fafc;--sidebar:#f8fafc;--node-ring-bg:#f1f5f9;
        }

        .sb-item{
          padding:14px 16px;border-bottom:1px solid var(--border);
          cursor:pointer;transition:background .12s;
          display:flex;flex-direction:column;gap:5px;
        }
        .sb-item:hover{background:var(--hover);}
        .sb-item.active{background:var(--surface);border-left:3px solid #3B82F6;padding-left:13px;}
        .sb-item:last-child{border-bottom:none;}
        .sb-num{font-size:.68rem;font-weight:700;color:var(--t3);font-family:ui-monospace,monospace;letter-spacing:.06em;}
        .sb-origen{font-size:.82rem;font-weight:600;color:var(--t1);}
        .sb-meta{display:flex;align-items:center;gap:8px;font-size:.7rem;color:var(--t2);}
        .sb-meta-i{display:flex;align-items:center;gap:3px;}
        .sb-count{
          display:inline-flex;align-items:center;justify-content:center;
          padding:2px 8px;border-radius:99px;
          font-size:.65rem;font-weight:700;
          background:#DBEAFE;color:#1D4ED8;
        }
        @media(prefers-color-scheme:dark){.sb-count{background:#1e2455;color:#818cf8;}}
        :root[data-theme="dark"] .sb-count{background:#1e2455;color:#818cf8;}
        :root[data-theme="light"] .sb-count{background:#DBEAFE;color:#1D4ED8;}

        .det-header{
          display:flex;align-items:center;gap:12px;
          padding:16px 20px;border-bottom:1px solid var(--border);flex-wrap:wrap;
        }
        .det-badge{
          font-size:.72rem;font-weight:700;letter-spacing:.08em;
          font-family:ui-monospace,monospace;color:#3B82F6;
          background:#EFF6FF;padding:4px 10px;border-radius:6px;
        }
        @media(prefers-color-scheme:dark){.det-badge{background:#0f2236;}}
        :root[data-theme="dark"] .det-badge{background:#0f2236;}
        :root[data-theme="light"] .det-badge{background:#EFF6FF;}
        .det-info{display:flex;align-items:center;gap:5px;font-size:.78rem;color:var(--t2);}

        .refresh-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;
          background:var(--surface);border:1px solid var(--border);border-radius:8px;
          font-size:.8rem;font-weight:500;color:var(--t2);cursor:pointer;}
        .refresh-btn:hover{filter:brightness(.97);}
        .empty-s{display:flex;flex-direction:column;align-items:center;
          gap:12px;padding:64px;color:var(--t3);font-size:.875rem;}
      `}</style>

      <div style={{ color: 'var(--t1)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 44, height: 44, background: '#3B82F6', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px #3B82F620',
            }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>En Tránsito</div>
              <div style={{ fontSize: '.78rem', color: 'var(--t3)', marginTop: 2 }}>
                {groups.length} movimiento{groups.length !== 1 ? 's' : ''} · {pendingMov} en tránsito · {pendingAll} detalle{pendingAll !== 1 ? 's' : ''} pendiente{pendingAll !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button className="refresh-btn" onClick={fetchData}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* body */}
        {loading ? (
          <div className="empty-s"><p>Cargando...</p></div>
        ) : groups.length === 0 ? (
          <div className="empty-s"><Inbox size={40} strokeWidth={1.2} /><p>Sin movimientos en tránsito</p></div>
        ) : (
          <div style={{
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
            minHeight: 480,
          }}>
            {/* sidebar */}
            <div style={{
              width: 256, flexShrink: 0,
              background: 'var(--sidebar)',
              borderRight: '1px solid var(--border)',
              overflowY: 'auto',
            }}>
              <div style={{ padding: '11px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                  Movimientos
                </span>
              </div>

              {groups.map(g => {
                const pendCount = g.detalles.filter(d => d.estado === 'PENDIENTE').length;
                const allDone   = pendCount === 0;
                const badgeColor = allDone ? '#10B981' : '#3B82F6';
                const badgeBg   = allDone ? '#D1FAE5' : '#DBEAFE';
                const badgeTxt  = allDone ? 'Recibido' : `${pendCount} pend.`;
                return (
                  <div
                    key={g.idmovimiento}
                    className={`sb-item ${selected === g.idmovimiento ? 'active' : ''}`}
                    onClick={() => setSelected(g.idmovimiento)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="sb-num">MOV #{g.idmovimiento}</span>
                      <span style={{
                        fontSize: '.63rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 99, background: badgeBg, color: badgeColor,
                      }}>{badgeTxt}</span>
                    </div>
                    {/* placa destacada */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                    }}>
                      <Truck size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '1rem', fontWeight: 800, letterSpacing: '.12em',
                        fontFamily: 'ui-monospace,monospace', color: 'var(--t1)',
                      }}>{g.vehiculo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.75rem', color: 'var(--t2)' }}>
                      <MapPin size={11} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                      {g.fundo_origen}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.7rem', color: 'var(--t2)' }}>
                      <User size={11} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                      {g.usuario}
                    </div>
                    <div style={{ fontSize: '.64rem', color: 'var(--t3)', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>
                      {fmtDate(g.fecha)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* detail */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {activeGroup ? (
                <>
                  {/* detail header */}
                  <div className="det-header">
                    <span className="det-badge">MOV #{activeGroup.idmovimiento}</span>
                    <span style={{
                      fontSize: '1.1rem', fontWeight: 800, letterSpacing: '.14em',
                      fontFamily: 'ui-monospace,monospace', color: 'var(--t1)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Truck size={16} style={{ color: 'var(--t3)' }} />
                      {activeGroup.vehiculo}
                    </span>
                    <span className="det-info"><MapPin size={14} style={{ color: 'var(--t3)' }} />{activeGroup.fundo_origen}</span>
                    <span className="det-info"><User size={14} style={{ color: 'var(--t3)' }} />{activeGroup.usuario}</span>
                  </div>

                  {/* route rows */}
                  <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                    {activeGroup.detalles.map((d, i) => (
                      <RouteRow key={d.id} d={d} num={i + 1} now={now} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-s" style={{ flex: 1, justifyContent: 'center' }}>
                  <p>Selecciona un movimiento</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
