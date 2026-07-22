import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('movimiento_detalle')
      .select(`
        *,
        material:idmaterial(id, descripcion, um),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion)
      `)
      .eq('idmovimiento', id)
      .order('id');

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { idmaterial, idfundoorigen, idoperacion, cantidad } = body;
    if (!idmaterial || !idfundoorigen || !idoperacion || !cantidad) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos: idmaterial, idfundoorigen, idoperacion, cantidad' }, { status: 400 });
    }

    const { data: operacion } = await supabase
      .from('operacion').select('id, descripcion').eq('id', idoperacion).single();
    if (!operacion) return NextResponse.json({ success: false, error: 'Operación no existe' }, { status: 404 });

    const tipoOp = operacion.descripcion?.toUpperCase();
    const cant   = Number(cantidad);

    if (tipoOp === 'TRASLADO') {
      if (!body.idfundodestino) return NextResponse.json({ success: false, error: 'TRASLADO requiere ubicación destino' }, { status: 400 });
      if (body.idfundodestino === idfundoorigen) return NextResponse.json({ success: false, error: 'Origen y destino no pueden ser iguales' }, { status: 400 });
    }

    // Verificar y descontar stock en origen
    const { data: sfOrigen } = await supabase
      .from('stock_fundo').select('stock').eq('idmaterial', idmaterial).eq('idfundo', idfundoorigen).single();

    const stockOrigen = sfOrigen?.stock ?? 0;
    if (stockOrigen < cant) {
      return NextResponse.json({
        success: false,
        error: `Stock insuficiente. Disponible: ${stockOrigen}, solicitado: ${cant}`,
      }, { status: 400 });
    }

    const { error: decErr } = await supabase
      .from('stock_fundo')
      .upsert({ idmaterial, idfundo: idfundoorigen, stock: stockOrigen - cant }, { onConflict: 'idmaterial,idfundo' });
    if (decErr) throw decErr;

    // Insertar detalle
    const { data: detalle, error: detErr } = await supabase
      .from('movimiento_detalle')
      .insert([{
        idmovimiento:        Number(id),
        idmaterial,
        cantidad:            cant,
        idfundodestino:      body.idfundodestino ?? null,
        idoperacion,
        estado:              tipoOp === 'TRASLADO' ? 'PENDIENTE' : 'COMPLETO',
        cantidad_confirmada: tipoOp === 'TRASLADO' ? null : cant,
        merma:               0,
      }])
      .select()
      .single();

    if (detErr) throw detErr;

    return NextResponse.json({ success: true, data: detalle, message: `Detalle (${tipoOp}) agregado` } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
