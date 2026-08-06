import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

// GET /api/transito — movimiento_detalle con estado=PENDIENTE (en tránsito)
export async function GET() {
  try {
    // Todos los traslados (tienen idfundodestino), sin importar estado
    const { data, error } = await supabase
      .from('movimiento_detalle')
      .select(`
        id,
        cantidad,
        estado,
        created_at,
        fecha_recepcion,
        tipo,
        cantidad_confirmada,
        merma,
        observaciones,
        material:idmaterial(id, descripcion),
        fundo_destino:idfundodestino(id, descripcion),
        usuario_recepcion:idusuariorecepcion(id, username),
        movimiento:idmovimiento(
          id,
          fundo_origen:idfundoorigen(id, descripcion),
          vehiculo:idvehiculo(id, placa),
          usuario:idusuarioorigen(id, username)
        )
      `)
      .not('idfundodestino', 'is', null)
      .order('created_at', { ascending: true });
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
