import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Roles, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    const data = await queryOne('SELECT * FROM roles WHERE id = $1', [id]);
    if (!data) return NextResponse.json({ success: false, error: 'Rol no encontrado' }, { status: 404 });

    return NextResponse.json({ success: true, data } as ApiResponse<Roles>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 100 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const data = await queryOne('UPDATE roles SET descripcion = $1 WHERE id = $2 RETURNING *', [body.descripcion, id]);

    return NextResponse.json({ success: true, data, message: 'Rol actualizado exitosamente' } as ApiResponse<Roles>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    await query('DELETE FROM roles WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Rol eliminado exitosamente' } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
