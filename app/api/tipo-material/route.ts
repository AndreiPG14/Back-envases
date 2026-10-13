import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const data = await query('SELECT * FROM tipo_material ORDER BY descripcion');
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.descripcion?.trim())
      return NextResponse.json({ success: false, error: 'La descripción es requerida' }, { status: 400 });

    const existe = await queryOne(
      'SELECT id FROM tipo_material WHERE descripcion ILIKE $1', [body.descripcion.trim()]
    );
    if (existe)
      return NextResponse.json({ success: false, error: 'Ya existe un tipo con esa descripción' }, { status: 409 });

    const data = await queryOne(
      'INSERT INTO tipo_material (descripcion, cod) VALUES ($1, $2) RETURNING *',
      [body.descripcion.trim(), body.cod?.trim() || null]
    );
    return NextResponse.json({ success: true, data } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
