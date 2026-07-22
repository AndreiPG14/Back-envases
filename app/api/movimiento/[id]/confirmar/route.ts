import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cantidad_confirmada, idusuario_destino } = body;

    if (cantidad_confirmada === undefined || cantidad_confirmada === null) {
      return NextResponse.json({ success: false, error: 'cantidad_confirmada es requerida' }, { status: 400 });
    }
    if (Number(cantidad_confirmada) < 0) {
      return NextResponse.json({ success: false, error: 'La cantidad confirmada no puede ser negativa' }, { status: 400 });
    }

    // Obtener el movimiento
    const { data: mov, error: movErr } = await supabase
      .from('movimiento')
      .select('*, operacion:idoperacion(descripcion)')
      .eq('id', id)
      .single();

    if (movErr || !mov) {
      return NextResponse.json({ success: false, error: 'Movimiento no encontrado' }, { status: 404 });
    }
    if (mov.estado !== 'PENDIENTE') {
      return NextResponse.json({ success: false, error: 'Este movimiento ya fue confirmado' }, { status: 409 });
    }
    if (mov.operacion?.descripcion?.toUpperCase() !== 'TRASLADO') {
      return NextResponse.json({ success: false, error: 'Solo se pueden confirmar traslados' }, { status: 400 });
    }
    if (Number(cantidad_confirmada) > Number(mov.cantidad)) {
      return NextResponse.json({
        success: false,
        error: `La cantidad confirmada (${cantidad_confirmada}) no puede superar la enviada (${mov.cantidad})`,
      }, { status: 400 });
    }

    const cantConfirmada = Number(cantidad_confirmada);
    const merma = Number(mov.cantidad) - cantConfirmada;
    const estado = merma === 0 ? 'COMPLETO' : 'INCOMPLETO';

    // Aumentar stock en destino solo por la cantidad confirmada
    if (cantConfirmada > 0) {
      const { data: sfDestino } = await supabase
        .from('stock_fundo')
        .select('stock')
        .eq('idmaterial', mov.idmaterial)
        .eq('idfundo', mov.idfundodestino)
        .single();

      const stockDestino = sfDestino?.stock ?? 0;

      const { error: incErr } = await supabase
        .from('stock_fundo')
        .upsert(
          { idmaterial: mov.idmaterial, idfundo: mov.idfundodestino, stock: stockDestino + cantConfirmada },
          { onConflict: 'idmaterial,idfundo' }
        );
      if (incErr) throw incErr;
    }

    // Actualizar el movimiento
    const { data: updated, error: updErr } = await supabase
      .from('movimiento')
      .update({
        estado,
        cantidad_confirmada: cantConfirmada,
        merma,
        ...(idusuario_destino ? { idusuariodestino: idusuario_destino } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      data: updated,
      message: merma > 0
        ? `Confirmado con merma de ${merma} unidades`
        : 'Traslado confirmado correctamente',
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('❌ POST confirmar error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
