import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  createContactLead,
  deleteContactLead,
  getContactLeads,
  updateContactLead,
  type LeadCategory,
  type LeadPriority,
  type LeadStatus,
  type PreferredContactMethod,
  type ServiceType,
  type LeadIntent,
  type BriefStatus,
} from '@/lib/crm';
import { hasAdminSession } from '@/lib/auth-sessions';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

function isAdminRequest(request: NextRequest) {
  return hasAdminSession(request);
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      attachmentLink?: string;
      budgetRange?: string;
      deadline?: string;
      name?: string;
      email?: string;
      intentCategory?: LeadIntent | string;
      message?: string;
      mobileNumber?: string;
      preferredContactMethod?: PreferredContactMethod | string;
      projectType?: string;
      serviceType?: ServiceType | string;
      whatsappNumber?: string;
    };

    const name = body.name?.trim() || '';
    const email = body.email?.trim() || '';
    const message = body.message?.trim() || '';
    const mobileNumber = body.mobileNumber?.trim() || '';
    const whatsappNumber = body.whatsappNumber?.trim() || '';
    const serviceType = body.serviceType?.trim() || '';
    const projectType = body.projectType?.trim() || '';
    const budgetRange = body.budgetRange?.trim() || '';
    const deadline = body.deadline?.trim() || '';
    const attachmentLink = body.attachmentLink?.trim() || '';
    const preferredContactMethod = body.preferredContactMethod?.trim() || '';
    const intentCategory = body.intentCategory?.trim() || '';

    if (
      !name ||
      !email ||
      !mobileNumber ||
      !whatsappNumber ||
      !serviceType ||
      !projectType ||
      !budgetRange ||
      !deadline ||
      !message ||
      !preferredContactMethod ||
      !intentCategory
    ) {
      return badRequest('Please complete all required contact form fields.');
    }

    if (
      name.length > 120 ||
      email.length > 180 ||
      mobileNumber.length > 30 ||
      whatsappNumber.length > 30 ||
      serviceType.length > 80 ||
      projectType.length > 180 ||
      budgetRange.length > 120 ||
      deadline.length > 40 ||
      message.length > 4000 ||
      attachmentLink.length > 500
    ) {
      return badRequest('Submitted form data is too long.');
    }

    const supabase = getSupabaseAdminClient();
    const created = await createContactLead(supabase, {
      attachmentLink,
      budgetRange,
      deadline,
      intentCategory,
      message,
      mobileNumber,
      name,
      email,
      preferredContactMethod,
      projectType,
      serviceType,
      whatsappNumber,
    });

    return NextResponse.json({ ok: true, lead: created });
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
    const leads = await getContactLeads(supabase);
    return NextResponse.json({ leads });
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
      archived?: boolean;
      briefStatus?: BriefStatus;
      category?: LeadCategory;
      id?: string;
      important?: boolean;
      lastContactedAt?: string;
      preferredContactMethod?: PreferredContactMethod;
      priority?: LeadPriority;
      projectId?: string;
      read?: boolean;
      serviceType?: ServiceType;
      status?: LeadStatus;
      whatsappNumber?: string;
    };

    if (!body.id) {
      return badRequest('Message id is required.');
    }

    const supabase = getSupabaseAdminClient();
    const lead = await updateContactLead(supabase, body.id, {
      archived: typeof body.archived === 'boolean' ? body.archived : undefined,
      briefStatus: body.briefStatus,
      category: body.category,
      important: typeof body.important === 'boolean' ? body.important : undefined,
      lastContactedAt: body.lastContactedAt,
      preferredContactMethod: body.preferredContactMethod,
      priority: body.priority,
      projectId: body.projectId,
      read: typeof body.read === 'boolean' ? body.read : undefined,
      serviceType: body.serviceType,
      status: body.status,
      whatsappNumber: body.whatsappNumber,
    });

    return NextResponse.json({ ok: true, lead });
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
    await deleteContactLead(supabase, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete message.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
