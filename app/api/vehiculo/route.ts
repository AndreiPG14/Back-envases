import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Vehiculo, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarPlaca, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('vehiculo').select('*').order('placa');
    if (error) throw error;
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

    const { data, error } = await supabase
      .from('vehiculo')
      .insert([{ placa: body.placa.toUpperCase(), marca: body.marca ?? null }])
      .select();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ success: false, error: 'Ya existe un vehículo con esa placa' }, { status: 409 });
      throw error;
    }

    return NextResponse.json({ success: true, data: data[0], message: 'Vehículo creado exitosamente' } as ApiResponse<Vehiculo>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
