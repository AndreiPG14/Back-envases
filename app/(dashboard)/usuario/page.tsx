'use client';

import { useEffect, useState } from 'react';
import { UserCircle, Plus, Trash2, X, Search, Loader2, ChevronDown, Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Rol       { id: number; descripcion: string }
interface Fundo     { id: number; descripcion: string }
interface Trabajador { dni: string; nombres: string; apellido_paterno: string; apellido_materno: string }
interface Usuario   {
  id: number;
  idfundo: number | null;
  trabajadorid: string;
  rolid: number;
  username: string;
  rol: Rol | null;
  trabajador: Trabajador | null;
  fundo: Fundo | null;
}

export default function UsuarioPage() {
  const [data, setData]           = useState<Usuario[]>([]);
  const [roles, setRoles]         = useState<Rol[]>([]);
  const [fundos, setFundos]       = useState<Fundo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editUsuario, setEditUsuario]     = useState<Usuario | null>(null);
  const [deleting, setDeleting]           = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/usuario')
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        setData(res.data ?? []);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetch('/api/roles').then((r) => r.json()).then((res) => setRoles(res.data ?? []));
    fetch('/api/fundo').then((r) => r.json()).then((res) => setFundos(res.data ?? []));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    setDeleting(id);
    await fetch(`/api/usuario/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchData();
  };

  const nombreCompleto = (t: Trabajador | null) => {
    if (!t) return '—';
    return `${t.apellido_paterno ?? ''} ${t.apellido_materno ?? ''}, ${t.nombres ?? ''}`.trim();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<UserCircle size={20} />}
        title="Usuarios"
        subtitle="Accesos del sistema"
        count={data.length}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo usuario
          </button>
        }
      />

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <div className="text-3xl">📭</div>
            <p className="text-sm font-medium text-gray-500">Sin usuarios registrados</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['ID', 'Trabajador', 'DNI', 'Usuario', 'Rol', 'Ubicación', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{u.id}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-700">{nombreCompleto(u.trabajador)}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{u.trabajadorid}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-slate-700">{u.username ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {u.rol?.descripcion ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.fundo
                      ? <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{u.fundo.descripcion}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditUsuario(u)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ModalCrearUsuario
          roles={roles}
          fundos={fundos}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchData(); }}
        />
      )}

      {editUsuario && (
        <ModalEditarUsuario
          usuario={editUsuario}
          roles={roles}
          fundos={fundos}
          onClose={() => setEditUsuario(null)}
          onSaved={() => { setEditUsuario(null); fetchData(); }}
        />
      )}
    </div>
  );
}

/* ── Modal editar usuario ── */
function ModalEditarUsuario({
  usuario, roles, fundos, onClose, onSaved,
}: {
  usuario: Usuario; roles: Rol[]; fundos: Fundo[]; onClose: () => void; onSaved: () => void;
}) {
  const [rolid, setRolid]               = useState(String(usuario.rolid));
  const [idfundo, setIdfundo]           = useState(usuario.idfundo ? String(usuario.idfundo) : '');
  const [username, setUsername]         = useState(usuario.username ?? '');
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');

  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2';
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolid)           { setErrorGuardar('Selecciona un rol'); return; }
    if (!username.trim()) { setErrorGuardar('El nombre de usuario es requerido'); return; }

    setSaving(true);
    setErrorGuardar('');

    const body: any = {
      rolid:   Number(rolid),
      idfundo: idfundo ? Number(idfundo) : null,
      username: username.trim(),
    };
    if (password.trim()) body.password = password.trim();

    const res = await fetch(`/api/usuario/${usuario.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());

    setSaving(false);
    if (res.success) onSaved();
    else setErrorGuardar(res.error ?? 'Error al actualizar usuario');
  };

  const nombreTrabajador = usuario.trabajador
    ? `${usuario.trabajador.apellido_paterno} ${usuario.trabajador.apellido_materno}, ${usuario.trabajador.nombres}`
    : usuario.trabajadorid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Pencil size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Editar usuario</h2>
              <p className="text-xs text-gray-400">{nombreTrabajador}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Trabajador (solo lectura) */}
          <div>
            <label className={labelCls}>Trabajador</label>
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{nombreTrabajador}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">DNI: {usuario.trabajadorid}</p>
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className={labelCls}>Rol <span className="text-red-400">*</span></label>
            <div className="relative">
              <select value={rolid} onChange={(e) => setRolid(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Seleccionar rol...</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.descripcion}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className={labelCls}>Ubicación <span className="text-gray-400 font-normal">(opcional)</span></label>
            <div className="relative">
              <select value={idfundo} onChange={(e) => setIdfundo(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Sin ubicación asignada</option>
                {fundos.map((f) => <option key={f.id} value={f.id}>{f.descripcion}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className={labelCls}>Usuario <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className={inputCls + ' font-mono'}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelCls}>
              Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña..."
                className={inputCls + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {errorGuardar && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{errorGuardar}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal crear usuario ── */
function ModalCrearUsuario({
  roles, fundos, onClose, onCreated,
}: {
  roles: Rol[]; fundos: Fundo[]; onClose: () => void; onCreated: () => void;
}) {
  const [dni, setDni]                     = useState('');
  const [buscando, setBuscando]           = useState(false);
  const [trabajador, setTrabajador]       = useState<Trabajador | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [rolid, setRolid]                 = useState('');
  const [idfundo, setIdfundo]             = useState('');
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [errorGuardar, setErrorGuardar]   = useState('');

  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2';
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

  const buscarTrabajador = async () => {
    if (dni.length !== 8) { setErrorBusqueda('El DNI debe tener 8 dígitos'); return; }
    setBuscando(true);
    setErrorBusqueda('');
    setTrabajador(null);
    const res = await fetch(`/api/trabajadores-qbiz/${dni}`).then((r) => r.json());
    setBuscando(false);
    if (res.success && res.data) setTrabajador(res.data);
    else setErrorBusqueda('Trabajador no encontrado');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabajador)       { setErrorGuardar('Busca un trabajador primero'); return; }
    if (!rolid)            { setErrorGuardar('Selecciona un rol'); return; }
    if (!username.trim())  { setErrorGuardar('El nombre de usuario es requerido'); return; }
    if (!password.trim())  { setErrorGuardar('La contraseña es requerida'); return; }

    setSaving(true);
    setErrorGuardar('');

    const res = await fetch('/api/usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trabajadorid: trabajador.dni,
        rolid:        Number(rolid),
        idfundo:      idfundo ? Number(idfundo) : null,
        username:     username.trim(),
        password,
      }),
    }).then((r) => r.json());

    setSaving(false);
    if (res.success) onCreated();
    else setErrorGuardar(res.error ?? 'Error al crear usuario');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCircle size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Nuevo usuario</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Buscar trabajador */}
          <div>
            <label className={labelCls}>Trabajador <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dni}
                onChange={(e) => { setDni(e.target.value.replace(/\D/g, '').slice(0, 8)); setTrabajador(null); }}
                placeholder="Ingresa el DNI"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                maxLength={8}
              />
              <button
                type="button"
                onClick={buscarTrabajador}
                disabled={buscando || dni.length !== 8}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                {buscando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Buscar
              </button>
            </div>
            {errorBusqueda && <p className="mt-1.5 text-xs text-red-500">{errorBusqueda}</p>}
            {trabajador && (
              <div className="mt-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm font-semibold text-emerald-800">
                  {trabajador.apellido_paterno} {trabajador.apellido_materno}, {trabajador.nombres}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">DNI: {trabajador.dni}</p>
              </div>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className={labelCls}>Rol <span className="text-red-400">*</span></label>
            <div className="relative">
              <select value={rolid} onChange={(e) => setRolid(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Seleccionar rol...</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.descripcion}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className={labelCls}>
              Ubicación <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <select value={idfundo} onChange={(e) => setIdfundo(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Sin ubicación asignada</option>
                {fundos.map((f) => <option key={f.id} value={f.id}>{f.descripcion}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className={labelCls}>Usuario <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="Ej: jperez, maria123..."
              className={inputCls + ' font-mono'}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelCls}>Contraseña <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={inputCls + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {errorGuardar && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{errorGuardar}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Guardando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
