import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { estado, cantidad_confirmada, observaciones } = body;

    const ESTADOS = ['PENDIENTE', 'COMPLETO', 'INCOMPLETO'];
    if (estado && !ESTADOS.includes(estado)) {
      return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
    }

    // Obtener detalle actual para calcular merma
    const { data: detalle, error: detErr } = await supabase
      .from('movimiento_detalle')
      .select('cantidad, idfundodestino, idmaterial, cantidad_confirmada')
      .eq('id', id)
      .single();

    if (detErr || !detalle) {
      return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (estado) updates.estado = estado;
    if (observaciones !== undefined) updates.observaciones = observaciones;

    if (estado === 'COMPLETO') {
      updates.cantidad_confirmada = detalle.cantidad;
      updates.merma = 0;
    } else if (estado === 'INCOMPLETO') {
      if (cantidad_confirmada === undefined || cantidad_confirmada === null) {
        return NextResponse.json({ success: false, error: 'cantidad_confirmada es requerida para estado INCOMPLETO' }, { status: 400 });
      }
      const cantConf = Number(cantidad_confirmada);
      if (cantConf < 0 || cantConf >= Number(detalle.cantidad)) {
        return NextResponse.json({ success: false, error: `La cantidad confirmada debe ser menor a ${detalle.cantidad}` }, { status: 400 });
      }
      updates.cantidad_confirmada = cantConf;
      updates.merma = Number(detalle.cantidad) - cantConf;

      // Ajustar stock en destino si ya había una confirmación previa
      if (detalle.idfundodestino && detalle.idmaterial) {
        const prevConf = Number(detalle.cantidad_confirmada ?? 0);
        const diff = cantConf - prevConf;
        if (diff !== 0) {
          const { data: sf } = await supabase
            .from('stock_fundo')
            .select('stock')
            .eq('idmaterial', detalle.idmaterial)
            .eq('idfundo', detalle.idfundodestino)
            .single();

          const stockActual = (sf?.stock ?? 0) + diff;
          await supabase
            .from('stock_fundo')
            .upsert(
              { idmaterial: detalle.idmaterial, idfundo: detalle.idfundodestino, stock: Math.max(0, stockActual) },
              { onConflict: 'idmaterial,idfundo' }
            );
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('movimiento_detalle')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        material:idmaterial(id, descripcion, um),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data: updated, message: 'Detalle actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
