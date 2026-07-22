import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: NextRequest) {
  const token = request.cookies.get('web_token')?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({ user: { id: payload.id, username: payload.username, rolid: payload.rolid } });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
