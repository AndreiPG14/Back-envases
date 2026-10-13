import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin    = searchParams.get('fecha_fin');
    const idfundo      = searchParams.get('idfundo');

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (fecha_inicio) { conditions.push(`m.fecha >= $${idx++}`); params.push(fecha_inicio); }
    if (fecha_fin)    { conditions.push(`m.fecha <= $${idx++}`); params.push(fecha_fin); }
    if (idfundo)      { conditions.push(`m.idfundoorigen = $${idx++}`); params.push(idfundo); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(`
      SELECT m.*,
        json_build_object('id', v.id, 'placa', v.placa, 'marca', v.marca) AS vehiculo,
        json_build_object('id', fo.id, 'descripcion', fo.descripcion) AS fundo_origen,
        json_build_object('id', uo.id, 'username', uo.username) AS usuario_origen
      FROM movimiento m
      LEFT JOIN vehiculo v ON v.id = m.idvehiculo
      LEFT JOIN fundo fo ON fo.id = m.idfundoorigen
      LEFT JOIN usuario uo ON uo.id = m.idusuarioorigen
      ${where}
      ORDER BY m.fecha DESC
    `, params);

    for (const row of rows) {
      const detalles = await query(`
        SELECT md.*,
          json_build_object('id', mat.id, 'descripcion', mat.descripcion, 'um', mat.um) AS material,
          json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
          json_build_object('id', op.id, 'descripcion', op.descripcion) AS operacion
        FROM movimiento_detalle md
        LEFT JOIN materiales mat ON mat.id = md.idmaterial
        LEFT JOIN fundo fd ON fd.id = md.idfundodestino
        LEFT JOIN operacion op ON op.id = md.idoperacion
        WHERE md.idmovimiento = $1
      `, [row.id]);
      row.movimiento_detalle = detalles;
    }

    return NextResponse.json({ success: true, data: rows } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = validarRequeridos(body, ['fecha', 'idusuarioorigen', 'idfundoorigen']);
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (body.precinto) {
      const existe = await queryOne(
        `SELECT id FROM movimiento WHERE precinto = $1`,
        [body.precinto]
      );
      if (existe) return NextResponse.json(
        { success: false, error: `El precinto "${body.precinto}" ya fue registrado (mov #${existe.id})` },
        { status: 409 }
      );
    }

    const data = await queryOne(`
      INSERT INTO movimiento (fecha, idusuarioorigen, idvehiculo, idfundoorigen, precinto, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      body.fecha,
      body.idusuarioorigen,
      body.idvehiculo ?? null,
      body.idfundoorigen,
      body.precinto ?? null,
      body.observaciones ?? null,
    ]);

    return NextResponse.json({ success: true, data, message: 'Movimiento creado' } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
