import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarNumeroPositivo, formatearErrores, verificarDuplicado } from '@/lib/validations';

async function getMaterialFull(id: string | number) {
  const mat = await queryOne(
    `SELECT m.*,
            json_build_object('id', es.id, 'descripcion', es.descripcion, 'um', es.um) AS envase_secundario
     FROM materiales m
     LEFT JOIN materiales es ON es.id = m.id_envase_secundario
     WHERE m.id = $1`,
    [id]
  );
  if (!mat) return null;

  const tiposRows = await query(
    `SELECT json_build_object('id', tm.id, 'cod', tm.cod, 'descripcion', tm.descripcion) AS tipo
     FROM material_tipo mt JOIN tipo_material tm ON tm.id = mt.id_tipo
     WHERE mt.id_material = $1`,
    [id]
  );

  return {
    ...mat,
    envase_secundario: mat.envase_secundario?.id ? mat.envase_secundario : null,
    tipos: tiposRows.map((r: any) => r.tipo),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const material = await getMaterialFull(id);
    if (!material) return NextResponse.json({ success: false, error: 'Material no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: material } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 150, cod: 50, um: 50 }),
      ...validarNumeroPositivo(body, ['pu']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    if (await verificarDuplicado('materiales', 'descripcion', body.descripcion, Number(id))) {
      return NextResponse.json({ success: false, error: 'Ya existe un material con esa descripción' }, { status: 409 });
    }

    await query(
      `UPDATE materiales SET descripcion = $1, um = $2, cod = $3, pu = $4, id_envase_secundario = $5, cant_jarras = $6 WHERE id = $7`,
      [body.descripcion, body.um ?? null, body.cod ?? null, body.pu ?? null, body.id_envase_secundario ?? null, body.cant_jarras ?? 0, id]
    );

    const idTipos: number[] = Array.isArray(body.id_tipos) ? body.id_tipos : [];
    await query('DELETE FROM material_tipo WHERE id_material = $1', [id]);
    if (idTipos.length > 0) {
      const valuesClause = idTipos.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO material_tipo (id_material, id_tipo) VALUES ${valuesClause}`,
        [Number(id), ...idTipos]
      );
    }

    const material = await getMaterialFull(id);
    return NextResponse.json({ success: true, data: material, message: 'Material actualizado' } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM materiales WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Material eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
