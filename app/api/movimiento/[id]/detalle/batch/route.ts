import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

// POST /api/movimiento/[id]/detalle/batch
// Body: { detalles: [{ idmaterial, idfundoorigen, idoperacion, cantidad, idfundodestino? }] }
// Crea todos los detalles en una sola llamada y devuelve sus IDs para subir fotos después.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMovimiento = Number(id);
    const body = await request.json();
    const detalles: any[] = body.detalles ?? [];

    if (detalles.length === 0)
      return NextResponse.json({ success: false, error: 'Sin detalles' }, { status: 400 });

    // Cargar operaciones en un solo query
    const idOps = [...new Set(detalles.map((d) => d.idoperacion))];
    const { data: operaciones } = await supabase
      .from('operacion').select('id, descripcion').in('id', idOps);
    const opMap = Object.fromEntries((operaciones ?? []).map((o) => [o.id, o.descripcion?.toUpperCase()]));

    const creados: any[] = [];

    for (const d of detalles) {
      const { idmaterial, idfundoorigen, idoperacion, cantidad, idfundodestino, tipo } = d;
      if (!idmaterial || !idfundoorigen || !idoperacion || !cantidad)
        return NextResponse.json({ success: false, error: 'Faltan campos requeridos en un detalle' }, { status: 400 });

      const tipoOp = opMap[idoperacion] ?? '';
      const cant   = Number(cantidad);

      if (tipoOp === 'TRASLADO') {
        if (!idfundodestino)
          return NextResponse.json({ success: false, error: 'TRASLADO requiere ubicación destino' }, { status: 400 });
        if (idfundodestino === idfundoorigen)
          return NextResponse.json({ success: false, error: 'Origen y destino no pueden ser iguales' }, { status: 400 });
      }

      // Verificar stock
      const { data: mat } = await supabase.from('material').select('descripcion').eq('id', idmaterial).single();
      const matNombre = mat?.descripcion ?? `#${idmaterial}`;
      const { data: sf } = await supabase
        .from('stock_fundo').select('stock').eq('idmaterial', idmaterial).eq('idfundo', idfundoorigen).single();
      const stock = sf?.stock ?? 0;
      if (stock < cant)
        return NextResponse.json({
          success: false,
          error: `Stock insuficiente para "${matNombre}". Disponible: ${stock}, solicitado: ${cant}`,
        }, { status: 400 });

      // Descontar stock
      const { error: decErr } = await supabase.from('stock_fundo')
        .upsert({ idmaterial, idfundo: idfundoorigen, stock: stock - cant }, { onConflict: 'idmaterial,idfundo' });
      if (decErr) throw decErr;

      // Insertar detalle
      const { data: detalle, error: detErr } = await supabase
        .from('movimiento_detalle')
        .insert([{
          idmovimiento:        idMovimiento,
          idmaterial,
          cantidad:            cant,
          idfundodestino:      idfundodestino ?? null,
          idoperacion,
          tipo:                tipo ?? null,
          estado:              tipoOp === 'TRASLADO' ? 'PENDIENTE' : 'COMPLETO',
          cantidad_confirmada: tipoOp === 'TRASLADO' ? null : cant,
          merma:               0,
        }])
        .select().single();
      if (detErr) throw detErr;

      creados.push(detalle);
    }

    return NextResponse.json({ success: true, data: creados, message: `${creados.length} detalle(s) creados` } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
