import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario, password } = body;

    if (!usuario || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const user = await queryOne('SELECT * FROM usuario WHERE username = $1', [usuario]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password ?? '');
    if (!passwordOk) {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const [trabajador, rol] = await Promise.all([
      queryOne(
        'SELECT dni, nombres, apellido_paterno, apellido_materno FROM trabajadores WHERE dni = $1',
        [user.trabajadorid]
      ),
      queryOne('SELECT id, descripcion FROM roles WHERE id = $1', [user.rolid]),
    ]);

    const token = jwt.sign(
      { id: user.id, username: user.username, rolid: user.rolid },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResponse = {
      id: user.id,
      username: user.username ?? '',
      grupo: user.grupo ?? '',
      idfundo: user.idfundo ?? null,
      trabajador: trabajador
        ? {
            id: parseInt(trabajador.dni, 10) || 0,
            nombres: trabajador.nombres ?? '',
            a_paterno: trabajador.apellido_paterno ?? '',
            a_materno: trabajador.apellido_materno ?? '',
          }
        : null,
      rol: rol
        ? {
            id: rol.id,
            nombre: rol.descripcion ?? '',
          }
        : null,
      empresa: null,
    };

    const response = NextResponse.json({ token, user: userResponse });

    response.cookies.set('web_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
