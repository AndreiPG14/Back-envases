import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dni: string }> }
) {
  try {
    const { dni } = await params;

    const data = await queryOne('SELECT * FROM trabajadores WHERE dni = $1', [dni]);

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
  { params }: { params: Promise<{ dni: string }> }
) {
  try {
    const { dni } = await params;
    const body = await request.json();

    const fields = Object.keys(body);
    const values = Object.values(body);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');

    const data = await queryOne(
      `UPDATE trabajadores SET ${setClause} WHERE dni = $${fields.length + 1} RETURNING *`,
      [...values, dni]
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
  { params }: { params: Promise<{ dni: string }> }
) {
  try {
    const { dni } = await params;

    await query('UPDATE trabajadores SET eliminado = true WHERE dni = $1', [dni]);

    return NextResponse.json({
      success: true,
      message: 'Trabajador marcado como eliminado',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
