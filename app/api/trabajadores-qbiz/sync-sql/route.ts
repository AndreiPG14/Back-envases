import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

interface QbizRow {
  DNI: string;
  NOMBRES: string;
  'APELLIDO PATERNO': string;
  'APELLIDO MATERNO': string;
  EMPRESA: string;
  ÁREA: string;
  CARGO: string;
  'TIPO TRABAJADOR': string;
  RÉGIMEN: string;
  CENTROCOSTO: string;
  VIGENCIA: string;
  'FECHA DE INGRESO': string;
  'FECHA DE CESE': string;
  'COD FUNCIONARIO': string;
  'PLANILLA NISIRA': string;
}

const empresaIdMap: Record<string, number> = {
  'AQU_ANQA': 1,
  'AQU_ANQA2': 2,
};

const tipoTrabajadorIdMap: Record<string, number> = {
  'OBRERO AGRARIO LEY 31110': 1,
  'EMPLEADO': 2,
};

const parseDate = (val: any): string | null => {
  if (!val) return null;
  const str = val.toString().trim();
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows: QbizRow[] = body.rows || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de filas' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    let omitidos = 0;
    const parsed: any[] = [];

    for (const row of rows) {
      const dni = row['DNI']?.toString().trim();
      if (!dni) {
        omitidos++;
        continue;
      }

      parsed.push({
        dni,
        nombres: row['NOMBRES']?.toString().trim() || null,
        apellido_paterno: row['APELLIDO PATERNO']?.toString().trim() || null,
        apellido_materno: row['APELLIDO MATERNO']?.toString().trim() || null,
        empresa_id: empresaIdMap[row['EMPRESA']?.toString().trim()] ?? null,
        supervisor: false,
        eliminado: false,
        area: row['ÁREA']?.toString().trim() || null,
        cargo: row['CARGO']?.toString().trim() || null,
        tipo_trabajador: row['TIPO TRABAJADOR']?.toString().trim() || null,
        tipo_trabajador_id: tipoTrabajadorIdMap[row['TIPO TRABAJADOR']?.toString().trim()] ?? null,
        regimen: row['RÉGIMEN']?.toString().trim() || null,
        centro_costo: row['CENTROCOSTO']?.toString().trim() || null,
        vigencia: row['VIGENCIA']?.toString().trim() || null,
        fecha_ingreso: parseDate(row['FECHA DE INGRESO']),
        fecha_cese: parseDate(row['FECHA DE CESE']),
        cod_funcionario: row['COD FUNCIONARIO']?.toString().trim() || null,
        planilla_nisira: row['PLANILLA NISIRA']?.toString().trim() || null,
      });
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: { insertados: 0, omitidos },
        } as ApiResponse<any>
      );
    }

    // Deduplicar por DNI
    const deduped = Object.values(
      parsed.reduce((acc: any, r: any) => {
        acc[r.dni] = r;
        return acc;
      }, {} as Record<string, any>)
    );

    // Usar SQL directo para evitar cache de schema
    let insertados = 0;
    for (const fila of deduped) {
      try {
        const { error } = await supabase.rpc('upsert_trabajador', {
          p_dni: fila.dni,
          p_nombres: fila.nombres,
          p_apellido_paterno: fila.apellido_paterno,
          p_apellido_materno: fila.apellido_materno,
          p_empresa_id: fila.empresa_id,
          p_supervisor: fila.supervisor,
          p_eliminado: fila.eliminado,
          p_area: fila.area,
          p_cargo: fila.cargo,
          p_tipo_trabajador: fila.tipo_trabajador,
          p_tipo_trabajador_id: fila.tipo_trabajador_id,
          p_regimen: fila.regimen,
          p_centro_costo: fila.centro_costo,
          p_vigencia: fila.vigencia,
          p_fecha_ingreso: fila.fecha_ingreso,
          p_fecha_cese: fila.fecha_cese,
          p_cod_funcionario: fila.cod_funcionario,
          p_planilla_nisira: fila.planilla_nisira,
        });

        if (!error) {
          insertados++;
        }
      } catch (e) {
        // Continuar con el siguiente
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          insertados,
          omitidos: omitidos + (parsed.length - deduped.length),
        },
        message: `Sincronización completada: ${insertados} insertados, ${omitidos + (parsed.length - deduped.length)} omitidos`,
      } as ApiResponse<any>
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
