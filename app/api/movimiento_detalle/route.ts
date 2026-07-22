import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado         = searchParams.get('estado');
    const idfundodestino = searchParams.get('idfundodestino');
    const idmovimiento   = searchParams.get('idmovimiento');
    const conMerma       = searchParams.get('conMerma');

    let query = supabase
      .from('movimiento_detalle')
      .select(`
        *,
        material:idmaterial(id, descripcion, um),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion),
        movimiento:idmovimiento(
          id, fecha, precinto, observaciones,
          vehiculo:idvehiculo(id, placa, marca),
          fundo_origen:idfundoorigen(id, descripcion),
          usuario_origen:idusuarioorigen(id, username)
        )
      `)
      .order('id', { ascending: false });

    if (estado)           query = query.eq('estado', estado);
    if (idfundodestino)   query = query.eq('idfundodestino', idfundodestino);
    if (idmovimiento)     query = query.eq('idmovimiento', idmovimiento);
    if (conMerma === '1') query = query.gt('merma', 0);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
