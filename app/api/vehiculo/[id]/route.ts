import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Vehiculo, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await queryOne('SELECT * FROM vehiculo WHERE id = $1', [id]);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Vehículo no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<Vehiculo>);
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
      'UPDATE vehiculo SET placa = $1, marca = $2 WHERE id = $3 RETURNING *',
      [body.placa, body.marca, id]
    );

    return NextResponse.json({
      success: true,
      data,
      message: 'Vehículo actualizado exitosamente',
    } as ApiResponse<Vehiculo>);
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
    await query('DELETE FROM vehiculo WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Vehículo eliminado exitosamente',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
