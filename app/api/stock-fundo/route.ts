import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idfundo    = searchParams.get('idfundo');
    const idmaterial = searchParams.get('idmaterial');

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (idfundo) {
      conditions.push(`sf.idfundo = $${paramIdx++}`);
      params.push(idfundo);
    }
    if (idmaterial) {
      conditions.push(`sf.idmaterial = $${paramIdx++}`);
      params.push(idmaterial);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const data = await query(
      `SELECT sf.*,
              json_build_object('id', m.id, 'descripcion', m.descripcion, 'um', m.um) AS material,
              json_build_object('id', f.id, 'descripcion', f.descripcion) AS fundo
       FROM stock_fundo sf
       LEFT JOIN materiales m ON m.id = sf.idmaterial
       LEFT JOIN fundo f ON f.id = sf.idfundo
       ${where}
       ORDER BY sf.idfundo`,
      params
    );
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
