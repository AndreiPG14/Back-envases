import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Roles, ApiResponse } from '@/lib/types';

// GET: Obtener rol por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rol no encontrado',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    } as ApiResponse<Roles>);
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

// PUT: Actualizar rol
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .update({ descripcion })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Rol actualizado exitosamente',
    } as ApiResponse<Roles>);
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

// DELETE: Eliminar rol
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Rol eliminado exitosamente',
    } as ApiResponse<null>);
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
