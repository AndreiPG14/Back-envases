import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movId = parseInt(id);
    if (isNaN(movId)) {
      return NextResponse.json({ success: false, error: 'ID invalido' }, { status: 400 });
    }

    const mov = await queryOne(`SELECT id FROM movimiento WHERE id = $1`, [movId]);
    if (!mov) {
      return NextResponse.json({ success: false, error: 'Movimiento no encontrado' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Error parseando formData: ${e.message}` }, { status: 400 });
    }

    const file = formData.get('foto') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibio ninguna imagen (campo "foto" vacio)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const publicUrl = await uploadImage(buffer, 'registro_mov_materiales', `mov_${movId}_${Date.now()}`);

    await query(`UPDATE movimiento SET foto_url = $1 WHERE id = $2`, [publicUrl, movId]);

    return NextResponse.json({ success: true, data: { foto_url: publicUrl } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
