import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.descripcion?.trim())
      return NextResponse.json({ success: false, error: 'La descripción es requerida' }, { status: 400 });

    const { data: existe } = await supabase
      .from('tipo_material').select('id').ilike('descripcion', body.descripcion.trim()).neq('id', id).maybeSingle();
    if (existe)
      return NextResponse.json({ success: false, error: 'Ya existe un tipo con esa descripción' }, { status: 409 });

    const { data, error } = await supabase
      .from('tipo_material').update({ descripcion: body.descripcion.trim(), cod: body.cod?.trim() || null }).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('tipo_material').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Tipo eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
