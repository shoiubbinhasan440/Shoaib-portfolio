import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  CLIENT_SESSION_COOKIE,
  verifyAdminSessionToken,
  verifyClientSessionToken,
} from '@/lib/auth-sessions';

const RATE_LIMITS = [
  { limit: 20, prefix: '/api/admin/login', windowMs: 60_000 },
  { limit: 120, prefix: '/api/admin', windowMs: 60_000 },
  { limit: 12, prefix: '/api/contact', windowMs: 60_000 },
  { limit: 40, prefix: '/api/admin/storage-upload', windowMs: 60_000 },
  { limit: 40, prefix: '/api/storage-upload', windowMs: 60_000 },
] as const;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function rateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = RATE_LIMITS.find(item => pathname.startsWith(item.prefix));

  if (!rule) {
    return null;
  }

  const now = Date.now();
  const key = `${rule.prefix}:${getClientIp(request)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }

  current.count += 1;

  if (current.count > rule.limit) {
    console.warn('[rate-limit]', {
      ip: getClientIp(request),
      path: pathname,
      rule: rule.prefix,
    });
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((current.resetAt - now) / 1000)),
        },
      }
    );
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limited = rateLimit(request);
  if (limited) {
    return limited;
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSessionToken(token)) {
      console.warn('[auth-failed]', { path: pathname, scope: 'admin' });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (pathname.startsWith('/client/dashboard')) {
    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    if (!verifyClientSessionToken(token)) {
      console.warn('[auth-failed]', { path: pathname, scope: 'client' });
      return NextResponse.redirect(new URL('/client/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/contact/:path*',
    '/api/storage-upload/:path*',
    '/client/dashboard',
    '/client/dashboard/:path*',
  ],
};
