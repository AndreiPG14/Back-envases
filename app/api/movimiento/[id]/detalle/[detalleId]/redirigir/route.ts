import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detalleId: string }> }
) {
  try {
    const { detalleId } = await params;
    const { idfundodestino_nuevo } = await request.json();

    if (!idfundodestino_nuevo) {
      return NextResponse.json(
        { success: false, error: 'idfundodestino_nuevo es requerido' },
        { status: 400 }
      );
    }

    const detalle = await queryOne(`SELECT * FROM movimiento_detalle WHERE id = $1`, [detalleId]);

    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle no encontrado' },
        { status: 404 }
      );
    }

    if (detalle.estado !== 'PENDIENTE') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden redirigir detalles con estado PENDIENTE' },
        { status: 400 }
      );
    }

    if (detalle.idfundodestino === idfundodestino_nuevo) {
      return NextResponse.json(
        { success: false, error: 'El nuevo destino debe ser diferente al destino actual' },
        { status: 400 }
      );
    }

    const updated = await queryOne(`
      UPDATE movimiento_detalle SET idfundodestino = $1 WHERE id = $2 RETURNING *
    `, [idfundodestino_nuevo, detalleId]);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Viaje redirigido correctamente',
    } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
