import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Movimiento, ApiResponse } from '@/lib/types';

// GET: Todos los movimientos con trazabilidad completa
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('movimiento')
      .select(`
        *,
        usuario_origen:idusuarioorigen(id, grupo, trabajadores(nombres, dni)),
        usuario_destino:idusuariodestino(id, grupo, trabajadores(nombres, dni)),
        material:idmaterial(id, descripcion, stock),
        vehiculo:idvehiculo(id, placa, marca),
        fundo_origen:idfundoorigen(id, descripcion),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion)
      `)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST: Crear movimiento y actualizar stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fecha,
      idusuarioorigen,
      idusuariodestino,
      idmaterial,
      idvehiculo,
      idfundoorigen,
      idfundodestino,
      idoperacion,
      precinto,
      observaciones,
    } = body;

    // Validaciones
    if (
      !fecha ||
      !idusuarioorigen ||
      !idmaterial ||
      !idfundoorigen ||
      !idfundodestino ||
      !idoperacion
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos requeridos: fecha, idusuarioorigen, idmaterial, idfundoorigen, idfundodestino, idoperacion',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Obtener operación y material para actualizar stock
    const { data: operacionData } = await supabase
      .from('operacion')
      .select('descripcion')
      .eq('id', idoperacion)
      .single();

    const { data: materialData } = await supabase
      .from('materiales')
      .select('stock')
      .eq('id', idmaterial)
      .single();

    if (!materialData) {
      return NextResponse.json(
        { success: false, error: 'Material no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Calcular nuevo stock según operación
    let nuevoStock = materialData.stock;
    if (operacionData?.descripcion?.toUpperCase() === 'INGRESO') {
      nuevoStock += body.cantidad || 0;
    } else if (operacionData?.descripcion?.toUpperCase() === 'SALIDA') {
      nuevoStock -= body.cantidad || 0;
    }

    // Iniciar transacción: crear movimiento y actualizar stock
    const { data: movimientoData, error: movError } = await supabase
      .from('movimiento')
      .insert([
        {
          fecha,
          idusuarioorigen,
          idusuariodestino,
          idmaterial,
          idvehiculo,
          idfundoorigen,
          idfundodestino,
          idoperacion,
          precinto,
          observaciones,
        },
      ])
      .select();

    if (movError) throw movError;

    // Actualizar stock del material
    const { error: stockError } = await supabase
      .from('materiales')
      .update({ stock: nuevoStock })
      .eq('id', idmaterial);

    if (stockError) throw stockError;

    return NextResponse.json(
      {
        success: true,
        data: movimientoData[0],
        message: `Movimiento creado. Stock actualizado: ${nuevoStock}`,
      } as ApiResponse<Movimiento>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
