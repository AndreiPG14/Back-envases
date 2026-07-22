import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin    = searchParams.get('fecha_fin');
    const idfundo      = searchParams.get('idfundo');

    let query = supabase
      .from('movimiento')
      .select(`
        *,
        vehiculo:idvehiculo(id, placa, marca),
        fundo_origen:idfundoorigen(id, descripcion),
        usuario_origen:idusuarioorigen(id, username),
        movimiento_detalle(
          id, cantidad, estado, cantidad_confirmada, merma, created_at,
          material:idmaterial(id, descripcion, um),
          fundo_destino:idfundodestino(id, descripcion),
          operacion:idoperacion(id, descripcion)
        )
      `)
      .order('fecha', { ascending: false });

    if (fecha_inicio) query = query.gte('fecha', fecha_inicio);
    if (fecha_fin)    query = query.lte('fecha', fecha_fin);
    if (idfundo)      query = query.eq('idfundoorigen', idfundo);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = validarRequeridos(body, ['fecha', 'idusuarioorigen', 'idfundoorigen']);
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    // Validar precinto duplicado
    if (body.precinto) {
      const { data: existe } = await supabase
        .from('movimiento')
        .select('id')
        .eq('precinto', body.precinto)
        .maybeSingle();
      if (existe) return NextResponse.json(
        { success: false, error: `El precinto "${body.precinto}" ya fue registrado (mov #${existe.id})` },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('movimiento')
      .insert([{
        fecha:           body.fecha,
        idusuarioorigen: body.idusuarioorigen,
        idvehiculo:      body.idvehiculo ?? null,
        idfundoorigen:   body.idfundoorigen,
        precinto:        body.precinto ?? null,
        observaciones:   body.observaciones ?? null,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Movimiento creado' } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
