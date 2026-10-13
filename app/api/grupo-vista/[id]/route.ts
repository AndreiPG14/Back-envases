import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await queryOne('SELECT * FROM grupo_vista WHERE id = $1', [id]);

    if (!data) return NextResponse.json({ success: false, error: 'Grupo no encontrado' } as ApiResponse<null>, { status: 404 });

    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.descripcion?.trim()) {
      return NextResponse.json({ success: false, error: 'La descripción es requerida' }, { status: 400 });
    }
    if (!Array.isArray(body.vistas) || body.vistas.length === 0) {
      return NextResponse.json({ success: false, error: 'Debe seleccionar al menos una vista' }, { status: 400 });
    }

    const data = await queryOne(
      'UPDATE grupo_vista SET descripcion = $1, vistas = $2 WHERE id = $3 RETURNING *',
      [body.descripcion.trim(), JSON.stringify(body.vistas), id]
    );

    return NextResponse.json({ success: true, data, message: 'Grupo actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await queryOne(
      'SELECT COUNT(*)::int AS count FROM usuario WHERE idgrupo_vista = $1',
      [id]
    );

    if (result && result.count > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: ${result.count} usuario(s) usan este grupo.`,
      } as ApiResponse<null>, { status: 409 });
    }

    await query('DELETE FROM grupo_vista WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Grupo eliminado' } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
