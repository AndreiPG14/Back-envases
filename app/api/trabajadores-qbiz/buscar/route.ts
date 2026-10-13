import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    const data = await query(
      'SELECT * FROM trabajadores WHERE dni ILIKE $1 OR apellido_paterno ILIKE $1 OR nombres ILIKE $1 ORDER BY apellido_paterno ASC LIMIT 50',
      [searchTerm]
    );

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
