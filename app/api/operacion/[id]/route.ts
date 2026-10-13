import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 100 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (await verificarDuplicado('operacion', 'descripcion', body.descripcion, Number(id))) {
      return NextResponse.json({ success: false, error: 'Ya existe una operación con esa descripción' }, { status: 409 });
    }

    const data = await queryOne(
      'UPDATE operacion SET descripcion = $1 WHERE id = $2 RETURNING *',
      [body.descripcion, id]
    );

    return NextResponse.json({ success: true, data, message: 'Operación actualizada' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM operacion WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Operación eliminada' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
