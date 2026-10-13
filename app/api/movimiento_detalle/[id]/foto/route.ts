import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detalleId = parseInt(id);
    if (isNaN(detalleId)) {
      return NextResponse.json({ success: false, error: 'ID invalido' }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Error parseando formData: ${e.message}` }, { status: 400 });
    }

    const file = formData.get('foto') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibio foto (campo "foto" vacio)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const publicUrl = await uploadImage(buffer, 'registro_mov_materiales', `det_${detalleId}_${Date.now()}`);

    await query(`UPDATE movimiento_detalle SET foto_url = $1 WHERE id = $2`, [publicUrl, detalleId]);

    return NextResponse.json({ success: true, data: { foto_url: publicUrl } }, { status: 200 });
  } catch (error: any) {
    console.error('[det/foto] error:', error?.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
