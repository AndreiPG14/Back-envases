import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado          = searchParams.get('estado');
    const idfundodestino  = searchParams.get('idfundodestino');
    const idfundoorigen   = searchParams.get('idfundoorigen');
    const idmovimiento    = searchParams.get('idmovimiento');
    const conMerma        = searchParams.get('conMerma');

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (estado)           { conditions.push(`md.estado = $${idx++}`); params.push(estado); }
    if (idfundodestino)   { conditions.push(`md.idfundodestino = $${idx++}`); params.push(idfundodestino); }
    if (idmovimiento)     { conditions.push(`md.idmovimiento = $${idx++}`); params.push(idmovimiento); }
    if (conMerma === '1') { conditions.push(`md.merma > 0`); }

    if (idfundoorigen) {
      const movs = await query(`SELECT id FROM movimiento WHERE idfundoorigen = $1`, [idfundoorigen]);
      const movIds = movs.map((m: any) => m.id);
      if (movIds.length === 0) {
        return NextResponse.json({ success: true, data: [] } as ApiResponse<any[]>);
      }
      conditions.push(`md.idmovimiento = ANY($${idx++})`);
      params.push(movIds);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const data = await query(`
      SELECT md.*,
        json_build_object('id', mat.id, 'descripcion', mat.descripcion, 'um', mat.um) AS material,
        json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
        json_build_object('id', op.id, 'descripcion', op.descripcion) AS operacion,
        json_build_object(
          'id', m.id, 'fecha', m.fecha, 'precinto', m.precinto, 'observaciones', m.observaciones, 'foto_url', m.foto_url,
          'vehiculo', json_build_object('id', v.id, 'placa', v.placa, 'marca', v.marca),
          'fundo_origen', json_build_object('id', fo.id, 'descripcion', fo.descripcion),
          'usuario_origen', json_build_object('id', uo.id, 'username', uo.username)
        ) AS movimiento
      FROM movimiento_detalle md
      LEFT JOIN materiales mat ON mat.id = md.idmaterial
      LEFT JOIN fundo fd ON fd.id = md.idfundodestino
      LEFT JOIN operacion op ON op.id = md.idoperacion
      LEFT JOIN movimiento m ON m.id = md.idmovimiento
      LEFT JOIN vehiculo v ON v.id = m.idvehiculo
      LEFT JOIN fundo fo ON fo.id = m.idfundoorigen
      LEFT JOIN usuario uo ON uo.id = m.idusuarioorigen
      ${where}
      ORDER BY md.id DESC
    `, params);

    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
