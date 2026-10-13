import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const data = await queryOne(
      'SELECT version, url_descarga, obligatorio FROM app_version ORDER BY id DESC LIMIT 1'
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
