import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tipo_material')
      .select('*')
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
    if (!body.descripcion?.trim())
      return NextResponse.json({ success: false, error: 'La descripción es requerida' }, { status: 400 });

    const { data: existe } = await supabase
      .from('tipo_material').select('id').ilike('descripcion', body.descripcion.trim()).maybeSingle();
    if (existe)
      return NextResponse.json({ success: false, error: 'Ya existe un tipo con esa descripción' }, { status: 409 });

    const { data, error } = await supabase
      .from('tipo_material')
      .insert([{ descripcion: body.descripcion.trim(), cod: body.cod?.trim() || null }])
      .select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
