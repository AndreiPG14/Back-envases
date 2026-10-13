import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuario = await queryOne('SELECT * FROM usuario WHERE id = $1', [id]);

    if (!usuario) return NextResponse.json({ success: false, error: 'Usuario no encontrado' } as ApiResponse<null>, { status: 404 });

    const [rol, trabajador] = await Promise.all([
      queryOne('SELECT id, descripcion FROM roles WHERE id = $1', [usuario.rolid]),
      queryOne('SELECT dni, nombres, apellido_paterno, apellido_materno FROM trabajadores WHERE dni = $1', [usuario.trabajadorid]),
    ]);

    return NextResponse.json({ success: true, data: { ...usuario, rol, trabajador } } as ApiResponse<any>);
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

    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password;
    }

    const keys = Object.keys(body);
    const values = Object.values(body);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const updated = await queryOne(
      `UPDATE usuario SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    const [rol, trabajador] = await Promise.all([
      queryOne('SELECT id, descripcion FROM roles WHERE id = $1', [updated.rolid]),
      queryOne('SELECT dni, nombres, apellido_paterno, apellido_materno FROM trabajadores WHERE dni = $1', [updated.trabajadorid]),
    ]);

    return NextResponse.json({ success: true, data: { ...updated, rol, trabajador }, message: 'Usuario actualizado' } as ApiResponse<any>);
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

    const [movResult, ingresoResult, detalleResult] = await Promise.all([
      queryOne<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM movimiento WHERE idusuarioorigen = $1 OR idusuariodestino = $1', [id]
      ),
      queryOne<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM ingreso WHERE idusuario = $1', [id]
      ),
      queryOne<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM movimiento_detalle WHERE idusuariorecepcion = $1', [id]
      ),
    ]);

    const movCount = movResult?.count ?? 0;
    const ingresoCount = ingresoResult?.count ?? 0;
    const detalleCount = detalleResult?.count ?? 0;

    const total = movCount + ingresoCount + detalleCount;
    if (total > 0) {
      const partes: string[] = [];
      if (movCount)     partes.push(`${movCount} movimiento(s)`);
      if (ingresoCount) partes.push(`${ingresoCount} ingreso(s)`);
      if (detalleCount) partes.push(`${detalleCount} recepción(es)`);
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: el usuario tiene ${partes.join(', ')}. Desactívalo en su lugar.`,
      } as ApiResponse<null>, { status: 409 });
    }

    await query('DELETE FROM usuario WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Usuario eliminado' } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
