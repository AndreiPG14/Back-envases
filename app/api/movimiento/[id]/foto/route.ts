import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const BUCKET = 'registro_mov_materiales';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movId = parseInt(id);
    if (isNaN(movId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verificar que el movimiento existe (admin para saltear RLS)
    const { data: mov, error: movErr } = await admin
      .from('movimiento')
      .select('id')
      .eq('id', movId)
      .maybeSingle();

    if (movErr) throw movErr;
    if (!mov) {
      return NextResponse.json({ success: false, error: 'Movimiento no encontrado' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e: any) {
      console.error('[foto] Error parseando formData:', e.message);
      return NextResponse.json({ success: false, error: `Error parseando formData: ${e.message}` }, { status: 400 });
    }

    const file = formData.get('foto') as File | null;
    console.log('[foto] fields recibidos:', [...formData.keys()]);
    console.log('[foto] file:', file ? `name=${file.name} type=${file.type} size=${file.size}` : 'null');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ninguna imagen (campo "foto" vacío)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `mov_${movId}_${Date.now()}.${ext}`;

    console.log('[foto] Subiendo a bucket:', BUCKET, 'path:', path, 'size:', file.size);

    // Uint8Array evita que el cliente Supabase pase por btoa() internamente
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, fileBytes, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      console.error('[foto] Error upload storage:', uploadErr);
      throw uploadErr;
    }
    console.log('[foto] Upload exitoso → path:', path);

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await admin
      .from('movimiento')
      .update({ foto_url: publicUrl })
      .eq('id', movId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, data: { foto_url: publicUrl } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
