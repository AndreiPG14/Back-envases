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
    console.log('[det/foto] detalleId:', detalleId);

    const { data: det, error: detErr } = await admin
      .from('movimiento_detalle')
      .select('id')
      .eq('id', detalleId)
      .maybeSingle();

    if (detErr) { console.error('[det/foto] detErr:', detErr); throw detErr; }
    if (!det) {
      console.warn('[det/foto] Detalle no encontrado:', detalleId);
      return NextResponse.json({ success: false, error: 'Detalle no encontrado' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e: any) {
      console.error('[det/foto] formData error:', e.message);
      return NextResponse.json({ success: false, error: `Error parseando formData: ${e.message}` }, { status: 400 });
    }

    const file = formData.get('foto') as File | null;
    console.log('[det/foto] fields:', [...formData.keys()]);
    console.log('[det/foto] file:', file ? `name=${file.name} type=${file.type} size=${file.size}` : 'null');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ninguna imagen (campo "foto" vacío)' }, { status: 400 });
    }

    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `det_${detalleId}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    console.log('[det/foto] Subiendo a bucket:', BUCKET, 'path:', path, 'size:', arrayBuffer.byteLength);

    // Fetch directo al REST API de Supabase Storage — el cliente JS llama btoa() internamente
    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: arrayBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error('[det/foto] uploadErr:', uploadRes.status, errBody);
      throw new Error(`Upload falló (${uploadRes.status}): ${errBody}`);
    }
    console.log('[det/foto] Upload OK');

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    console.log('[det/foto] publicUrl:', publicUrl);

    const { error: updateErr } = await admin
      .from('movimiento_detalle')
      .update({ foto_url: publicUrl })
      .eq('id', detalleId);

    if (updateErr) { console.error('[det/foto] updateErr:', updateErr); throw updateErr; }

    return NextResponse.json({ success: true, data: { foto_url: publicUrl } } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('[det/foto] CATCH:', error?.message ?? error);
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
