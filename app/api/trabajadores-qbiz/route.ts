import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(_request: NextRequest) {
  try {
    const data = await query(
      'SELECT dni,nombres,apellido_paterno,apellido_materno,supervisor,eliminado,empresa_id,tipo_trabajador_id,area,cargo,tipo_trabajador,regimen,centro_costo,vigencia,fecha_ingreso,fecha_cese,cod_funcionario,planilla_nisira,created_at FROM trabajadores ORDER BY apellido_paterno ASC'
    );

    return NextResponse.json({ success: true, data } as ApiResponse<Trabajadores[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
