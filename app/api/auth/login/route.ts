import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Buscar usuario por username
    const { data: user, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('username', usuario)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const passwordOk = await bcrypt.compare(password, user.password ?? '');
    if (!passwordOk) {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Traer trabajador y rol
    const [{ data: trabajador }, { data: rol }] = await Promise.all([
      supabase
        .from('trabajadores')
        .select('dni, nombres, apellido_paterno, apellido_materno')
        .eq('dni', user.trabajadorid)
        .single(),
      supabase
        .from('roles')
        .select('id, descripcion')
        .eq('id', user.rolid)
        .single(),
    ]);

    // Generar token JWT (expira en 30 días)
    const token = jwt.sign(
      { id: user.id, username: user.username, rolid: user.rolid },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Mapear al formato que espera Flutter
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

    // Cookie HTTP-only para sesión web (30 días)
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
