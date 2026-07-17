import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idfundo    = searchParams.get('idfundo');
    const idmaterial = searchParams.get('idmaterial');

    let query = supabase
      .from('stock_fundo')
      .select(`
        *,
        material:idmaterial(id, descripcion, um),
        fundo:idfundo(id, descripcion)
      `)
      .order('idfundo');

    if (idfundo)    query = query.eq('idfundo', idfundo);
    if (idmaterial) query = query.eq('idmaterial', idmaterial);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
