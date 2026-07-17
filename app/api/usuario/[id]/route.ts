import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: usuario, error } = await supabase.from('usuario').select('*').eq('id', id).single();

    if (error) throw error;
    if (!usuario) return NextResponse.json({ success: false, error: 'Usuario no encontrado' } as ApiResponse<null>, { status: 404 });

    const [{ data: rol }, { data: trabajador }] = await Promise.all([
      supabase.from('roles').select('id, descripcion').eq('id', usuario.rolid).single(),
      supabase.from('trabajadores').select('dni, nombres, apellido_paterno, apellido_materno').eq('dni', usuario.trabajadorid).single(),
    ]);

    return NextResponse.json({ success: true, data: { ...usuario, rol, trabajador } } as ApiResponse<any>);
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

    const { data: updated, error } = await supabase.from('usuario').update(body).eq('id', id).select('*').single();
    if (error) throw error;

    const [{ data: rol }, { data: trabajador }] = await Promise.all([
      supabase.from('roles').select('id, descripcion').eq('id', updated.rolid).single(),
      supabase.from('trabajadores').select('dni, nombres, apellido_paterno, apellido_materno').eq('dni', updated.trabajadorid).single(),
    ]);

    return NextResponse.json({ success: true, data: { ...updated, rol, trabajador }, message: 'Usuario actualizado' } as ApiResponse<any>);
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

    // Verificar si tiene movimientos asociados
    const { count } = await supabase
      .from('movimiento')
      .select('id', { count: 'exact', head: true })
      .or(`idusuarioorigen.eq.${id},idusuariodestino.eq.${id}`);

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: el usuario tiene ${count} movimiento(s) registrado(s). Desactívalo en su lugar.`,
      } as ApiResponse<null>, { status: 409 });
    }

    const { error } = await supabase.from('usuario').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Usuario eliminado' } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
