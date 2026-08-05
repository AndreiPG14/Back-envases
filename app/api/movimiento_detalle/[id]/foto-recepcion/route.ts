import { NextRequest, NextResponse } from 'next/server';

const BUCKET = 'registro_mov_materiales';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detalleId = parseInt(id);
    if (isNaN(detalleId))
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });

    const supabaseUrl    = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ success: false, error: 'Variables de entorno no configuradas' }, { status: 500 });

    const authHeaders = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    };

    const formData = await request.formData();
    const file = formData.get('foto') as File | null;
    if (!file)
      return NextResponse.json({ success: false, error: 'No se recibió foto' }, { status: 400 });

    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `recepcion_det_${detalleId}_${Date.now()}.${ext}`;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'true' },
        body: await file.arrayBuffer(),
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`Upload falló (${uploadRes.status}): ${errBody}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/movimiento_detalle?id=eq.${detalleId}`,
      {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ foto_recepcion_url: publicUrl }),
      }
    );

    if (!updateRes.ok) {
      const errBody = await updateRes.text();
      throw new Error(`Update falló (${updateRes.status}): ${errBody}`);
    }

    return NextResponse.json({ success: true, data: { foto_recepcion_url: publicUrl } });
  } catch (error: any) {
    console.error('[det/foto-recepcion] error:', error?.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
