'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Package, Truck, Wheat, Building2, Settings2,
  ShieldCheck, UserCircle, ArrowLeftRight,
  Warehouse, ChevronRight, PackagePlus, LayoutGrid, Layers, Navigation, PackageX, FolderOpen,
} from 'lucide-react';

const allGroups = [
  {
    label: 'Maestros',
    items: [
      { href: '/tipo-material', key: 'tipo-material', label: 'Tipos',         icon: Layers      },
      { href: '/materiales',    key: 'materiales',    label: 'Materiales',   icon: Package     },
      { href: '/vehiculo',      key: 'vehiculo',      label: 'Vehículos',    icon: Truck       },
      { href: '/fundo',         key: 'fundo',         label: 'Ubicaciones',  icon: Wheat       },
      { href: '/empresa',       key: 'empresa',       label: 'Empresas',     icon: Building2   },
      { href: '/operacion',     key: 'operacion',     label: 'Operaciones',  icon: Settings2   },
      { href: '/roles',         key: 'roles',         label: 'Roles',        icon: ShieldCheck },
      { href: '/usuario',       key: 'usuario',       label: 'Usuarios',     icon: UserCircle  },
      { href: '/grupo-vista',   key: 'grupo-vista',   label: 'Agrupador Vistas', icon: FolderOpen },
    ],
  },
  {
    label: 'Transacciones',
    items: [
      { href: '/ingreso',       key: 'ingreso',       label: 'Ingresos',    icon: PackagePlus    },
      { href: '/movimiento',    key: 'movimiento',    label: 'Movimientos', icon: ArrowLeftRight },
      { href: '/transito',      key: 'transito',      label: 'Tránsito',    icon: Navigation    },
      { href: '/merma-salidas', key: 'merma-salidas', label: 'Salidas',     icon: PackageX      },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { href: '/inventario', key: 'inventario', label: 'Stock por Ubicación', icon: LayoutGrid },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [vistas, setVistas] = useState<string[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { setVistas(d.user?.vistas ?? null); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const filteredGroups = allGroups
    .map((group) => ({
      ...group,
      items: vistas
        ? group.items.filter((item) => vistas.includes(item.key))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);

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
        {loaded && filteredGroups.map((group) => (
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
