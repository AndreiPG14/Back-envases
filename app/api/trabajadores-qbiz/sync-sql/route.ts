import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

const empresaIdMap: Record<string, number> = {
  'AQU_ANQA': 1,
  'AQU_ANQA2': 2,
};

const tipoTrabajadorIdMap: Record<string, number> = {
  'OBRERO AGRARIO LEY 31110': 1,
  'EMPLEADO': 2,
};

export async function POST() {
  try {
    const rows = await query(
      `SELECT payload FROM public.qbiz_funcionarios_raw`
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: true, data: { insertados: 0, omitidos: 0 }, message: 'No hay datos en qbiz_funcionarios_raw' } as ApiResponse<any>);
    }

    let omitidos = 0;
    const parsed: any[] = [];

    for (const { payload } of rows) {
      const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const dni = p.DNI?.toString().trim();
      if (!dni) { omitidos++; continue; }

      parsed.push({
        dni,
        nombres: p.NOMBRES?.trim() || null,
        apellido_paterno: p['APELLIDO PATERNO']?.trim() || null,
        apellido_materno: p['APELLIDO MATERNO']?.trim() || null,
        empresa_id: empresaIdMap[p.EMPRESA?.trim()] ?? null,
        supervisor: false,
        eliminado: false,
        area: p['ÁREA']?.trim() || null,
        cargo: p.CARGO?.trim() || null,
        tipo_trabajador: p['TIPO TRABAJADOR']?.trim() || null,
        tipo_trabajador_id: tipoTrabajadorIdMap[p['TIPO TRABAJADOR']?.trim()] ?? null,
        regimen: p['RÉGIMEN']?.trim() || null,
        centro_costo: p.CENTROCOSTO?.trim() || null,
        vigencia: p.VIGENCIA?.trim() || null,
        fecha_ingreso: p['FECHA DE INGRESO'] || null,
        fecha_cese: p['FECHA DE CESE'] || null,
        cod_funcionario: p['COD FUNCIONARIO']?.trim() || null,
        planilla_nisira: p['PLANILLA NISIRA']?.trim() || null,
      });
    }

    const deduped = Object.values(
      parsed.reduce((acc: any, r: any) => { acc[r.dni] = r; return acc; }, {} as Record<string, any>)
    ) as any[];

    let insertados = 0;
    for (const f of deduped) {
      try {
        await query(
          `INSERT INTO trabajadores (dni, nombres, apellido_paterno, apellido_materno, empresa_id, supervisor, eliminado, area, cargo, tipo_trabajador, tipo_trabajador_id, regimen, centro_costo, vigencia, fecha_ingreso, fecha_cese, cod_funcionario, planilla_nisira)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           ON CONFLICT (dni) DO UPDATE SET
             nombres = EXCLUDED.nombres, apellido_paterno = EXCLUDED.apellido_paterno, apellido_materno = EXCLUDED.apellido_materno,
             empresa_id = EXCLUDED.empresa_id, area = EXCLUDED.area, cargo = EXCLUDED.cargo, tipo_trabajador = EXCLUDED.tipo_trabajador,
             tipo_trabajador_id = EXCLUDED.tipo_trabajador_id, regimen = EXCLUDED.regimen, centro_costo = EXCLUDED.centro_costo,
             vigencia = EXCLUDED.vigencia, fecha_ingreso = EXCLUDED.fecha_ingreso, fecha_cese = EXCLUDED.fecha_cese,
             cod_funcionario = EXCLUDED.cod_funcionario, planilla_nisira = EXCLUDED.planilla_nisira`,
          [f.dni, f.nombres, f.apellido_paterno, f.apellido_materno, f.empresa_id,
           f.supervisor, f.eliminado, f.area, f.cargo, f.tipo_trabajador,
           f.tipo_trabajador_id, f.regimen, f.centro_costo, f.vigencia,
           f.fecha_ingreso, f.fecha_cese, f.cod_funcionario, f.planilla_nisira]
        );
        insertados++;
      } catch { /* continuar */ }
    }

    return NextResponse.json({
      success: true,
      data: { insertados, omitidos: omitidos + (parsed.length - deduped.length) },
      message: `Sincronización completada: ${insertados} insertados de ${rows.length} registros en qbiz_funcionarios_raw`,
    } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
