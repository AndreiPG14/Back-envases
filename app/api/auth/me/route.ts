import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: NextRequest) {
  const token = request.cookies.get('web_token')?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    let vistas: string[] | null = null;

    const usuario = await queryOne('SELECT idgrupo_vista FROM usuario WHERE id = $1', [payload.id]);

    if (usuario?.idgrupo_vista) {
      const grupo = await queryOne('SELECT vistas FROM grupo_vista WHERE id = $1', [usuario.idgrupo_vista]);
      if (grupo) vistas = grupo.vistas;
    }

    return NextResponse.json({
      user: { id: payload.id, username: payload.username, rolid: payload.rolid, vistas },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
