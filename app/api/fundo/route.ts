import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Fundo, ApiResponse } from '@/lib/types';

// GET: Todos los fundos con empresa
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('fundo')
      .select('*, empresa(id, descripcion)')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST: Crear fundo
export async function POST(request: NextRequest) {
  try {
    const { descripcion, idempresa } = await request.json();

    if (!descripcion || !idempresa) {
      return NextResponse.json(
        { success: false, error: 'descripcion e idempresa son requeridos' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('fundo')
      .insert([{ descripcion, idempresa }])
      .select('*, empresa(id, descripcion)');

    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Fundo creado' } as ApiResponse<any>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
