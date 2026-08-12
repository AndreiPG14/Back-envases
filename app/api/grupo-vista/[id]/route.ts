import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('grupo_vista')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Grupo no encontrado' } as ApiResponse<null>, { status: 404 });

    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.descripcion?.trim()) {
      return NextResponse.json({ success: false, error: 'La descripción es requerida' }, { status: 400 });
    }
    if (!Array.isArray(body.vistas) || body.vistas.length === 0) {
      return NextResponse.json({ success: false, error: 'Debe seleccionar al menos una vista' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('grupo_vista')
      .update({ descripcion: body.descripcion.trim(), vistas: body.vistas })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Grupo actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { count } = await supabase
      .from('usuario')
      .select('id', { count: 'exact', head: true })
      .eq('idgrupo_vista', id);

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: ${count} usuario(s) usan este grupo.`,
      } as ApiResponse<null>, { status: 409 });
    }

    const { error } = await supabase.from('grupo_vista').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Grupo eliminado' } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
