import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAuthCookieOptions } from '@/lib/auth-sessions';

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    '',
    createAuthCookieOptions(0)
  );

  return response;
}
