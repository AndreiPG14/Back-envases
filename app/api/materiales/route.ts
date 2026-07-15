import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Materiales, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('materiales')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<Materiales[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { descripcion, stock, um, cod, pu } = body;

    if (!descripcion) {
      return NextResponse.json(
        { success: false, error: 'descripcion es requerido' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('materiales')
      .insert([{ descripcion, stock: stock || 0, um, cod, pu }])
      .select();

    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Material creado exitosamente' } as ApiResponse<Materiales>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
