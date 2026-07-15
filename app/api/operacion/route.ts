import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Operacion, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('operacion').select('*').order('id');
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<Operacion[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 100 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (await verificarDuplicado(supabase, 'operacion', 'descripcion', body.descripcion)) {
      return NextResponse.json({ success: false, error: 'Ya existe una operación con esa descripción' }, { status: 409 });
    }

    const { data, error } = await supabase.from('operacion').insert([{ descripcion: body.descripcion }]).select();
    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0], message: 'Operación creada exitosamente' } as ApiResponse<Operacion>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
