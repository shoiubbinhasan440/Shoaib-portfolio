/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

const ALLOWED_TABLES = new Set([
  'categories',
  'contact_messages',
  'creative_briefs',
  'digital_marketing',
  'client_project_files',
  'client_project_updates',
  'client_projects',
  'experiences',
  'graphics',
  'message_templates',
  'navigation',
  'package_templates',
  'page_views',
  'site_settings',
  'tutorials',
  'videos',
]);

type ReadBody = {
  count?: 'exact' | 'planned' | 'estimated';
  filters?: Record<string, unknown>;
  head?: boolean;
  limit?: number;
  order?: Array<{
    ascending?: boolean;
    column?: string;
  }>;
  select?: string;
  table?: string;
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isSafeIdentifier(value: string) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

function hasUnsafeSelect(value: string) {
  return /;|--|\/\*|\*\//.test(value);
}

function applyFilters(query: any, filters: Record<string, unknown> | undefined) {
  let nextQuery = query;

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (!isSafeIdentifier(key)) {
      throw new Error(`Unsafe filter column: ${key}`);
    }

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

  try {
    const body = (await request.json()) as ReadBody;
    const table = body.table || '';
    const select = body.select || '*';

    if (!ALLOWED_TABLES.has(table)) {
      return badRequest('Table is not allowed for admin reads.');
    }

    if (hasUnsafeSelect(select)) {
      return badRequest('Select clause is not allowed.');
    }

    const supabase = getSupabaseAdminClient() as any;
    let query = supabase.from(table).select(select, {
      count: body.count,
      head: body.head,
    });

    query = applyFilters(query, body.filters);

    (body.order || []).forEach(order => {
      const column = order.column || '';
      if (!isSafeIdentifier(column)) {
        throw new Error(`Unsafe order column: ${column}`);
      }
      query = query.order(column, { ascending: order.ascending ?? true });
    });

    if (typeof body.limit === 'number' && Number.isFinite(body.limit)) {
      query = query.limit(Math.max(0, Math.min(1000, Math.floor(body.limit))));
    }

    const result = await query;

    if (result.error) {
      console.error('[admin-read-api-error]', { message: result.error.message, table });
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        count: result.count ?? null,
        data: result.data ?? null,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Admin read failed.');
  }
}
