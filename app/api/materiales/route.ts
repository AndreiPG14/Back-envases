import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Materiales, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarNumeroPositivo, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('materiales').select('*').order('descripcion');
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<Materiales[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 150, cod: 50, um: 50 }),
      ...validarNumeroPositivo(body, ['stock', 'pu']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (await verificarDuplicado(supabase, 'materiales', 'descripcion', body.descripcion)) {
      return NextResponse.json({ success: false, error: 'Ya existe un material con esa descripción' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('materiales')
      .insert([{
        descripcion: body.descripcion,
        stock: body.stock ?? 0,
        um: body.um ?? null,
        cod: body.cod ?? null,
        pu: body.pu ?? null,
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data[0], message: 'Material creado exitosamente' } as ApiResponse<Materiales>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
