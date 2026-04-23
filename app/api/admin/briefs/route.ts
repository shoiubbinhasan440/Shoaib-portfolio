import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import { createCreativeBriefRequest, getCreativeBriefs } from '@/lib/crm';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  try {
    const supabase = getSupabaseAdminClient();
    const briefs = await getCreativeBriefs(supabase);
    return NextResponse.json({ briefs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load briefs.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as { leadId?: string };
    const leadId = body.leadId?.trim() || '';

    if (!leadId) {
      return NextResponse.json({ error: 'Lead id is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const brief = await createCreativeBriefRequest(supabase, leadId);
    return NextResponse.json({ brief, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create creative brief.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
