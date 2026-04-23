import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  createAuthCookieOptions,
  validateAdminCredentials,
} from '@/lib/auth-sessions';

const SESSION_MAX_AGE = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() || '';
    const password = body.password || '';

    if (!validateAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(email, SESSION_MAX_AGE),
      createAuthCookieOptions(SESSION_MAX_AGE)
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin login failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
