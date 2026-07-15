import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Roles, ApiResponse } from '@/lib/types';
import { validarRequeridos, validarMaxLength, formatearErrores } from '@/lib/validations';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    const { data, error } = await supabase.from('roles').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Rol no encontrado' }, { status: 404 });

    return NextResponse.json({ success: true, data } as ApiResponse<Roles>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const errores = [
      ...validarRequeridos(body, ['descripcion']),
      ...validarMaxLength(body, { descripcion: 100 }),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const { data, error } = await supabase.from('roles').update({ descripcion: body.descripcion }).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Rol actualizado exitosamente' } as ApiResponse<Roles>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Rol eliminado exitosamente' } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
