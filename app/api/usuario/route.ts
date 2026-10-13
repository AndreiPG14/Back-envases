import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { validarRequeridos, formatearErrores } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const usuarios = await query('SELECT * FROM usuario ORDER BY id');

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ success: true, data: [] } as ApiResponse<any[]>);
    }

    const dnis     = [...new Set(usuarios.map((u: any) => u.trabajadorid))];
    const rolIds   = [...new Set(usuarios.map((u: any) => u.rolid))];
    const fundoIds = [...new Set(usuarios.map((u: any) => u.idfundo).filter(Boolean))];
    const grupoIds = [...new Set(usuarios.map((u: any) => u.idgrupo_vista).filter(Boolean))];

    const [trabajadores, roles, fundos, gruposVista] = await Promise.all([
      query('SELECT dni, nombres, apellido_paterno, apellido_materno FROM trabajadores WHERE dni = ANY($1)', [dnis]),
      query('SELECT id, descripcion FROM roles WHERE id = ANY($1)', [rolIds]),
      fundoIds.length > 0
        ? query('SELECT id, descripcion FROM fundo WHERE id = ANY($1)', [fundoIds])
        : Promise.resolve([]),
      grupoIds.length > 0
        ? query('SELECT id, descripcion, vistas FROM grupo_vista WHERE id = ANY($1)', [grupoIds])
        : Promise.resolve([]),
    ]);

    const rolesMap  = Object.fromEntries(roles.map((r: any) => [String(r.id), r]));
    const trabMap   = Object.fromEntries(trabajadores.map((t: any) => [String(t.dni), t]));
    const fundosMap = Object.fromEntries(fundos.map((f: any) => [String(f.id), f]));
    const gruposMap = Object.fromEntries(gruposVista.map((g: any) => [String(g.id), g]));

    const enriched = usuarios.map((u: any) => ({
      ...u,
      rol:         rolesMap[String(u.rolid)]       ?? null,
      trabajador:  trabMap[String(u.trabajadorid)] ?? null,
      fundo:       u.idfundo ? (fundosMap[String(u.idfundo)] ?? null) : null,
      grupo_vista: u.idgrupo_vista ? (gruposMap[String(u.idgrupo_vista)] ?? null) : null,
    }));

    return NextResponse.json({ success: true, data: enriched } as ApiResponse<any[]>);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errores = validarRequeridos(body, ['trabajadorid', 'rolid', 'username', 'password']);
    if (errores.length > 0) return NextResponse.json(formatearErrores(errores), { status: 400 });

    const trabajador = await queryOne(
      'SELECT dni, nombres, apellido_paterno FROM trabajadores WHERE dni = $1', [body.trabajadorid]
    );
    if (!trabajador) return NextResponse.json({ success: false, error: 'El trabajador no existe' }, { status: 404 });

    const rol = await queryOne('SELECT id, descripcion FROM roles WHERE id = $1', [body.rolid]);
    if (!rol) return NextResponse.json({ success: false, error: 'El rol no existe' }, { status: 404 });

    const dupUser = await queryOne('SELECT id FROM usuario WHERE username = $1', [body.username]);
    if (dupUser) return NextResponse.json({ success: false, error: 'Ese nombre de usuario ya existe' }, { status: 409 });

    const dup = await queryOne(
      'SELECT id FROM usuario WHERE trabajadorid = $1 AND rolid = $2', [body.trabajadorid, body.rolid]
    );
    if (dup) return NextResponse.json({ success: false, error: 'Este trabajador ya tiene ese rol asignado' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const data = await queryOne(
      `INSERT INTO usuario (idfundo, idgrupo_vista, trabajadorid, rolid, username, password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [body.idfundo ?? null, body.idgrupo_vista ?? null, body.trabajadorid, body.rolid, body.username, hashedPassword]
    );

    let fundo = null;
    if (body.idfundo) {
      fundo = await queryOne('SELECT id, descripcion FROM fundo WHERE id = $1', [body.idfundo]);
    }

    let grupo_vista = null;
    if (body.idgrupo_vista) {
      grupo_vista = await queryOne('SELECT id, descripcion, vistas FROM grupo_vista WHERE id = $1', [body.idgrupo_vista]);
    }

    return NextResponse.json({
      success: true,
      data: { ...data, rol, trabajador, fundo, grupo_vista },
      message: 'Usuario creado exitosamente',
    } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 500 });
  }
}
