import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: NextRequest) {
  const token = request.cookies.get('web_token')?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    let vistas: string[] | null = null;

    const { data: usuario } = await supabase
      .from('usuario')
      .select('idgrupo_vista')
      .eq('id', payload.id)
      .single();

    if (usuario?.idgrupo_vista) {
      const { data: grupo } = await supabase
        .from('grupo_vista')
        .select('vistas')
        .eq('id', usuario.idgrupo_vista)
        .single();
      if (grupo) vistas = grupo.vistas;
    }

    return NextResponse.json({
      user: { id: payload.id, username: payload.username, rolid: payload.rolid, vistas },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
