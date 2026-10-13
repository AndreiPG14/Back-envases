import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detalleId: string }> }
) {
  try {
    const { detalleId } = await params;
    const { cantidad_confirmada, observaciones, idusuario, tipo_merma } = await request.json();

    if (cantidad_confirmada === undefined || cantidad_confirmada === null) {
      return NextResponse.json({ success: false, error: 'cantidad_confirmada es requerida' }, { status: 400 });
    }

    const detalle = await queryOne(`SELECT * FROM movimiento_detalle WHERE id = $1`, [detalleId]);

    if (!detalle) return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    if (detalle.estado !== 'PENDIENTE') return NextResponse.json({ success: false, error: 'Este detalle ya fue confirmado' }, { status: 400 });

    const cantConf = Number(cantidad_confirmada);
    const merma    = Number(detalle.cantidad) - cantConf;
    const estado   = merma > 0 ? 'INCOMPLETO' : 'COMPLETO';

    await query(`
      INSERT INTO stock_fundo (idmaterial, idfundo, stock)
      VALUES ($1, $2, $3)
      ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = stock_fundo.stock + $3
    `, [detalle.idmaterial, detalle.idfundodestino, cantConf]);

    const setClauses = [
      'estado = $1',
      'cantidad_confirmada = $2',
      'merma = $3',
      'fecha_recepcion = $4',
    ];
    const values: any[] = [estado, cantConf, merma, new Date().toISOString()];
    let idx = 5;

    if (observaciones) { setClauses.push(`observaciones = $${idx++}`); values.push(observaciones); }
    if (idusuario) { setClauses.push(`idusuariorecepcion = $${idx++}`); values.push(Number(idusuario)); }
    if (merma > 0 && tipo_merma) { setClauses.push(`tipo_merma = $${idx++}`); values.push(tipo_merma); }
    else { setClauses.push(`tipo_merma = $${idx++}`); values.push(null); }

    values.push(detalleId);
    const updated = await queryOne(`
      UPDATE movimiento_detalle SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *
    `, values);

    return NextResponse.json({ success: true, data: updated, message: `Confirmado. Merma: ${merma}` } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
