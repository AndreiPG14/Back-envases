import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Movimiento, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarNumeroPositivo, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha_inicio    = searchParams.get('fecha_inicio');
    const fecha_fin       = searchParams.get('fecha_fin');
    const idmaterial      = searchParams.get('idmaterial');
    const idfundo         = searchParams.get('idfundo');
    const estado          = searchParams.get('estado');
    const idfundodestino  = searchParams.get('idfundodestino');

    let query = supabase
      .from('movimiento')
      .select(`
        *,
        material:idmaterial(id, descripcion, um),
        vehiculo:idvehiculo(id, placa, marca),
        fundo_origen:idfundoorigen(id, descripcion),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion)
      `)
      .order('fecha', { ascending: false });

    if (fecha_inicio)   query = query.gte('fecha', fecha_inicio);
    if (fecha_fin)      query = query.lte('fecha', fecha_fin);
    if (idmaterial)     query = query.eq('idmaterial', idmaterial);
    if (idfundo)        query = query.or(`idfundoorigen.eq.${idfundo},idfundodestino.eq.${idfundo}`);
    if (estado)         query = query.eq('estado', estado);
    if (idfundodestino) query = query.eq('idfundodestino', idfundodestino);

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
      ...validarRequeridos(body, ['fecha', 'idusuarioorigen', 'idmaterial', 'idfundoorigen', 'idoperacion', 'cantidad']),
      ...validarNumeroPositivo(body, ['cantidad']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    // Verificar que fundo origen y destino no sean iguales (solo para TRASLADO)
    const tipoCheck = body.idoperacion; // se valida más abajo tras buscar la operación

    // Verificar que el material existe
    const { data: material } = await supabase.from('materiales').select('id, descripcion').eq('id', body.idmaterial).single();
    if (!material) return NextResponse.json({ success: false, error: 'El material no existe' }, { status: 404 });

    // Verificar que la operación existe
    const { data: operacion } = await supabase.from('operacion').select('id, descripcion').eq('id', body.idoperacion).single();
    if (!operacion) return NextResponse.json({ success: false, error: 'La operación no existe' }, { status: 404 });

    const tipoOp = operacion.descripcion?.toUpperCase();
    const cantidad = Number(body.cantidad);

    // TRASLADO requiere fundo destino y que no sea igual al origen
    if (tipoOp === 'TRASLADO') {
      if (!body.idfundodestino) {
        return NextResponse.json({ success: false, error: 'TRASLADO requiere fundo destino' }, { status: 400 });
      }
      if (body.idfundoorigen === body.idfundodestino) {
        return NextResponse.json({ success: false, error: 'Fundo origen y destino no pueden ser iguales' }, { status: 400 });
      }
    }

    // Para TRASLADO y SALIDA: verificar y actualizar stock en fundo origen
    if (tipoOp === 'TRASLADO' || tipoOp === 'SALIDA') {
      const { data: sfOrigen } = await supabase
        .from('stock_fundo')
        .select('stock')
        .eq('idmaterial', body.idmaterial)
        .eq('idfundo', body.idfundoorigen)
        .single();

      const stockOrigen = sfOrigen?.stock ?? 0;
      if (stockOrigen < cantidad) {
        return NextResponse.json({
          success: false,
          error: `Stock insuficiente en fundo origen. Disponible: ${stockOrigen}, solicitado: ${cantidad}`,
        }, { status: 400 });
      }

      const { error: decErr } = await supabase
        .from('stock_fundo')
        .upsert(
          { idmaterial: body.idmaterial, idfundo: body.idfundoorigen, stock: stockOrigen - cantidad },
          { onConflict: 'idmaterial,idfundo' }
        );
      if (decErr) throw decErr;
    }

    // TRASLADO: el stock destino NO sube hasta que sea confirmado

    // Crear movimiento
    const { data: movimientoData, error: movError } = await supabase
      .from('movimiento')
      .insert([{
        fecha: body.fecha,
        idusuarioorigen: body.idusuarioorigen,
        idusuariodestino: body.idusuariodestino ?? null,
        idmaterial: body.idmaterial,
        idvehiculo: body.idvehiculo ?? null,
        idfundoorigen:  body.idfundoorigen,
        idfundodestino: body.idfundodestino ?? null,
        idoperacion: body.idoperacion,
        cantidad,
        estado: tipoOp === 'TRASLADO' ? 'PENDIENTE' : 'CONFIRMADO',
        cantidad_confirmada: tipoOp === 'TRASLADO' ? null : cantidad,
        merma: 0,
        precinto: body.precinto ?? null,
        observaciones: body.observaciones ?? null,
      }])
      .select();

    if (movError) throw movError;

    return NextResponse.json({
      success: true,
      data: movimientoData[0],
      message: `Movimiento (${tipoOp}) registrado correctamente`,
    } as ApiResponse<Movimiento>, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/movimiento error:', JSON.stringify(error), error.message);
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
