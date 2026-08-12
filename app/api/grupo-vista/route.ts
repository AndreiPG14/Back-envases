import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, formatearErrores } from '@/lib/validations';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('grupo_vista')
      .select('*')
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

    const errores = validarRequeridos(body, ['descripcion', 'vistas']);
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (!Array.isArray(body.vistas) || body.vistas.length === 0) {
      return NextResponse.json({ success: false, error: 'Debe seleccionar al menos una vista' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('grupo_vista')
      .insert([{ descripcion: body.descripcion.trim(), vistas: body.vistas }])
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Grupo de vistas creado',
    } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
