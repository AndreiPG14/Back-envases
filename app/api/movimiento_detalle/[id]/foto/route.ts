import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

const BUCKET = 'registro_mov_materiales';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detalleId = parseInt(id);
    if (isNaN(detalleId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: det, error: detErr } = await admin
      .from('movimiento_detalle')
      .select('id')
      .eq('id', detalleId)
      .maybeSingle();

    if (detErr) throw detErr;
    if (!det) {
      return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e: any) {
      return NextResponse.json({ success: false, error: `Error parseando formData: ${e.message}` }, { status: 400 });
    }

    const file = formData.get('foto') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ninguna imagen (campo "foto" vacío)' }, { status: 400 });
    }

    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `det_${detalleId}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes   = new Uint8Array(arrayBuffer);

    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, fileBytes, { contentType: file.type || 'image/jpeg', upsert: true });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await admin
      .from('movimiento_detalle')
      .update({ foto_url: publicUrl })
      .eq('id', detalleId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, data: { foto_url: publicUrl } } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
