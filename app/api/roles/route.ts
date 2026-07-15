import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Roles, ApiResponse } from '@/lib/types';

// GET: Obtener todos los roles
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    } as ApiResponse<Roles[]>);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST: Crear nuevo rol
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { descripcion } = body;

    if (!descripcion) {
      return NextResponse.json(
        {
          success: false,
          error: 'descripcion es requerido',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([{ descripcion }])
      .select();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: data[0],
        message: 'Rol creado exitosamente',
      } as ApiResponse<Roles>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
