import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  CLIENT_SESSION_COOKIE,
  verifyAdminSessionToken,
  verifyClientSessionToken,
} from '@/lib/auth-sessions';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSessionToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (pathname.startsWith('/client/dashboard')) {
    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    if (!verifyClientSessionToken(token)) {
      return NextResponse.redirect(new URL('/client/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/client/dashboard', '/client/dashboard/:path*'],
};
