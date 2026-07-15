import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Operacion, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('operacion').select('*').order('id');
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<Operacion[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { descripcion } = await request.json();
    if (!descripcion) {
      return NextResponse.json(
        { success: false, error: 'descripcion es requerido' } as ApiResponse<null>,
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from('operacion')
      .insert([{ descripcion }])
      .select();
    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Operación creada' } as ApiResponse<Operacion>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
