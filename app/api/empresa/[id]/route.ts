import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Empresa, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<Empresa>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('empresa')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({
      success: true,
      data,
      message: 'Empresa actualizada',
    } as ApiResponse<Empresa>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('empresa').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: 'Empresa eliminada',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
