import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dni: string }> }
) {
  try {
    const { dni } = await params;

    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('dni', dni)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Trabajador no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    } as ApiResponse<Trabajadores>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dni: string }> }
) {
  try {
    const { dni } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('trabajadores')
      .update(body)
      .eq('dni', dni)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Trabajador actualizado exitosamente',
    } as ApiResponse<Trabajadores>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dni: string }> }
) {
  try {
    const { dni } = await params;

    // Marcar como eliminado (soft delete)
    const { data, error } = await supabase
      .from('trabajadores')
      .update({ eliminado: true })
      .eq('dni', dni)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Trabajador marcado como eliminado',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
