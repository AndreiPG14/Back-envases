import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Movimiento, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarNumeroPositivo, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha_inicio = searchParams.get('fecha_inicio');
    const fecha_fin = searchParams.get('fecha_fin');
    const idmaterial = searchParams.get('idmaterial');
    const idfundo = searchParams.get('idfundo');

    let query = supabase
      .from('movimiento')
      .select(`
        *,
        usuario_origen:idusuarioorigen(id, grupo, trabajadores(nombres, apellido_paterno, dni)),
        usuario_destino:idusuariodestino(id, grupo, trabajadores(nombres, apellido_paterno, dni)),
        material:idmaterial(id, descripcion, stock),
        vehiculo:idvehiculo(id, placa, marca),
        fundo_origen:idfundoorigen(id, descripcion),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion)
      `)
      .order('fecha', { ascending: false });

    if (fecha_inicio) query = query.gte('fecha', fecha_inicio);
    if (fecha_fin) query = query.lte('fecha', fecha_fin);
    if (idmaterial) query = query.eq('idmaterial', idmaterial);
    if (idfundo) query = query.or(`idfundoorigen.eq.${idfundo},idfundodestino.eq.${idfundo}`);

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

    // Validar campos requeridos
    const errores = [
      ...validarRequeridos(body, ['fecha', 'idusuarioorigen', 'idmaterial', 'idfundoorigen', 'idfundodestino', 'idoperacion', 'cantidad']),
      ...validarNumeroPositivo(body, ['cantidad']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    // Verificar que fundo origen y destino no sean iguales
    if (body.idfundoorigen === body.idfundodestino) {
      return NextResponse.json({ success: false, error: 'Fundo origen y destino no pueden ser iguales' }, { status: 400 });
    }

    // Verificar que el material existe
    const { data: material } = await supabase.from('materiales').select('id, stock, descripcion').eq('id', body.idmaterial).single();
    if (!material) return NextResponse.json({ success: false, error: 'El material no existe' }, { status: 404 });

    // Verificar que la operación existe
    const { data: operacion } = await supabase.from('operacion').select('id, descripcion').eq('id', body.idoperacion).single();
    if (!operacion) return NextResponse.json({ success: false, error: 'La operación no existe' }, { status: 404 });

    // Verificar stock suficiente si es SALIDA
    if (operacion.descripcion?.toUpperCase() === 'SALIDA') {
      if (material.stock < body.cantidad) {
        return NextResponse.json({
          success: false,
          error: `Stock insuficiente. Stock actual: ${material.stock}, cantidad solicitada: ${body.cantidad}`,
        }, { status: 400 });
      }
    }

    // Calcular nuevo stock
    let nuevoStock = material.stock;
    if (operacion.descripcion?.toUpperCase() === 'INGRESO') {
      nuevoStock += Number(body.cantidad);
    } else if (operacion.descripcion?.toUpperCase() === 'SALIDA') {
      nuevoStock -= Number(body.cantidad);
    }

    // Crear movimiento
    const { data: movimientoData, error: movError } = await supabase
      .from('movimiento')
      .insert([{
        fecha: body.fecha,
        idusuarioorigen: body.idusuarioorigen,
        idusuariodestino: body.idusuariodestino ?? null,
        idmaterial: body.idmaterial,
        idvehiculo: body.idvehiculo ?? null,
        idfundoorigen: body.idfundoorigen,
        idfundodestino: body.idfundodestino,
        idoperacion: body.idoperacion,
        precinto: body.precinto ?? null,
        observaciones: body.observaciones ?? null,
      }])
      .select();

    if (movError) throw movError;

    // Actualizar stock
    const { error: stockError } = await supabase
      .from('materiales')
      .update({ stock: nuevoStock })
      .eq('id', body.idmaterial);

    if (stockError) throw stockError;

    return NextResponse.json({
      success: true,
      data: movimientoData[0],
      message: `Movimiento registrado. Stock actualizado: ${nuevoStock}`,
    } as ApiResponse<Movimiento>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
