import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.descripcion?.trim())
      return NextResponse.json({ success: false, error: 'La descripción es requerida' }, { status: 400 });

    const existe = await queryOne(
      'SELECT id FROM tipo_material WHERE descripcion ILIKE $1 AND id != $2', [body.descripcion.trim(), id]
    );
    if (existe)
      return NextResponse.json({ success: false, error: 'Ya existe un tipo con esa descripción' }, { status: 409 });

    const data = await queryOne(
      'UPDATE tipo_material SET descripcion = $1, cod = $2 WHERE id = $3 RETURNING *',
      [body.descripcion.trim(), body.cod?.trim() || null, id]
    );
    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM tipo_material WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Tipo eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
