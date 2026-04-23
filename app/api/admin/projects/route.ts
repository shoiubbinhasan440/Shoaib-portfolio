import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import {
  createProjectFromLead,
  createProjectUpdate,
  deleteProjectMilestone,
  ensureLeadPortalAccess,
  getClientAccounts,
  getProjectMilestones,
  getProjects,
  getProjectUpdates,
  updateProject,
  upsertProjectMilestone,
  type CreateProjectFromLeadInput,
  type ProjectMilestone,
  type ProjectUpdate,
  type UpdateProjectPatch,
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
    const [clients, milestones, projects, updates] = await Promise.all([
      getClientAccounts(supabase),
      getProjectMilestones(supabase),
      getProjects(supabase),
      getProjectUpdates(supabase),
    ]);

    return NextResponse.json({ clients, milestones, projects, updates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load projects.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as CreateProjectFromLeadInput;
    if (!body.leadId || !body.projectTitle || !body.requirements) {
      return NextResponse.json(
        { error: 'Lead id, project title, and requirements are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const result = await createProjectFromLead(supabase, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project.';
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
          action: 'project';
          projectId: string;
          patch: UpdateProjectPatch;
          updateEntry?: Omit<ProjectUpdate, 'createdAt' | 'id'>;
        }
      | {
          action: 'milestone';
          milestone: Partial<ProjectMilestone> & { projectId: string };
        }
      | {
          action: 'delete-milestone';
          milestoneId: string;
        }
      | {
          action: 'update-entry';
          entry: Omit<ProjectUpdate, 'createdAt' | 'id'>;
        }
      | {
          action: 'portal-access';
          forceRegenerate?: boolean;
          leadId: string;
        };

    const supabase = getSupabaseAdminClient();

    if (body.action === 'project') {
      if (!body.projectId) {
        return NextResponse.json({ error: 'Project id is required.' }, { status: 400 });
      }

      const project = await updateProject(supabase, body.projectId, body.patch);
      if (body.updateEntry) {
        await createProjectUpdate(supabase, body.updateEntry);
      }
      return NextResponse.json({ ok: true, project });
    }

    if (body.action === 'milestone') {
      const milestone = await upsertProjectMilestone(supabase, body.milestone);
      return NextResponse.json({ milestone, ok: true });
    }

    if (body.action === 'delete-milestone') {
      if (!body.milestoneId) {
        return NextResponse.json({ error: 'Milestone id is required.' }, { status: 400 });
      }

      await deleteProjectMilestone(supabase, body.milestoneId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'update-entry') {
      const update = await createProjectUpdate(supabase, body.entry);
      return NextResponse.json({ ok: true, update });
    }

    if (body.action === 'portal-access') {
      if (!body.leadId) {
        return NextResponse.json({ error: 'Lead id is required.' }, { status: 400 });
      }

      const result = await ensureLeadPortalAccess(
        supabase,
        body.leadId,
        body.forceRegenerate
      );
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
