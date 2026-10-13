import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await queryOne('SELECT * FROM trabajadores WHERE id = $1', [id]);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Trabajador no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    } as ApiResponse<Trabajadores>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const keys = Object.keys(body);
    const values = Object.values(body);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const data = await queryOne(
      `UPDATE trabajadores SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );

    return NextResponse.json({
      success: true,
      data,
      message: 'Trabajador actualizado exitosamente',
    } as ApiResponse<Trabajadores>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query('DELETE FROM trabajadores WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Trabajador eliminado exitosamente',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
