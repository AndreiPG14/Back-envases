import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const data = await query(`
      SELECT md.id, md.cantidad, md.merma, md.tipo_merma, md.created_at, md.fecha_recepcion, md.observaciones, md.merma_salida_registrada,
        json_build_object('id', mat.id, 'descripcion', mat.descripcion, 'um', mat.um) AS material,
        json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
        json_build_object('id', ur.id, 'username', ur.username) AS usuario_recepcion,
        json_build_object(
          'id', m.id, 'fecha', m.fecha,
          'fundo_origen', json_build_object('id', fo.id, 'descripcion', fo.descripcion),
          'vehiculo', json_build_object('id', v.id, 'placa', v.placa)
        ) AS movimiento
      FROM movimiento_detalle md
      LEFT JOIN materiales mat ON mat.id = md.idmaterial
      LEFT JOIN fundo fd ON fd.id = md.idfundodestino
      LEFT JOIN usuario ur ON ur.id = md.idusuariorecepcion
      LEFT JOIN movimiento m ON m.id = md.idmovimiento
      LEFT JOIN fundo fo ON fo.id = m.idfundoorigen
      LEFT JOIN vehiculo v ON v.id = m.idvehiculo
      WHERE md.tipo_merma = 'ROTO' AND md.merma > 0 AND md.merma_salida_registrada = false
      ORDER BY md.fecha_recepcion DESC
    `);

    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
