import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, validarNumeroPositivo, formatearErrores } from '@/lib/validations';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ingreso')
      .select(`
        *,
        material:idmaterial(id, descripcion, um),
        fundo:idfundo(id, descripcion)
      `)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = [
      ...validarRequeridos(body, ['idmaterial', 'idfundo', 'cantidad', 'fecha']),
      ...validarNumeroPositivo(body, ['cantidad']),
    ];
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const { data: material } = await supabase.from('materiales').select('id, descripcion').eq('id', body.idmaterial).single();
    if (!material) return NextResponse.json({ success: false, error: 'El material no existe' }, { status: 404 });

    const { data: fundo } = await supabase.from('fundo').select('id, descripcion').eq('id', body.idfundo).single();
    if (!fundo) return NextResponse.json({ success: false, error: 'El fundo no existe' }, { status: 404 });

    // Registrar el ingreso
    const { data: ingresoData, error: ingresoError } = await supabase
      .from('ingreso')
      .insert([{
        idmaterial: body.idmaterial,
        idfundo: body.idfundo,
        cantidad: Number(body.cantidad),
        fecha: body.fecha,
        idusuario: body.idusuario ?? null,
        observaciones: body.observaciones ?? null,
      }])
      .select()
      .single();

    if (ingresoError) throw ingresoError;

    // Obtener stock actual en ese fundo
    const { data: stockActual } = await supabase
      .from('stock_fundo')
      .select('stock')
      .eq('idmaterial', body.idmaterial)
      .eq('idfundo', body.idfundo)
      .single();

    const nuevoStock = (stockActual?.stock ?? 0) + Number(body.cantidad);

    // Upsert stock_fundo
    const { error: upsertError } = await supabase
      .from('stock_fundo')
      .upsert(
        { idmaterial: body.idmaterial, idfundo: body.idfundo, stock: nuevoStock },
        { onConflict: 'idmaterial,idfundo' }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json({
      success: true,
      data: ingresoData,
      message: `Ingreso registrado. Stock en ${fundo.descripcion}: ${nuevoStock}`,
    } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/ingreso error:', error.message);
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
