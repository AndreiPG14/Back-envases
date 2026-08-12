import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

// GET /api/merma-salidas — merma ROTO pendiente de salida formal
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('movimiento_detalle')
      .select(`
        id,
        cantidad,
        merma,
        tipo_merma,
        created_at,
        fecha_recepcion,
        observaciones,
        merma_salida_registrada,
        material:idmaterial(id, descripcion, um),
        fundo_destino:idfundodestino(id, descripcion),
        usuario_recepcion:idusuariorecepcion(id, username),
        movimiento:idmovimiento(
          id,
          fecha,
          fundo_origen:idfundoorigen(id, descripcion),
          vehiculo:idvehiculo(id, placa)
        )
      `)
      .eq('tipo_merma', 'ROTO')
      .gt('merma', 0)
      .eq('merma_salida_registrada', false)
      .order('fecha_recepcion', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
