import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const detalle = await queryOne(
      `SELECT id, tipo_merma, merma, merma_salida_registrada FROM movimiento_detalle WHERE id = $1`,
      [id]
    );

    if (!detalle) return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    if (detalle.tipo_merma !== 'ROTO') return NextResponse.json({ success: false, error: 'Solo se pueden registrar salidas de merma ROTO' }, { status: 400 });
    if (detalle.merma_salida_registrada) return NextResponse.json({ success: false, error: 'La salida ya fue registrada' }, { status: 400 });

    const updated = await queryOne(
      `UPDATE movimiento_detalle SET merma_salida_registrada = true WHERE id = $1 RETURNING *`,
      [id]
    );

    return NextResponse.json({ success: true, data: updated, message: 'Salida registrada correctamente' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
