import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Movimiento, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await queryOne(`
      SELECT m.*,
        json_build_object('id', uo.id, 'grupo', uo.grupo, 'trabajadores', (SELECT json_build_object('nombres', t.nombres, 'dni', t.dni) FROM trabajadores t WHERE t.id = uo.id)) AS usuario_origen,
        json_build_object('id', ud.id, 'grupo', ud.grupo, 'trabajadores', (SELECT json_build_object('nombres', t.nombres, 'dni', t.dni) FROM trabajadores t WHERE t.id = ud.id)) AS usuario_destino,
        json_build_object('id', mat.id, 'descripcion', mat.descripcion, 'stock', mat.stock) AS material,
        json_build_object('id', v.id, 'placa', v.placa, 'marca', v.marca) AS vehiculo,
        json_build_object('id', fo.id, 'descripcion', fo.descripcion) AS fundo_origen,
        json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
        json_build_object('id', op.id, 'descripcion', op.descripcion) AS operacion
      FROM movimiento m
      LEFT JOIN usuario uo ON uo.id = m.idusuarioorigen
      LEFT JOIN usuario ud ON ud.id = m.idusuariodestino
      LEFT JOIN materiales mat ON mat.id = m.idmaterial
      LEFT JOIN vehiculo v ON v.id = m.idvehiculo
      LEFT JOIN fundo fo ON fo.id = m.idfundoorigen
      LEFT JOIN fundo fd ON fd.id = m.idfundodestino
      LEFT JOIN operacion op ON op.id = m.idoperacion
      WHERE m.id = $1
    `, [id]);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields: Record<string, any> = {
      observaciones: body.observaciones,
      precinto:      body.precinto,
    };

    const ESTADOS_VALIDOS = ['PENDIENTE', 'COMPLETO', 'INCOMPLETO'];
    if (body.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.estado)) {
        return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
      }
      allowedFields.estado = body.estado;
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(allowedFields)) {
      if (val !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    values.push(id);

    const data = await queryOne(`
      UPDATE movimiento SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *
    `, values);

    return NextResponse.json({
      success: true,
      data,
      message: 'Movimiento actualizado',
    } as ApiResponse<Movimiento>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM movimiento_detalle WHERE idmovimiento = $1`,
      [id]
    );

    if (parseInt(countResult?.count ?? '0') > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar: el movimiento ya tiene detalles registrados' },
        { status: 409 }
      );
    }

    await query(`DELETE FROM movimiento WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Cabecera eliminada' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
