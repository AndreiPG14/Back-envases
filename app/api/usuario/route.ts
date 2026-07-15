import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Usuario, ApiResponse } from '@/lib/types';

// GET: Todos los usuarios con sus relaciones
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('*, trabajadores(id, dni, nombres, apellido_paterno, apellido_materno), roles(id, descripcion)')
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

// POST: Crear usuario
export async function POST(request: NextRequest) {
  try {
    const { grupo, trabajadorid, rolid } = await request.json();

    if (!trabajadorid || !rolid) {
      return NextResponse.json(
        { success: false, error: 'trabajadorid y rolid son requeridos' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('usuario')
      .insert([{ grupo, trabajadorid, rolid }])
      .select('*, trabajadores(id, dni, nombres), roles(id, descripcion)');

    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Usuario creado' } as ApiResponse<any>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
