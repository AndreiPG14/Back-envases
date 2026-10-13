import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export interface MermaFundoItem {
  idmaterial: number;
  idfundo: number;
  total_merma: number;
  observaciones: string[];
}

export async function GET() {
  try {
    const data = await query(`
      SELECT idmaterial, idfundodestino, merma, observaciones
      FROM movimiento_detalle
      WHERE idfundodestino IS NOT NULL AND merma > 0 AND tipo_merma = 'ROTO'
    `);

    const map = new Map<string, MermaFundoItem>();
    for (const row of data) {
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
