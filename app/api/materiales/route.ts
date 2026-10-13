import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Materiales, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarNumeroPositivo, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET() {
  try {
    const materiales = await query(
      `SELECT m.*,
              json_build_object('id', es.id, 'descripcion', es.descripcion, 'um', es.um) AS envase_secundario
       FROM materiales m
       LEFT JOIN materiales es ON es.id = m.id_envase_secundario
       ORDER BY m.descripcion`
    );

    const tipos = await query(
      `SELECT mt.id_material, json_build_object('id', tm.id, 'cod', tm.cod, 'descripcion', tm.descripcion) AS tipo
       FROM material_tipo mt
       JOIN tipo_material tm ON tm.id = mt.id_tipo`
    );

    const tiposMap: Record<number, any[]> = {};
    for (const t of tipos) {
      if (!tiposMap[t.id_material]) tiposMap[t.id_material] = [];
      tiposMap[t.id_material].push(t.tipo);
    }

    const mapped = materiales.map((m: any) => ({
      ...m,
      envase_secundario: m.envase_secundario?.id ? m.envase_secundario : null,
      tipos: tiposMap[m.id] ?? [],
    }));

    return NextResponse.json({ success: true, data: mapped } as ApiResponse<Materiales[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 150, cod: 50, um: 50 }),
      ...validarNumeroPositivo(body, ['pu']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (await verificarDuplicado('materiales', 'descripcion', body.descripcion)) {
      return NextResponse.json({ success: false, error: 'Ya existe un material con esa descripción' }, { status: 409 });
    }

    const data = await queryOne(
      `INSERT INTO materiales (descripcion, um, cod, pu) VALUES ($1, $2, $3, $4) RETURNING id`,
      [body.descripcion, body.um ?? null, body.cod ?? null, body.pu ?? null]
    );

    const idTipos: number[] = Array.isArray(body.id_tipos) ? body.id_tipos : [];
    if (idTipos.length > 0) {
      const valuesClause = idTipos.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO material_tipo (id_material, id_tipo) VALUES ${valuesClause}`,
        [data.id, ...idTipos]
      );
    }

    const full = await queryOne(
      `SELECT m.*,
              json_build_object('id', es.id, 'descripcion', es.descripcion, 'um', es.um) AS envase_secundario
       FROM materiales m
       LEFT JOIN materiales es ON es.id = m.id_envase_secundario
       WHERE m.id = $1`,
      [data.id]
    );

    const tiposRows = await query(
      `SELECT json_build_object('id', tm.id, 'cod', tm.cod, 'descripcion', tm.descripcion) AS tipo
       FROM material_tipo mt JOIN tipo_material tm ON tm.id = mt.id_tipo
       WHERE mt.id_material = $1`,
      [data.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...full,
        envase_secundario: full?.envase_secundario?.id ? full.envase_secundario : null,
        tipos: tiposRows.map((r: any) => r.tipo),
      },
      message: 'Material creado exitosamente',
    } as ApiResponse<Materiales>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
