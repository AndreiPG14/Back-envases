import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Empresa, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await queryOne('SELECT * FROM empresa WHERE id = $1', [id]);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<Empresa>);
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
    const data = await queryOne(
      'UPDATE empresa SET descripcion = $1 WHERE id = $2 RETURNING *',
      [body.descripcion, id]
    );

    return NextResponse.json({
      success: true,
      data,
      message: 'Empresa actualizada',
    } as ApiResponse<Empresa>);
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
    await query('DELETE FROM empresa WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Empresa eliminada',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
