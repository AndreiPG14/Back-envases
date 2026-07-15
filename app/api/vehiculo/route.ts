import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Vehiculo, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('vehiculo')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<Vehiculo[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { placa, marca } = await request.json();

    if (!placa) {
      return NextResponse.json(
        { success: false, error: 'placa es requerido' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vehiculo')
      .insert([{ placa, marca }])
      .select();

    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Vehículo creado exitosamente' } as ApiResponse<Vehiculo>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
