import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMovimiento = Number(id);
    const body = await request.json();
    const detalles: any[] = body.detalles ?? [];

    if (detalles.length === 0)
      return NextResponse.json({ success: false, error: 'Sin detalles' }, { status: 400 });

    const idOps = [...new Set(detalles.map((d) => d.idoperacion))];
    const operaciones = await query(`SELECT id, descripcion FROM operacion WHERE id = ANY($1)`, [idOps]);
    const opMap = Object.fromEntries(operaciones.map((o) => [o.id, o.descripcion?.toUpperCase()]));

    const creados: any[] = [];

    for (const d of detalles) {
      const { idmaterial, idfundoorigen, idoperacion, cantidad, idfundodestino, tipo } = d;
      if (!idmaterial || !idfundoorigen || !idoperacion || !cantidad)
        return NextResponse.json({ success: false, error: 'Faltan campos requeridos en un detalle' }, { status: 400 });

      const tipoOp = opMap[idoperacion] ?? '';
      const cant   = Number(cantidad);

      if (tipoOp === 'TRASLADO') {
        if (!idfundodestino)
          return NextResponse.json({ success: false, error: 'TRASLADO requiere ubicacion destino' }, { status: 400 });
        if (idfundodestino === idfundoorigen)
          return NextResponse.json({ success: false, error: 'Origen y destino no pueden ser iguales' }, { status: 400 });
      }

      const mat = await queryOne(`SELECT descripcion FROM material WHERE id = $1`, [idmaterial]);
      const matNombre = mat?.descripcion ?? `#${idmaterial}`;
      const sf = await queryOne(`SELECT stock FROM stock_fundo WHERE idmaterial = $1 AND idfundo = $2`, [idmaterial, idfundoorigen]);
      const stock = sf?.stock ?? 0;
      if (stock < cant)
        return NextResponse.json({
          success: false,
          error: `Stock insuficiente para "${matNombre}". Disponible: ${stock}, solicitado: ${cant}`,
        }, { status: 400 });

      await query(`
        INSERT INTO stock_fundo (idmaterial, idfundo, stock)
        VALUES ($1, $2, $3)
        ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = stock_fundo.stock - $4
      `, [idmaterial, idfundoorigen, stock - cant, cant]);

      const detalle = await queryOne(`
        INSERT INTO movimiento_detalle (idmovimiento, idmaterial, cantidad, idfundodestino, idoperacion, tipo, estado, cantidad_confirmada, merma)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        idMovimiento,
        idmaterial,
        cant,
        idfundodestino ?? null,
        idoperacion,
        tipo ?? null,
        tipoOp === 'TRASLADO' ? 'PENDIENTE' : 'COMPLETO',
        tipoOp === 'TRASLADO' ? null : cant,
        0,
      ]);

      creados.push(detalle);
    }

    return NextResponse.json({ success: true, data: creados, message: `${creados.length} detalle(s) creados` } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
