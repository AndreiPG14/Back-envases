import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cantidad_confirmada, idusuario_destino } = body;

    if (cantidad_confirmada === undefined || cantidad_confirmada === null) {
      return NextResponse.json({ success: false, error: 'cantidad_confirmada es requerida' }, { status: 400 });
    }
    if (Number(cantidad_confirmada) < 0) {
      return NextResponse.json({ success: false, error: 'La cantidad confirmada no puede ser negativa' }, { status: 400 });
    }

    const mov = await queryOne(`
      SELECT m.*, op.descripcion AS operacion_descripcion
      FROM movimiento m
      LEFT JOIN operacion op ON op.id = m.idoperacion
      WHERE m.id = $1
    `, [id]);

    if (!mov) {
      return NextResponse.json({ success: false, error: 'Movimiento no encontrado' }, { status: 404 });
    }
    if (mov.estado !== 'PENDIENTE') {
      return NextResponse.json({ success: false, error: 'Este movimiento ya fue confirmado' }, { status: 409 });
    }
    if (mov.operacion_descripcion?.toUpperCase() !== 'TRASLADO') {
      return NextResponse.json({ success: false, error: 'Solo se pueden confirmar traslados' }, { status: 400 });
    }
    if (Number(cantidad_confirmada) > Number(mov.cantidad)) {
      return NextResponse.json({
        success: false,
        error: `La cantidad confirmada (${cantidad_confirmada}) no puede superar la enviada (${mov.cantidad})`,
      }, { status: 400 });
    }

    const cantConfirmada = Number(cantidad_confirmada);
    const merma = Number(mov.cantidad) - cantConfirmada;
    const estado = merma === 0 ? 'COMPLETO' : 'INCOMPLETO';

    if (cantConfirmada > 0) {
      await query(`
        INSERT INTO stock_fundo (idmaterial, idfundo, stock)
        VALUES ($1, $2, $3)
        ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = stock_fundo.stock + $3
      `, [mov.idmaterial, mov.idfundodestino, cantConfirmada]);
    }

    const setClauses = [
      'estado = $1',
      'cantidad_confirmada = $2',
      'merma = $3',
    ];
    const values: any[] = [estado, cantConfirmada, merma];
    let idx = 4;
    if (idusuario_destino) {
      setClauses.push(`idusuariodestino = $${idx++}`);
      values.push(idusuario_destino);
    }
    values.push(id);

    const updated = await queryOne(`
      UPDATE movimiento SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *
    `, values);

    return NextResponse.json({
      success: true,
      data: updated,
      message: merma > 0
        ? `Confirmado con merma de ${merma} unidades`
        : 'Traslado confirmado correctamente',
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('POST confirmar error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
