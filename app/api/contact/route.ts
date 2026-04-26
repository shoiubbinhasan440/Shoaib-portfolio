import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  normalizeContactFormForPurpose,
  validateContactForm,
  type ContactFormState,
} from '@/lib/contact-form';
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
    const body = (await request.json()) as Partial<ContactFormState> & {
      intentCategory?: LeadIntent | string;
      preferredContactMethod?: PreferredContactMethod | string;
      serviceType?: ServiceType | string;
    };

    const normalized = normalizeContactFormForPurpose({
      attachmentLink: body.attachmentLink || '',
      budgetRange: body.budgetRange || '',
      companyName: body.companyName || '',
      collaborationType: body.collaborationType || '',
      contactPurpose:
        (body.contactPurpose as ContactFormState['contactPurpose']) ||
        'Work Inquiry / Project',
      deadline: body.deadline || '',
      email: body.email || '',
      message: body.message || '',
      mobileNumber: body.mobileNumber || '',
      name: body.name || '',
      preferredContactMethod: body.preferredContactMethod || '',
      projectType: body.projectType || '',
      serviceType: body.serviceType || '',
      sourcePage: body.sourcePage || request.nextUrl.pathname || '/contact',
      subject: body.subject || '',
      timeline: body.timeline || '',
      whatsappNumber: body.whatsappNumber || '',
    });
    const errors = validateContactForm(normalized);
    const firstError = Object.values(errors).find(Boolean);

    if (firstError) {
      return NextResponse.json(
        { error: firstError, errors },
        { status: 400 }
      );
    }

    if (
      normalized.name.length > 120 ||
      normalized.email.length > 180 ||
      normalized.mobileNumber.length > 30 ||
      normalized.whatsappNumber.length > 30 ||
      normalized.serviceType.length > 80 ||
      normalized.projectType.length > 180 ||
      normalized.budgetRange.length > 120 ||
      normalized.deadline.length > 40 ||
      normalized.message.length > 4000 ||
      normalized.attachmentLink.length > 500 ||
      normalized.companyName.length > 180 ||
      normalized.collaborationType.length > 160 ||
      normalized.subject.length > 180 ||
      normalized.timeline.length > 40 ||
      normalized.sourcePage.length > 240
    ) {
      return badRequest('Submitted form data is too long.');
    }

    const supabase = getSupabaseAdminClient();
    const created = await createContactLead(supabase, {
      attachmentLink: normalized.attachmentLink,
      budgetRange: normalized.budgetRange,
      collaborationType: normalized.collaborationType,
      companyName: normalized.companyName,
      contactPurpose: normalized.contactPurpose,
      deadline: normalized.deadline,
      email: normalized.email,
      intentCategory: normalized.intentCategory,
      message: normalized.message,
      mobileNumber: normalized.mobileNumber,
      name: normalized.name,
      preferredContactMethod: normalized.preferredContactMethod,
      projectType: normalized.projectType,
      serviceType: normalized.serviceType,
      sourcePage: normalized.sourcePage,
      subject: normalized.subject,
      timeline: normalized.timeline,
      whatsappNumber: normalized.whatsappNumber,
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
