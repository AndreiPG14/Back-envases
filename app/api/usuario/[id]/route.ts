import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Usuario, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('usuario')
      .select('*, trabajadores(id, dni, nombres, apellido_paterno, apellido_materno), roles(id, descripcion)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('usuario')
      .update(body)
      .eq('id', id)
      .select('*, trabajadores(id, dni, nombres), roles(id, descripcion)')
      .single();

    if (error) throw error;
    return NextResponse.json({
      success: true,
      data,
      message: 'Usuario actualizado',
    } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('usuario').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
