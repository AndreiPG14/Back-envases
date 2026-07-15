import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Fundo, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('fundo')
      .select('*, empresa(id, descripcion)')
      .order('descripcion');
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion', 'idempresa']),
      ...validarMaxLength(body, { descripcion: 150 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    // Verificar que la empresa existe
    const { data: empresa } = await supabase.from('empresa').select('id').eq('id', body.idempresa).single();
    if (!empresa) return NextResponse.json({ success: false, error: 'La empresa no existe' }, { status: 404 });

    if (await verificarDuplicado(supabase, 'fundo', 'descripcion', body.descripcion)) {
      return NextResponse.json({ success: false, error: 'Ya existe un fundo con esa descripción' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('fundo')
      .insert([{ descripcion: body.descripcion, idempresa: body.idempresa }])
      .select('*, empresa(id, descripcion)');

    if (error) throw error;
    return NextResponse.json({ success: true, data: data[0], message: 'Fundo creado exitosamente' } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
