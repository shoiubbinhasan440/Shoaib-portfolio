import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessages,
  updateContactMessage,
} from '@/lib/contact-messages';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

function isAdminRequest(request: NextRequest) {
  return Boolean(request.cookies.get('admin_token')?.value);
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    const name = body.name?.trim() || '';
    const email = body.email?.trim() || '';
    const subject = body.subject?.trim() || '';
    const message = body.message?.trim() || '';

    if (!name || !email || !message) {
      return badRequest('Name, email and message are required.');
    }

    if (name.length > 120 || email.length > 180 || subject.length > 180 || message.length > 4000) {
      return badRequest('Submitted message is too long.');
    }

    const supabase = getSupabaseAdminClient();
    const created = await createContactMessage(supabase, {
      name,
      email,
      subject,
      message,
    });

    return NextResponse.json({ ok: true, message: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Contact submission failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return badRequest('Unauthorized.', 401);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const messages = await getContactMessages(supabase);
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load messages.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return badRequest('Unauthorized.', 401);
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      read?: boolean;
      archived?: boolean;
    };

    if (!body.id) {
      return badRequest('Message id is required.');
    }

    const supabase = getSupabaseAdminClient();
    const message = await updateContactMessage(supabase, body.id, {
      read: typeof body.read === 'boolean' ? body.read : undefined,
      archived: typeof body.archived === 'boolean' ? body.archived : undefined,
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update message.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return badRequest('Unauthorized.', 401);
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return badRequest('Message id is required.');
    }

    const supabase = getSupabaseAdminClient();
    await deleteContactMessage(supabase, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete message.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
