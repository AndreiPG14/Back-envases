import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Usuario, ApiResponse } from '@/lib/types';
import { validarRequeridos, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('*, trabajadores(dni, nombres, apellido_paterno, apellido_materno), roles(id, descripcion)')
      .order('id');
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = validarRequeridos(body, ['trabajadorid', 'rolid']);
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    // Verificar que el trabajador existe
    const { data: trabajador } = await supabase.from('trabajadores').select('dni').eq('id', body.trabajadorid).single();
    if (!trabajador) return NextResponse.json({ success: false, error: 'El trabajador no existe' }, { status: 404 });

    // Verificar que el rol existe
    const { data: rol } = await supabase.from('roles').select('id').eq('id', body.rolid).single();
    if (!rol) return NextResponse.json({ success: false, error: 'El rol no existe' }, { status: 404 });

    const { data, error } = await supabase
      .from('usuario')
      .insert([{ grupo: body.grupo ?? null, trabajadorid: body.trabajadorid, rolid: body.rolid }])
      .select('*, trabajadores(dni, nombres, apellido_paterno), roles(id, descripcion)');

    if (error) throw error;
    return NextResponse.json({ success: true, data: data[0], message: 'Usuario creado exitosamente' } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
