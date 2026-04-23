import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionToken,
} from '@/lib/auth-sessions';
import { findClientAccountById, getClientPortalData } from '@/lib/crm';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const session = verifyClientSessionToken(token);
    if (!session) {
      return unauthorized();
    }

    const supabase = getSupabaseAdminClient();
    const client = await findClientAccountById(supabase, session.clientId);
    if (!client || !client.active || client.authVersion !== session.authVersion) {
      return unauthorized();
    }

    const portal = await getClientPortalData(supabase, client.id);
    if (!portal) {
      return unauthorized();
    }

    return NextResponse.json({ ok: true, portal });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load client dashboard.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
