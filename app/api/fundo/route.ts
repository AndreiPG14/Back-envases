import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Fundo, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const data = await query(
      `SELECT f.*, json_build_object('id', e.id, 'descripcion', e.descripcion) AS empresa
       FROM fundo f
       LEFT JOIN empresa e ON e.id = f.idempresa
       ORDER BY f.descripcion`
    );
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion', 'idempresa']),
      ...validarMaxLength(body, { descripcion: 150 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const empresa = await queryOne('SELECT id FROM empresa WHERE id = $1', [body.idempresa]);
    if (!empresa) return NextResponse.json({ success: false, error: 'La empresa no existe' }, { status: 404 });

    if (await verificarDuplicado('fundo', 'descripcion', body.descripcion)) {
      return NextResponse.json({ success: false, error: 'Ya existe un fundo con esa descripción' }, { status: 409 });
    }

    const rows = await query(
      `INSERT INTO fundo (descripcion, idempresa) VALUES ($1, $2) RETURNING *`,
      [body.descripcion, body.idempresa]
    );

    const data = await queryOne(
      `SELECT f.*, json_build_object('id', e.id, 'descripcion', e.descripcion) AS empresa
       FROM fundo f
       LEFT JOIN empresa e ON e.id = f.idempresa
       WHERE f.id = $1`,
      [rows[0].id]
    );

    return NextResponse.json({ success: true, data, message: 'Fundo creado exitosamente' } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
