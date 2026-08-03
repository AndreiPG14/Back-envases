import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Trabajadores, ApiResponse } from '@/lib/types';

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('dni,nombres,apellido_paterno,apellido_materno,supervisor,eliminado,empresa_id,tipo_trabajador_id,area,cargo,tipo_trabajador,regimen,centro_costo,vigencia,fecha_ingreso,fecha_cese,cod_funcionario,planilla_nisira,created_at')
      .order('apellido_paterno', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data } as ApiResponse<Trabajadores[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
