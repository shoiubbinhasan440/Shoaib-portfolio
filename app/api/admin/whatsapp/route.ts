import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import {
  clearRuntimeTwilioConfig,
  getWhatsAppProviderStatus,
  saveRuntimeTwilioConfig,
  sendWhatsAppMessage,
} from '@/lib/whatsapp';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  return NextResponse.json(await getWhatsAppProviderStatus());
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as {
      action?: 'send' | 'configure';
      accountSid?: string;
      authToken?: string;
      body?: string;
      from?: string;
      to?: string;
    };

    if (body.action === 'configure') {
      const accountSid = body.accountSid?.trim() || '';
      const authToken = body.authToken?.trim() || '';
      const from = body.from?.trim() || '';

      if (!accountSid || !authToken || !from) {
        return NextResponse.json(
          { error: 'Account SID, Auth Token, and WhatsApp sender number are required.' },
          { status: 400 }
        );
      }

      await saveRuntimeTwilioConfig({ accountSid, authToken, from });
      return NextResponse.json({
        ok: true,
        ...(await getWhatsAppProviderStatus()),
      });
    }

    const to = body.to?.trim() || '';
    const message = body.body?.trim() || '';

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Recipient number and message body are required.' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage({ body: message, to });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send WhatsApp message.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  try {
    await clearRuntimeTwilioConfig();
    return NextResponse.json({
      ok: true,
      ...(await getWhatsAppProviderStatus()),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to disconnect WhatsApp config.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
