import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  createAuthCookieOptions,
  getAdminCredentials,
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
    const admin = getAdminCredentials();
    const emailMatches =
      Boolean(admin.email) && admin.email.toLowerCase() === email.toLowerCase();
    const passwordMatches = Boolean(admin.password) && admin.password === password;
    const debugLogin = process.env.NODE_ENV !== 'production';

    if (debugLogin) {
      console.info('[admin-login-debug]', {
        adminEmailConfigured: Boolean(process.env.ADMIN_EMAIL),
        adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD),
        sessionSecretConfigured: Boolean(process.env.APP_SESSION_SECRET),
        passwordComparisonPassed: passwordMatches,
        requestEmail: email,
        requestEmailMatchesAdmin: emailMatches,
      });
    }

    if (!emailMatches || !passwordMatches) {
      console.warn('[admin-login-failed]', { email });
      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

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
      createAdminSessionToken(email, SESSION_MAX_AGE),
      createAuthCookieOptions(SESSION_MAX_AGE)
    );
    console.info('[admin-login-success]', { email });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin login failed.';
    console.error('[admin-login-error]', { message });
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
