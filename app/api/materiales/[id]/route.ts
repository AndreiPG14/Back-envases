import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarNumeroPositivo, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from('materiales').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Material no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 150, cod: 50, um: 50 }),
      ...validarNumeroPositivo(body, ['stock', 'pu']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (await verificarDuplicado(supabase, 'materiales', 'descripcion', body.descripcion, Number(id))) {
      return NextResponse.json({ success: false, error: 'Ya existe un material con esa descripción' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('materiales')
      .update({
        descripcion: body.descripcion,
        stock:       body.stock ?? 0,
        um:          body.um   ?? null,
        cod:         body.cod  ?? null,
        pu:          body.pu   ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data, message: 'Material actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('materiales').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Material eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
