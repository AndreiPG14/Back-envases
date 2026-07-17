'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

const titles: Record<string, { label: string; desc: string }> = {
  '/materiales':   { label: 'Materiales',    desc: 'Inventario de materiales' },
  '/vehiculo':     { label: 'Vehículos',     desc: 'Flota de vehículos' },
  '/fundo':        { label: 'Ubicaciones',   desc: 'Ubicaciones y áreas del sistema' },
  '/empresa':      { label: 'Empresas',      desc: 'Empresas registradas' },
  '/operacion':    { label: 'Operaciones',   desc: 'Tipos de operación' },
  '/roles':        { label: 'Roles',         desc: 'Roles de usuario' },
  '/trabajadores': { label: 'Trabajadores',  desc: 'Personal de campo' },
  '/usuario':      { label: 'Usuarios',      desc: 'Usuarios del sistema' },
  '/movimiento':   { label: 'Movimientos',   desc: 'Historial de movimientos' },
};

export default function TopBar() {
  const pathname = usePathname();
  const page = titles[pathname] ?? { label: 'Inicio', desc: '' };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-800">{page.label}</h1>
        {page.desc && <p className="text-xs text-gray-400">{page.desc}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-700 leading-tight">Admin</p>
            <p className="text-[10px] text-gray-400">Almacén Campo</p>
          </div>
        </div>
      </div>
    </header>
  );
}
