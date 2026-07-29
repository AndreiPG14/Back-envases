import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detalleId: string }> }
) {
  try {
    const { detalleId } = await params;
    const { idfundodestino_nuevo } = await request.json();

    if (!idfundodestino_nuevo) {
      return NextResponse.json(
        { success: false, error: 'idfundodestino_nuevo es requerido' },
        { status: 400 }
      );
    }

    const { data: detalle, error: fetchErr } = await supabase
      .from('movimiento_detalle')
      .select('*')
      .eq('id', detalleId)
      .single();

    if (fetchErr || !detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      );
    }

    if (detalle.estado !== 'PENDIENTE') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden redirigir detalles con estado PENDIENTE' },
        { status: 400 }
      );
    }

    if (detalle.idfundodestino === idfundodestino_nuevo) {
      return NextResponse.json(
        { success: false, error: 'El nuevo destino debe ser diferente al destino actual' },
        { status: 400 }
      );
    }

    const { data: updated, error: updErr } = await supabase
      .from('movimiento_detalle')
      .update({ idfundodestino: idfundodestino_nuevo })
      .eq('id', detalleId)
      .select()
      .single();

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Viaje redirigido correctamente',
    } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
