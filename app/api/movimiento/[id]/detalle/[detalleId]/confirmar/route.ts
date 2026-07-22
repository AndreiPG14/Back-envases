import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detalleId: string }> }
) {
  try {
    const { detalleId } = await params;
    const { cantidad_confirmada } = await request.json();

    if (cantidad_confirmada === undefined || cantidad_confirmada === null) {
      return NextResponse.json({ success: false, error: 'cantidad_confirmada es requerida' }, { status: 400 });
    }

    const { data: detalle } = await supabase
      .from('movimiento_detalle').select('*').eq('id', detalleId).single();

    if (!detalle) return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    if (detalle.estado !== 'PENDIENTE') return NextResponse.json({ success: false, error: 'Este detalle ya fue confirmado' }, { status: 400 });

    const cantConf = Number(cantidad_confirmada);
    const merma    = Number(detalle.cantidad) - cantConf;
    const estado   = merma > 0 ? 'INCOMPLETO' : 'COMPLETO';

    // Aumentar stock en destino
    const { data: sfDest } = await supabase
      .from('stock_fundo').select('stock').eq('idmaterial', detalle.idmaterial).eq('idfundo', detalle.idfundodestino).single();

    const stockDest = sfDest?.stock ?? 0;
    const { error: upErr } = await supabase
      .from('stock_fundo')
      .upsert({ idmaterial: detalle.idmaterial, idfundo: detalle.idfundodestino, stock: stockDest + cantConf }, { onConflict: 'idmaterial,idfundo' });
    if (upErr) throw upErr;

    const { data: updated, error: updErr } = await supabase
      .from('movimiento_detalle')
      .update({ estado, cantidad_confirmada: cantConf, merma })
      .eq('id', detalleId)
      .select().single();
    if (updErr) throw updErr;

    return NextResponse.json({ success: true, data: updated, message: `Confirmado. Merma: ${merma}` } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
