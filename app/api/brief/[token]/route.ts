import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  findCreativeBriefByToken,
  markCreativeBriefOpened,
  submitCreativeBrief,
} from '@/lib/crm';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = getSupabaseAdminClient();
    const brief = await markCreativeBriefOpened(supabase, token);

    if (!brief) {
      return NextResponse.json({ error: 'Brief not found.' }, { status: 404 });
    }

    return NextResponse.json({
      brief: {
        brandName: brief.brandName,
        budget: brief.budget,
        colorPreference: brief.colorPreference,
        contentScript: brief.contentScript,
        contactEmail: brief.contactEmail,
        deadline: brief.deadline,
        notes: brief.notes,
        projectGoal: brief.projectGoal,
        projectTitle: brief.projectTitle,
        referencesLinks: brief.referencesLinks,
        requiredFilesLinks: brief.requiredFilesLinks,
        serviceNeeded: brief.serviceNeeded,
        status: brief.status,
        stylePreference: brief.stylePreference,
        submittedAt: brief.submittedAt,
        targetAudience: brief.targetAudience,
        whatsappNumber: brief.whatsappNumber,
      },
      ok: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load brief.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = getSupabaseAdminClient();
    const existingBrief = await findCreativeBriefByToken(supabase, token);

    if (!existingBrief) {
      return NextResponse.json({ error: 'Brief not found.' }, { status: 404 });
    }

    const body = (await request.json()) as {
      brandName?: string;
      budget?: string;
      colorPreference?: string;
      contentScript?: string;
      deadline?: string;
      notes?: string;
      projectGoal?: string;
      projectTitle?: string;
      referencesLinks?: string;
      requiredFilesLinks?: string;
      serviceNeeded?: string;
      stylePreference?: string;
      targetAudience?: string;
      whatsappNumber?: string;
    };

    if (
      !body.projectTitle ||
      !body.serviceNeeded ||
      !body.projectGoal ||
      !body.targetAudience ||
      !body.deadline ||
      !body.budget ||
      !body.whatsappNumber
    ) {
      return NextResponse.json(
        { error: 'Please complete all required brief fields.' },
        { status: 400 }
      );
    }

    const brief = await submitCreativeBrief(supabase, token, {
      brandName: body.brandName || '',
      budget: body.budget || '',
      colorPreference: body.colorPreference || '',
      contentScript: body.contentScript || '',
      deadline: body.deadline || '',
      notes: body.notes || '',
      projectGoal: body.projectGoal || '',
      projectTitle: body.projectTitle || '',
      referencesLinks: body.referencesLinks || '',
      requiredFilesLinks: body.requiredFilesLinks || '',
      serviceNeeded: body.serviceNeeded || '',
      stylePreference: body.stylePreference || '',
      targetAudience: body.targetAudience || '',
      whatsappNumber: body.whatsappNumber || '',
    });

    return NextResponse.json({ brief, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit brief.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
