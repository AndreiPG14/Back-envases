import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Movimiento, ApiResponse } from '@/lib/types';

// GET: Obtener movimiento por ID con trazabilidad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('movimiento')
      .select(`
        *,
        usuario_origen:idusuarioorigen(id, grupo, trabajadores(nombres, dni)),
        usuario_destino:idusuariodestino(id, grupo, trabajadores(nombres, dni)),
        material:idmaterial(id, descripcion, stock),
        vehiculo:idvehiculo(id, placa, marca),
        fundo_origen:idfundoorigen(id, descripcion),
        fundo_destino:idfundodestino(id, descripcion),
        operacion:idoperacion(id, descripcion)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// PUT: Actualizar movimiento (solo campos no críticos)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields: Record<string, any> = {
      observaciones: body.observaciones,
      precinto:      body.precinto,
    };

    const ESTADOS_VALIDOS = ['PENDIENTE', 'COMPLETO', 'INCOMPLETO'];
    if (body.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.estado)) {
        return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
      }
      allowedFields.estado = body.estado;
    }

    const { data, error } = await supabase
      .from('movimiento')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({
      success: true,
      data,
      message: 'Movimiento actualizado',
    } as ApiResponse<Movimiento>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE: Solo si no tiene detalles (cabecera incompleta/borrador)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que no tenga detalles
    const { count } = await supabase
      .from('movimiento_detalle')
      .select('id', { count: 'exact', head: true })
      .eq('idmovimiento', id);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar: el movimiento ya tiene detalles registrados' },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('movimiento').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Cabecera eliminada' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
