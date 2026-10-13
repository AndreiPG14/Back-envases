import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Vehiculo, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarPlaca, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const data = await query('SELECT * FROM vehiculo ORDER BY placa');
    return NextResponse.json({ success: true, data } as ApiResponse<Vehiculo[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['placa']),
      ...validarMaxLength(body, { placa: 20, marca: 100 }),
      ...(body.placa ? validarPlaca(body.placa) : []),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    try {
      const data = await query(
        'INSERT INTO vehiculo (placa, marca) VALUES ($1, $2) RETURNING *',
        [body.placa.toUpperCase(), body.marca ?? null]
      );

      return NextResponse.json({ success: true, data: data[0], message: 'Vehículo creado exitosamente' } as ApiResponse<Vehiculo>, { status: 201 });
    } catch (err: any) {
      if (err.code === '23505') return NextResponse.json({ success: false, error: 'Ya existe un vehículo con esa placa' }, { status: 409 });
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
