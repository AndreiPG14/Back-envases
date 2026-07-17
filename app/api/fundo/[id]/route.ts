import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion', 'idempresa']),
      ...validarMaxLength(body, { descripcion: 150 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const { data: empresa } = await supabase.from('empresa').select('id').eq('id', body.idempresa).single();
    if (!empresa) return NextResponse.json({ success: false, error: 'La empresa no existe' }, { status: 404 });

    if (await verificarDuplicado(supabase, 'fundo', 'descripcion', body.descripcion, Number(id))) {
      return NextResponse.json({ success: false, error: 'Ya existe un fundo con esa descripción' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('fundo')
      .update({ descripcion: body.descripcion, idempresa: body.idempresa })
      .eq('id', id)
      .select('*, empresa(id, descripcion)')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data, message: 'Fundo actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('fundo').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Fundo eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
