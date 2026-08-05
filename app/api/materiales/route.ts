import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Materiales, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarNumeroPositivo, formatearErrores, verificarDuplicado } from '@/lib/validations';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('materiales')
      .select(`
        *,
        envase_secundario:id_envase_secundario(id, descripcion, um),
        material_tipo(tipo:id_tipo(id, cod, descripcion))
      `)
      .order('descripcion');
    if (error) throw error;

    const mapped = (data ?? []).map((m: any) => ({
      ...m,
      tipos: (m.material_tipo ?? []).map((mt: any) => mt.tipo).filter(Boolean),
      material_tipo: undefined,
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

    if (await verificarDuplicado(supabase, 'materiales', 'descripcion', body.descripcion)) {
      return NextResponse.json({ success: false, error: 'Ya existe un material con esa descripción' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('materiales')
      .insert([{
        descripcion: body.descripcion,
        um:          body.um ?? null,
        cod:         body.cod ?? null,
        pu:          body.pu ?? null,
      }])
      .select('id')
      .single();
    if (error) throw error;

    const idTipos: number[] = Array.isArray(body.id_tipos) ? body.id_tipos : [];
    if (idTipos.length > 0) {
      await supabase.from('material_tipo').insert(idTipos.map((id_tipo) => ({ id_material: data.id, id_tipo })));
    }

    const { data: full } = await supabase
      .from('materiales')
      .select('*, envase_secundario:id_envase_secundario(id, descripcion, um), material_tipo(tipo:id_tipo(id, cod, descripcion))')
      .eq('id', data.id).single();

    return NextResponse.json({
      success: true,
      data: { ...full, tipos: (full?.material_tipo ?? []).map((mt: any) => mt.tipo).filter(Boolean), material_tipo: undefined },
      message: 'Material creado exitosamente',
    } as ApiResponse<Materiales>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
