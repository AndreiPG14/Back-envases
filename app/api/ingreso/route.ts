import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarNumeroPositivo, formatearErrores } from '@/lib/validations';

export async function GET() {
  try {
    const data = await query(
      `SELECT i.*,
              json_build_object('id', m.id, 'descripcion', m.descripcion, 'um', m.um) AS material,
              json_build_object('id', f.id, 'descripcion', f.descripcion) AS fundo
       FROM ingreso i
       LEFT JOIN materiales m ON m.id = i.idmaterial
       LEFT JOIN fundo f ON f.id = i.idfundo
       ORDER BY i.fecha DESC`
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
      ...validarRequeridos(body, ['idmaterial', 'idfundo', 'cantidad', 'fecha']),
      ...validarNumeroPositivo(body, ['cantidad']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const material = await queryOne('SELECT id, descripcion FROM materiales WHERE id = $1', [body.idmaterial]);
    if (!material) return NextResponse.json({ success: false, error: 'El material no existe' }, { status: 404 });

    const fundo = await queryOne('SELECT id, descripcion FROM fundo WHERE id = $1', [body.idfundo]);
    if (!fundo) return NextResponse.json({ success: false, error: 'El fundo no existe' }, { status: 404 });

    const ingresoData = await queryOne(
      `INSERT INTO ingreso (idmaterial, idfundo, cantidad, fecha, idusuario, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [body.idmaterial, body.idfundo, Number(body.cantidad), body.fecha, body.idusuario ?? null, body.observaciones ?? null]
    );

    const stockActual = await queryOne(
      'SELECT stock FROM stock_fundo WHERE idmaterial = $1 AND idfundo = $2',
      [body.idmaterial, body.idfundo]
    );

    const nuevoStock = (stockActual?.stock ?? 0) + Number(body.cantidad);

    await query(
      `INSERT INTO stock_fundo (idmaterial, idfundo, stock)
       VALUES ($1, $2, $3)
       ON CONFLICT (idmaterial, idfundo) DO UPDATE SET stock = $3`,
      [body.idmaterial, body.idfundo, nuevoStock]
    );

    return NextResponse.json({
      success: true,
      data: ingresoData,
      message: `Ingreso registrado. Stock en ${fundo.descripcion}: ${nuevoStock}`,
    } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/ingreso error:', error.message);
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
