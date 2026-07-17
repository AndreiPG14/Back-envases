'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package, Truck, Wheat, Building2, Settings2,
  ShieldCheck, HardHat, UserCircle, ArrowLeftRight,
  Warehouse, ChevronRight, PackagePlus, LayoutGrid,
} from 'lucide-react';

const groups = [
  {
    label: 'Maestros',
    items: [
      { href: '/materiales',   label: 'Materiales',   icon: Package     },
      { href: '/vehiculo',     label: 'Vehículos',    icon: Truck       },
      { href: '/fundo',        label: 'Ubicaciones',  icon: Wheat       },
      { href: '/empresa',      label: 'Empresas',     icon: Building2   },
      { href: '/operacion',    label: 'Operaciones',  icon: Settings2   },
      { href: '/roles',        label: 'Roles',        icon: ShieldCheck },
      { href: '/trabajadores', label: 'Trabajadores', icon: HardHat     },
      { href: '/usuario',      label: 'Usuarios',     icon: UserCircle  },
    ],
  },
  {
    label: 'Transacciones',
    items: [
      { href: '/ingreso',    label: 'Ingresos',    icon: PackagePlus    },
      { href: '/movimiento', label: 'Movimientos', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { href: '/inventario', label: 'Stock por Ubicación', icon: LayoutGrid },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Warehouse size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Almacén Campo</p>
            <p className="text-slate-400 text-xs">Gestión de inventario</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                        {label}
                      </div>
                      {active && <ChevronRight size={14} className="opacity-70" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <p className="text-xs text-slate-600">v1.0.0 · Almacén Campo</p>
      </div>
    </aside>
  );
}
