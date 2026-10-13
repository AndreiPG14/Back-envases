import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion', 'idempresa']),
      ...validarMaxLength(body, { descripcion: 150 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const empresa = await queryOne('SELECT id FROM empresa WHERE id = $1', [body.idempresa]);
    if (!empresa) return NextResponse.json({ success: false, error: 'La empresa no existe' }, { status: 404 });

    if (await verificarDuplicado('fundo', 'descripcion', body.descripcion, Number(id))) {
      return NextResponse.json({ success: false, error: 'Ya existe un fundo con esa descripción' }, { status: 409 });
    }

    const data = await queryOne(
      `UPDATE fundo SET descripcion = $1, idempresa = $2 WHERE id = $3 RETURNING *`,
      [body.descripcion, body.idempresa, id]
    );

    const result = await queryOne(
      `SELECT f.*, json_build_object('id', e.id, 'descripcion', e.descripcion) AS empresa
       FROM fundo f
       LEFT JOIN empresa e ON e.id = f.idempresa
       WHERE f.id = $1`,
      [id]
    );

    return NextResponse.json({ success: true, data: result, message: 'Fundo actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM fundo WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Fundo eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
