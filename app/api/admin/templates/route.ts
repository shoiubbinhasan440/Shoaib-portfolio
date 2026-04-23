import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import {
  getMessageTemplates,
  getRateTemplates,
  upsertMessageTemplate,
  upsertRateTemplate,
  type MessageTemplate,
  type MessageTemplateKey,
  type RateTemplate,
} from '@/lib/crm';
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
    const [messageTemplates, rateTemplates] = await Promise.all([
      getMessageTemplates(supabase),
      getRateTemplates(supabase),
    ]);

    return NextResponse.json({ messageTemplates, rateTemplates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load templates.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as
      | {
          template: Partial<MessageTemplate> & { key: MessageTemplateKey };
          templateType: 'message';
        }
      | {
          template: Partial<RateTemplate> & { id: string };
          templateType: 'rate';
        };

    const supabase = getSupabaseAdminClient();

    if (body.templateType === 'message') {
      const template = await upsertMessageTemplate(supabase, body.template);
      return NextResponse.json({ ok: true, template });
    }

    if (body.templateType === 'rate') {
      const template = await upsertRateTemplate(supabase, body.template);
      return NextResponse.json({ ok: true, template });
    }

    return NextResponse.json({ error: 'Invalid template type.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save template.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
