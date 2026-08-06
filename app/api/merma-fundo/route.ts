import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface MermaFundoItem {
  idmaterial: number;
  idfundo: number;
  total_merma: number;
  observaciones: string[];
}

// GET /api/merma-fundo — merma total por material y fundo destino
export async function GET() {
  try {
    // Solo merma ROTO afecta el stock; INCOMPLETO no se cuenta
    const { data, error } = await supabase
      .from('movimiento_detalle')
      .select('idmaterial, idfundodestino, merma, observaciones, tipo_merma')
      .not('idfundodestino', 'is', null)
      .gt('merma', 0)
      .eq('tipo_merma', 'ROTO');

    if (error) throw error;

    // Agrupar por idmaterial + idfundodestino
    const map = new Map<string, MermaFundoItem>();
    for (const row of data ?? []) {
      const key = `${row.idmaterial}_${row.idfundodestino}`;
      if (!map.has(key)) {
        map.set(key, { idmaterial: row.idmaterial, idfundo: row.idfundodestino, total_merma: 0, observaciones: [] });
      }
      const item = map.get(key)!;
      item.total_merma += Number(row.merma ?? 0);
      if (row.observaciones) item.observaciones.push(row.observaciones);
    }

    return NextResponse.json({ success: true, data: Array.from(map.values()) } as ApiResponse<MermaFundoItem[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
