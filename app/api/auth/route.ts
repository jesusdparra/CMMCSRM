import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const APP_PASSWORD = process.env.APP_PASSWORD || 'admin123';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (password === APP_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
