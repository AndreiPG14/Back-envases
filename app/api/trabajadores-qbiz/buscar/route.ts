import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      } as ApiResponse<Trabajadores[]>);
    }

    const searchTerm = `%${q.toUpperCase()}%`;

    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .or(`dni.ilike.${searchTerm},apellido_paterno.ilike.${searchTerm},nombres.ilike.${searchTerm}`)
      .order('apellido_paterno', { ascending: true })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    } as ApiResponse<Trabajadores[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
