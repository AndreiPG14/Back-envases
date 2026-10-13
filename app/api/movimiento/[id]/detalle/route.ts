import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await query(`
      SELECT md.*,
        json_build_object('id', mat.id, 'descripcion', mat.descripcion, 'um', mat.um) AS material,
        json_build_object('id', fd.id, 'descripcion', fd.descripcion) AS fundo_destino,
        json_build_object('id', op.id, 'descripcion', op.descripcion) AS operacion
      FROM movimiento_detalle md
      LEFT JOIN materiales mat ON mat.id = md.idmaterial
      LEFT JOIN fundo fd ON fd.id = md.idfundodestino
      LEFT JOIN operacion op ON op.id = md.idoperacion
      WHERE md.idmovimiento = $1
      ORDER BY md.id
    `, [id]);

    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { idmaterial, idfundoorigen, idoperacion, cantidad } = body;
    if (!idmaterial || !idfundoorigen || !idoperacion || !cantidad) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos: idmaterial, idfundoorigen, idoperacion, cantidad' }, { status: 400 });
    }

    const operacion = await queryOne(`SELECT id, descripcion FROM operacion WHERE id = $1`, [idoperacion]);
    if (!operacion) return NextResponse.json({ success: false, error: 'Operacion no existe' }, { status: 404 });

    const tipoOp = operacion.descripcion?.toUpperCase();
    const cant   = Number(cantidad);

    if (tipoOp === 'TRASLADO') {
      if (!body.idfundodestino) return NextResponse.json({ success: false, error: 'TRASLADO requiere ubicacion destino' }, { status: 400 });
      if (body.idfundodestino === idfundoorigen) return NextResponse.json({ success: false, error: 'Origen y destino no pueden ser iguales' }, { status: 400 });
    }

    const sfOrigen = await queryOne(`SELECT stock FROM stock_fundo WHERE idmaterial = $1 AND idfundo = $2`, [idmaterial, idfundoorigen]);
    const stockOrigen = sfOrigen?.stock ?? 0;
    if (stockOrigen < cant) {
      return NextResponse.json({
        success: false,
        error: `Stock insuficiente. Disponible: ${stockOrigen}, solicitado: ${cant}`,
      }, { status: 400 });
    }

    await query(`
      INSERT INTO stock_fundo (idmaterial, idfundo, stock)
      VALUES ($1, $2, $3)
      ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = stock_fundo.stock - $4
    `, [idmaterial, idfundoorigen, stockOrigen - cant, cant]);

    const detalle = await queryOne(`
      INSERT INTO movimiento_detalle (idmovimiento, idmaterial, cantidad, idfundodestino, idoperacion, estado, cantidad_confirmada, merma)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      Number(id),
      idmaterial,
      cant,
      body.idfundodestino ?? null,
      idoperacion,
      tipoOp === 'TRASLADO' ? 'PENDIENTE' : 'COMPLETO',
      tipoOp === 'TRASLADO' ? null : cant,
      0,
    ]);

    return NextResponse.json({ success: true, data: detalle, message: `Detalle (${tipoOp}) agregado` } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
