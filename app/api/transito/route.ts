import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const data = await query(
      `SELECT md.id,
              md.cantidad,
              md.estado,
              md.created_at,
              md.fecha_recepcion,
              md.tipo,
              md.cantidad_confirmada,
              md.merma,
              md.observaciones,
              json_build_object('id', mat.id, 'descripcion', mat.descripcion) AS material,
              json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
              json_build_object('id', ur.id, 'username', ur.username) AS usuario_recepcion,
              json_build_object(
                'id', mov.id,
                'fundo_origen', json_build_object('id', fo.id, 'descripcion', fo.descripcion),
                'vehiculo', json_build_object('id', v.id, 'placa', v.placa),
                'usuario', json_build_object('id', uo.id, 'username', uo.username)
              ) AS movimiento
       FROM movimiento_detalle md
       LEFT JOIN materiales mat ON mat.id = md.idmaterial
       LEFT JOIN fundo fd ON fd.id = md.idfundodestino
       LEFT JOIN usuario ur ON ur.id = md.idusuariorecepcion
       LEFT JOIN movimiento mov ON mov.id = md.idmovimiento
       LEFT JOIN fundo fo ON fo.id = mov.idfundoorigen
       LEFT JOIN vehiculo v ON v.id = mov.idvehiculo
       LEFT JOIN usuario uo ON uo.id = mov.idusuarioorigen
       WHERE md.idfundodestino IS NOT NULL
       ORDER BY md.created_at ASC`
    );
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
