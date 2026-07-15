import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Empresa, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<Empresa[]>);
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
      .from('empresa')
      .insert([{ descripcion }])
      .select();

    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Empresa creada' } as ApiResponse<Empresa>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
