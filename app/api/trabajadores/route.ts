import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .order('apellido_paterno', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    } as ApiResponse<Trabajadores[]>);
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
    const { dni, nombres, apellido_paterno, apellido_materno, ...rest } = body;

    if (!dni || !nombres) {
      return NextResponse.json(
        { success: false, error: 'dni y nombres son requeridos' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Remover campos que no deben ser insertados
    const { id, created_at, ...safeData } = {
      dni,
      nombres,
      apellido_paterno,
      apellido_materno,
      ...rest
    };

    const { data, error } = await supabase
      .from('trabajadores')
      .upsert([safeData], { onConflict: 'dni' })
      .select();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: data[0],
        message: 'Trabajador creado/actualizado exitosamente',
      } as ApiResponse<Trabajadores>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
