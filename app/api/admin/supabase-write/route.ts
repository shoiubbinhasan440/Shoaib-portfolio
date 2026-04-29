/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

const ALLOWED_TABLES = new Set([
  'categories',
  'graphics',
  'site_settings',
  'tutorials',
  'videos',
]);

type WriteBody = {
  action?: 'delete' | 'insert' | 'update' | 'upsert';
  filters?: Record<string, unknown>;
  onConflict?: string;
  payload?: unknown;
  select?: string;
  table?: string;
};

function sanitizeString(value: string) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on[a-z]+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function sanitizePayload(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizePayload);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizePayload(item),
      ])
    );
  }

  return value;
}

function hasInvalidUrl(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entries = Array.isArray(value)
    ? value.flatMap(item => Object.entries((item || {}) as Record<string, unknown>))
    : Object.entries(value as Record<string, unknown>);

  return entries.some(([key, item]) => {
    if (!/url|link|image|thumbnail/i.test(key) || typeof item !== 'string' || !item) {
      return false;
    }

    return !/^(https?:\/\/|\/|#)/i.test(item);
  });
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function applyFilters(
  query: any,
  filters: Record<string, unknown> | undefined
) {
  let nextQuery = query;

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      nextQuery = nextQuery.in(key, value);
      return;
    }

    nextQuery = nextQuery.eq(key, value);
  });

  return nextQuery;
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as WriteBody;
  const table = body.table || '';
  const action = body.action || '';
  const payload = sanitizePayload(body.payload);

  if (!ALLOWED_TABLES.has(table)) {
    return badRequest('Table is not allowed for admin writes.');
  }

  if (hasInvalidUrl(payload)) {
    return badRequest('Invalid URL in submitted admin data.');
  }

  const supabase = getSupabaseAdminClient() as any;
  let result:
    | { data: unknown; error: { message: string } | null }
    | { data: null; error: { message: string } | null };

  if (action === 'insert') {
    let query = supabase.from(table).insert(payload as never);
    if (body.select) {
      query = query.select(body.select);
    }
    result = await query;
  } else if (action === 'update') {
    let query = supabase.from(table).update(payload as never);
    query = applyFilters(query, body.filters);
    if (body.select) {
      query = query.select(body.select);
    }
    result = await query;
  } else if (action === 'upsert') {
    let query = supabase
      .from(table)
      .upsert(payload as never, body.onConflict ? { onConflict: body.onConflict } : undefined);
    if (body.select) {
      query = query.select(body.select);
    }
    result = await query;
  } else if (action === 'delete') {
    const query = applyFilters(supabase.from(table).delete(), body.filters);
    result = await query;
  } else {
    return badRequest('Unsupported admin write action.');
  }

  if (result.error) {
    console.error('[admin-api-error]', { action, message: result.error.message, table });
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: result.data ?? null },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
