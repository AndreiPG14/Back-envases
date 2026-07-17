import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, formatearErrores } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const { data: usuarios, error } = await supabase.from('usuario').select('*').order('id');
    if (error) throw error;

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ success: true, data: [] } as ApiResponse<any[]>);
    }

    const dnis     = [...new Set(usuarios.map((u: any) => u.trabajadorid))];
    const rolIds   = [...new Set(usuarios.map((u: any) => u.rolid))];
    const fundoIds = [...new Set(usuarios.map((u: any) => u.idfundo).filter(Boolean))];

    const [
      { data: trabajadores, error: errTrab },
      { data: roles,        error: errRoles },
      { data: fundos,       error: errFundos },
    ] = await Promise.all([
      supabase.from('trabajadores').select('dni, nombres, apellido_paterno, apellido_materno').in('dni', dnis),
      supabase.from('roles').select('id, descripcion').in('id', rolIds),
      fundoIds.length > 0
        ? supabase.from('fundo').select('id, descripcion').in('id', fundoIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (errTrab)   throw errTrab;
    if (errRoles)  throw errRoles;
    if (errFundos) throw errFundos;

    const rolesMap  = Object.fromEntries((roles  ?? []).map((r: any) => [String(r.id), r]));
    const trabMap   = Object.fromEntries((trabajadores ?? []).map((t: any) => [String(t.dni), t]));
    const fundosMap = Object.fromEntries((fundos ?? []).map((f: any) => [String(f.id), f]));

    const enriched = usuarios.map((u: any) => ({
      ...u,
      rol:       rolesMap[String(u.rolid)]       ?? null,
      trabajador: trabMap[String(u.trabajadorid)] ?? null,
      fundo:     u.idfundo ? (fundosMap[String(u.idfundo)] ?? null) : null,
    }));

    return NextResponse.json({ success: true, data: enriched } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = validarRequeridos(body, ['trabajadorid', 'rolid', 'username', 'password']);
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const { data: trabajador } = await supabase
      .from('trabajadores').select('dni, nombres, apellido_paterno').eq('dni', body.trabajadorid).single();
    if (!trabajador) return NextResponse.json({ success: false, error: 'El trabajador no existe' }, { status: 404 });

    const { data: rol } = await supabase.from('roles').select('id, descripcion').eq('id', body.rolid).single();
    if (!rol) return NextResponse.json({ success: false, error: 'El rol no existe' }, { status: 404 });

    const { data: dupUser } = await supabase.from('usuario').select('id').eq('username', body.username).single();
    if (dupUser) return NextResponse.json({ success: false, error: 'Ese nombre de usuario ya existe' }, { status: 409 });

    const { data: dup } = await supabase
      .from('usuario').select('id').eq('trabajadorid', body.trabajadorid).eq('rolid', body.rolid).single();
    if (dup) return NextResponse.json({ success: false, error: 'Este trabajador ya tiene ese rol asignado' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const { data, error } = await supabase
      .from('usuario')
      .insert([{
        idfundo:      body.idfundo ?? null,
        trabajadorid: body.trabajadorid,
        rolid:        body.rolid,
        username:     body.username,
        password:     hashedPassword,
      }])
      .select('*')
      .single();

    if (error) throw error;

    let fundo = null;
    if (body.idfundo) {
      const { data: f } = await supabase.from('fundo').select('id, descripcion').eq('id', body.idfundo).single();
      fundo = f;
    }

    return NextResponse.json({
      success: true,
      data: { ...data, rol, trabajador, fundo },
      message: 'Usuario creado exitosamente',
    } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
