import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  CLIENT_SESSION_COOKIE,
  createAuthCookieOptions,
  createClientSessionToken,
} from '@/lib/auth-sessions';
import {
  getClientAccounts,
  markClientLogin,
  normalizeWhatsAppNumber,
  verifyClientAccessCode,
} from '@/lib/crm';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function normalizeIdentifier(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.includes('@')
    ? trimmed.toLowerCase()
    : normalizeWhatsAppNumber(trimmed);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      accessCode?: string;
      identifier?: string;
    };

    const identifier = normalizeIdentifier(body.identifier || '');
    const accessCode = (body.accessCode || '').trim().toUpperCase();

    if (!identifier || !accessCode) {
      return NextResponse.json(
        { error: 'Email/mobile/WhatsApp and access code are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const clients = await getClientAccounts(supabase);
    const client = clients.find(item => {
      const emailMatch = item.email.toLowerCase() === identifier;
      const mobileMatch = normalizeWhatsAppNumber(item.mobileNumber) === identifier;
      const whatsappMatch = normalizeWhatsAppNumber(item.whatsappNumber) === identifier;
      return item.active && (emailMatch || mobileMatch || whatsappMatch);
    });

    if (!client || !verifyClientAccessCode(accessCode, client.accessCodeHash)) {
      return NextResponse.json(
        { error: 'Invalid client login details.' },
        { status: 401 }
      );
    }

    await markClientLogin(supabase, client.id);

    const response = NextResponse.json({
      client: {
        email: client.email,
        fullName: client.fullName,
        id: client.id,
      },
      ok: true,
    });

    response.cookies.set(
      CLIENT_SESSION_COOKIE,
      createClientSessionToken(client.id, client.authVersion, SESSION_MAX_AGE),
      createAuthCookieOptions(SESSION_MAX_AGE)
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Client login failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
