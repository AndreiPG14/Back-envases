import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, validarNumeroPositivo, formatearErrores, verificarDuplicado } from '@/lib/validations';

async function getMaterialFull(id: string | number) {
  const { data } = await supabase
    .from('materiales')
    .select('*, envase_secundario:id_envase_secundario(id, descripcion, um), material_tipo(tipo:id_tipo(id, descripcion))')
    .eq('id', id)
    .single();
  if (!data) return null;
  return {
    ...data,
    tipos: (data.material_tipo ?? []).map((mt: any) => mt.tipo).filter(Boolean),
    material_tipo: undefined,
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

    if (await verificarDuplicado(supabase, 'materiales', 'descripcion', body.descripcion, Number(id))) {
      return NextResponse.json({ success: false, error: 'Ya existe un material con esa descripción' }, { status: 409 });
    }

    const { error } = await supabase
      .from('materiales')
      .update({
        descripcion:          body.descripcion,
        um:                   body.um  ?? null,
        cod:                  body.cod ?? null,
        pu:                   body.pu  ?? null,
        id_envase_secundario: body.id_envase_secundario ?? null,
        cant_jarras:          body.cant_jarras ?? 0,
      })
      .eq('id', id);
    if (error) throw error;

    const idTipos: number[] = Array.isArray(body.id_tipos) ? body.id_tipos : [];
    await supabase.from('material_tipo').delete().eq('id_material', id);
    if (idTipos.length > 0) {
      await supabase.from('material_tipo').insert(idTipos.map((id_tipo) => ({ id_material: Number(id), id_tipo })));
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
    const { error } = await supabase.from('materiales').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Material eliminado' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
