import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'admin_token';
export const CLIENT_SESSION_COOKIE = 'client_portal_session';

type SessionBase = {
  exp: number;
  iat: number;
  kind: 'admin' | 'client';
  v: number;
};

export type AdminSessionPayload = SessionBase & {
  email: string;
  kind: 'admin';
};

export type ClientSessionPayload = SessionBase & {
  authVersion: number;
  clientId: string;
  kind: 'client';
};

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSessionSecret() {
  const secret =
    process.env.APP_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD;

  if (!secret) {
    throw new Error('Session secret is missing.');
  }

  return secret;
}

function sign(encodedPayload: string) {
  return createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function createSignedToken<T extends SessionBase>(payload: T) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function readSignedToken<T extends SessionBase>(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as T;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || '').trim(),
    password: process.env.ADMIN_PASSWORD || '',
  };
}

export function validateAdminCredentials(email: string, password: string) {
  const admin = getAdminCredentials();
  return (
    Boolean(admin.email) &&
    Boolean(admin.password) &&
    admin.email.toLowerCase() === email.trim().toLowerCase() &&
    admin.password === password
  );
}

export function createAdminSessionToken(email: string, maxAgeSeconds = 60 * 60 * 24) {
  const now = Date.now();
  return createSignedToken<AdminSessionPayload>({
    email: email.trim().toLowerCase(),
    exp: now + maxAgeSeconds * 1000,
    iat: now,
    kind: 'admin',
    v: 1,
  });
}

export function verifyAdminSessionToken(token?: string | null) {
  const payload = readSignedToken<AdminSessionPayload>(token);
  if (!payload || payload.kind !== 'admin') {
    return null;
  }

  const admin = getAdminCredentials();
  if (!admin.email || admin.email.toLowerCase() !== payload.email) {
    return null;
  }

  return payload;
}

export function hasAdminSession(request: NextRequest) {
  return Boolean(
    verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  );
}

export function createClientSessionToken(
  clientId: string,
  authVersion: number,
  maxAgeSeconds = 60 * 60 * 24 * 14
) {
  const now = Date.now();
  return createSignedToken<ClientSessionPayload>({
    authVersion,
    clientId,
    exp: now + maxAgeSeconds * 1000,
    iat: now,
    kind: 'client',
    v: 1,
  });
}

export function verifyClientSessionToken(token?: string | null) {
  const payload = readSignedToken<ClientSessionPayload>(token);
  if (!payload || payload.kind !== 'client') {
    return null;
  }

  return payload;
}

export function createAuthCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: '/',
    priority: 'high' as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}
