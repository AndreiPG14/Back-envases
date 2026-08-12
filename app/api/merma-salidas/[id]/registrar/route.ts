import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

// POST /api/merma-salidas/[id]/registrar — marca la salida como registrada
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: detalle } = await supabase
      .from('movimiento_detalle')
      .select('id, tipo_merma, merma, merma_salida_registrada')
      .eq('id', id)
      .single();

    if (!detalle) return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    if (detalle.tipo_merma !== 'ROTO') return NextResponse.json({ success: false, error: 'Solo se pueden registrar salidas de merma ROTO' }, { status: 400 });
    if (detalle.merma_salida_registrada) return NextResponse.json({ success: false, error: 'La salida ya fue registrada' }, { status: 400 });

    const { data: updated, error } = await supabase
      .from('movimiento_detalle')
      .update({ merma_salida_registrada: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data: updated, message: 'Salida registrada correctamente' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
