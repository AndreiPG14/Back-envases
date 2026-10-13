import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { estado, cantidad_confirmada, observaciones } = body;

    const ESTADOS = ['PENDIENTE', 'COMPLETO', 'INCOMPLETO'];
    if (estado && !ESTADOS.includes(estado)) {
      return NextResponse.json({ success: false, error: 'Estado invalido' }, { status: 400 });
    }

    const detalle = await queryOne(
      `SELECT cantidad, idfundodestino, idmaterial, cantidad_confirmada FROM movimiento_detalle WHERE id = $1`,
      [id]
    );

    if (!detalle) {
      return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (estado) updates.estado = estado;
    if (observaciones !== undefined) updates.observaciones = observaciones;

    if (estado === 'PENDIENTE') {
      if (detalle.idfundodestino && detalle.idmaterial) {
        const prevConf = Number(detalle.cantidad_confirmada ?? 0);
        if (prevConf > 0) {
          const sf = await queryOne(
            `SELECT stock FROM stock_fundo WHERE idmaterial = $1 AND idfundo = $2`,
            [detalle.idmaterial, detalle.idfundodestino]
          );
          const newStock = Math.max(0, (sf?.stock ?? 0) - prevConf);
          await query(`
            INSERT INTO stock_fundo (idmaterial, idfundo, stock)
            VALUES ($1, $2, $3)
            ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = $3
          `, [detalle.idmaterial, detalle.idfundodestino, newStock]);
        }
      }
      updates.cantidad_confirmada = null;
      updates.merma = null;
    } else if (estado === 'COMPLETO') {
      updates.cantidad_confirmada = detalle.cantidad;
      updates.merma = 0;

      if (detalle.idfundodestino && detalle.idmaterial) {
        const prevConf = Number(detalle.cantidad_confirmada ?? 0);
        const diff = Number(detalle.cantidad) - prevConf;
        if (diff !== 0) {
          const sf = await queryOne(
            `SELECT stock FROM stock_fundo WHERE idmaterial = $1 AND idfundo = $2`,
            [detalle.idmaterial, detalle.idfundodestino]
          );
          const stockActual = Math.max(0, (sf?.stock ?? 0) + diff);
          await query(`
            INSERT INTO stock_fundo (idmaterial, idfundo, stock)
            VALUES ($1, $2, $3)
            ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = $3
          `, [detalle.idmaterial, detalle.idfundodestino, stockActual]);
        }
      }
    } else if (estado === 'INCOMPLETO') {
      if (cantidad_confirmada === undefined || cantidad_confirmada === null) {
        return NextResponse.json({ success: false, error: 'cantidad_confirmada es requerida para estado INCOMPLETO' }, { status: 400 });
      }
      const cantConf = Number(cantidad_confirmada);
      if (cantConf < 0 || cantConf >= Number(detalle.cantidad)) {
        return NextResponse.json({ success: false, error: `La cantidad confirmada debe ser menor a ${detalle.cantidad}` }, { status: 400 });
      }
      updates.cantidad_confirmada = cantConf;
      updates.merma = Number(detalle.cantidad) - cantConf;

      if (detalle.idfundodestino && detalle.idmaterial) {
        const prevConf = Number(detalle.cantidad_confirmada ?? 0);
        const diff = cantConf - prevConf;
        if (diff !== 0) {
          const sf = await queryOne(
            `SELECT stock FROM stock_fundo WHERE idmaterial = $1 AND idfundo = $2`,
            [detalle.idmaterial, detalle.idfundodestino]
          );
          const stockActual = Math.max(0, (sf?.stock ?? 0) + diff);
          await query(`
            INSERT INTO stock_fundo (idmaterial, idfundo, stock)
            VALUES ($1, $2, $3)
            ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = $3
          `, [detalle.idmaterial, detalle.idfundodestino, stockActual]);
        }
      }
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(updates)) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(val);
    }
    values.push(id);

    const updated = await queryOne(`
      UPDATE movimiento_detalle SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *
    `, values);

    let data = updated;
    if (updated) {
      const enriched = await queryOne(`
        SELECT md.*,
          json_build_object('id', mat.id, 'descripcion', mat.descripcion, 'um', mat.um) AS material,
          json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
          json_build_object('id', op.id, 'descripcion', op.descripcion) AS operacion
        FROM movimiento_detalle md
        LEFT JOIN materiales mat ON mat.id = md.idmaterial
        LEFT JOIN fundo fd ON fd.id = md.idfundodestino
        LEFT JOIN operacion op ON op.id = md.idoperacion
        WHERE md.id = $1
      `, [id]);
      data = enriched;
    }

    return NextResponse.json({ success: true, data, message: 'Detalle actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
