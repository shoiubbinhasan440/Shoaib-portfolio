'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import {
  buildWhatsAppUrl,
  PAYMENT_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  renderTemplate,
} from '@/lib/crm-shared';
import type {
  ClientProject,
  MessageTemplate,
  ProjectMilestone,
  ProjectResource,
  ProjectUpdate,
} from '@/lib/crm';

type ProjectDeskState = {
  loading: boolean;
  messageTemplates: MessageTemplate[];
  milestones: ProjectMilestone[];
  projects: ClientProject[];
  saving: boolean;
  updates: ProjectUpdate[];
};

type UpdateFormState = {
  body: string;
  title: string;
  type: ProjectUpdate['type'];
  visibility: ProjectUpdate['visibility'];
};

export default function AdminProjectsPage() {
  const [state, setState] = useState<ProjectDeskState>({
    loading: true,
    messageTemplates: [],
    milestones: [],
    projects: [],
    saving: false,
    updates: [],
  });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [notice, setNotice] = useState('');
  const [draftProject, setDraftProject] = useState<ClientProject | null>(null);
  const [resourceDraft, setResourceDraft] = useState<ProjectResource>({
    clientVisible: true,
    createdAt: '',
    description: '',
    id: '',
    label: '',
    url: '',
  });
  const [milestoneDraft, setMilestoneDraft] = useState({
    clientVisible: true,
    description: '',
    dueDate: '',
    order: '1',
    status: 'Pending',
    title: '',
  });
  const [updateForm, setUpdateForm] = useState<UpdateFormState>({
    body: '',
    title: '',
    type: 'progress',
    visibility: 'client',
  });

  async function loadProjects() {
    setState(current => ({ ...current, loading: true }));
    try {
      const [projectResponse, templateResponse] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/templates'),
      ]);

      const projectData = projectResponse.ok
        ? ((await projectResponse.json()) as {
            milestones: ProjectMilestone[];
            projects: ClientProject[];
            updates: ProjectUpdate[];
          })
        : { milestones: [], projects: [], updates: [] };
      const templateData = templateResponse.ok
        ? ((await templateResponse.json()) as { messageTemplates: MessageTemplate[] })
        : { messageTemplates: [] };

      setState({
        loading: false,
        messageTemplates: templateData.messageTemplates || [],
        milestones: projectData.milestones || [],
        projects: projectData.projects || [],
        saving: false,
        updates: projectData.updates || [],
      });
    } catch {
      setState(current => ({ ...current, loading: false, saving: false }));
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!state.projects.length) {
      setSelectedProjectId('');
      setDraftProject(null);
      return;
    }

    const currentProject =
      state.projects.find(project => project.id === selectedProjectId) || state.projects[0];

    if (!selectedProjectId || !state.projects.some(project => project.id === selectedProjectId)) {
      setSelectedProjectId(currentProject.id);
    }

    setDraftProject(currentProject);
  }, [selectedProjectId, state.projects]);

  const selectedProject =
    state.projects.find(project => project.id === selectedProjectId) || null;

  const projectMilestones = useMemo(
    () =>
      state.milestones.filter(milestone => milestone.projectId === selectedProject?.id),
    [selectedProject?.id, state.milestones]
  );

  const projectUpdates = useMemo(
    () => state.updates.filter(update => update.projectId === selectedProject?.id),
    [selectedProject?.id, state.updates]
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }

  async function saveProject() {
    if (!draftProject) {
      return;
    }

    setState(current => ({ ...current, saving: true }));
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'project',
          patch: {
            budgetPrice: draftProject.budgetPrice,
            clientVisibleNotes: draftProject.clientVisibleNotes,
            currentStatus: draftProject.currentStatus,
            deadline: draftProject.deadline,
            nextStep: draftProject.nextStep,
            paymentStatus: draftProject.paymentStatus,
            privateAdminNotes: draftProject.privateAdminNotes,
            progressPercentage: draftProject.progressPercentage,
            projectTitle: draftProject.projectTitle,
            requirements: draftProject.requirements,
            resources: draftProject.resources,
            serviceType: draftProject.serviceType,
          },
          projectId: draftProject.id,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Failed to save project.');
      }

      await loadProjects();
      flash('Project saved.');
    } finally {
      setState(current => ({ ...current, saving: false }));
    }
  }

  async function addMilestone() {
    if (!selectedProject) {
      return;
    }

    const response = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'milestone',
        milestone: {
          ...milestoneDraft,
          order: Number(milestoneDraft.order),
          projectId: selectedProject.id,
        },
      }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error || 'Failed to save milestone.');
    }

    await loadProjects();
    setMilestoneDraft({
      clientVisible: true,
      description: '',
      dueDate: '',
      order: String(projectMilestones.length + 1),
      status: 'Pending',
      title: '',
    });
    flash('Milestone saved.');
  }

  async function patchMilestone(
    milestoneId: string,
    patch: Partial<ProjectMilestone>
  ) {
    const current = projectMilestones.find(item => item.id === milestoneId);
    if (!current) {
      return;
    }

    const response = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'milestone',
        milestone: { ...current, ...patch },
      }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error || 'Failed to update milestone.');
    }

    await loadProjects();
  }

  async function removeMilestone(milestoneId: string) {
    const response = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete-milestone',
        milestoneId,
      }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error || 'Failed to delete milestone.');
    }

    await loadProjects();
  }

  async function addUpdateEntry() {
    if (!selectedProject || !updateForm.title || !updateForm.body) {
      return;
    }

    const response = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update-entry',
        entry: {
          ...updateForm,
          progressSnapshot: draftProject?.progressPercentage || selectedProject.progressPercentage,
          projectId: selectedProject.id,
          statusSnapshot: draftProject?.currentStatus || selectedProject.currentStatus,
        },
      }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error || 'Failed to add update.');
    }

    await loadProjects();
    setUpdateForm({
      body: '',
      title: '',
      type: 'progress',
      visibility: 'client',
    });
    flash('Project update added.');
  }

  function addResourceToDraft() {
    if (!draftProject || !resourceDraft.label || !resourceDraft.url) {
      return;
    }

    setDraftProject({
      ...draftProject,
      resources: [
        ...draftProject.resources,
        {
          ...resourceDraft,
          createdAt: new Date().toISOString(),
          id: `resource-${Date.now()}`,
        },
      ],
    });
    setResourceDraft({
      clientVisible: true,
      createdAt: '',
      description: '',
      id: '',
      label: '',
      url: '',
    });
  }

  function removeResource(resourceId: string) {
    if (!draftProject) {
      return;
    }

    setDraftProject({
      ...draftProject,
      resources: draftProject.resources.filter(resource => resource.id !== resourceId),
    });
  }

  function openProgressWhatsApp() {
    const template = state.messageTemplates.find(
      item => item.key === 'progress_update'
    );
    if (!selectedProject) {
      return;
    }

    const body = template
      ? renderTemplate(template.body, {
          client_name: selectedProject.clientName,
          progress_percentage: draftProject?.progressPercentage || selectedProject.progressPercentage,
          project_status: draftProject?.currentStatus || selectedProject.currentStatus,
          project_title: draftProject?.projectTitle || selectedProject.projectTitle,
          service_type: draftProject?.serviceType || selectedProject.serviceType,
        })
      : `Hi ${selectedProject.clientName}, "${selectedProject.projectTitle}" is now at ${selectedProject.progressPercentage}% and the current status is ${selectedProject.currentStatus}.`;

    const url = buildWhatsAppUrl(selectedProject.whatsappNumber, body);
    if (!url) {
      flash('No WhatsApp number found for this client.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const projectSummary = {
    active: state.projects.filter(project =>
      ['Accepted', 'Brief Received', 'Quotation Sent', 'In Progress', 'First Draft Sent', 'Revision', 'Final Delivery'].includes(project.currentStatus)
    ).length,
    completed: state.projects.filter(project => project.currentStatus === 'Completed').length,
    delayed: state.projects.filter(project => project.deadline && project.currentStatus !== 'Completed').length,
  };

  return (
    <AdminShell
      eyebrow="Project Desk"
      title="Track delivery, milestones, files, and client-facing progress"
      description="This is the operational side of the client portal. Update the live status, curate milestones, add links, and keep the client dashboard accurate without exposing private admin notes."
    >
      {notice ? (
        <div
          style={{
            borderRadius: 18,
            padding: '14px 16px',
            border: '1px solid rgba(56,189,248,0.18)',
            background: 'rgba(14,165,233,0.12)',
            color: '#7dd3fc',
            fontWeight: 700,
          }}
        >
          {notice}
        </div>
      ) : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {[
          ['All projects', state.projects.length],
          ['Active', projectSummary.active],
          ['Completed', projectSummary.completed],
          ['With deadline', projectSummary.delayed],
        ].map(([label, value]) => (
          <article
            key={label}
            style={{
              borderRadius: 24,
              padding: '18px 20px',
              border: '1px solid rgba(148,163,184,0.14)',
              background: 'rgba(8,15,29,0.82)',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em' }}>{value}</div>
          </article>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <article
          style={{
            borderRadius: 28,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(8,15,29,0.82)',
            padding: 18,
            display: 'grid',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>Projects</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              {state.loading ? 'Loading...' : `${state.projects.length} project(s)`}
            </div>
          </div>

          {state.projects.map(project => (
            <button
              type="button"
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                setDraftProject(project);
              }}
              style={{
                textAlign: 'left',
                borderRadius: 20,
                padding: '15px 16px',
                border: `1px solid ${
                  selectedProject?.id === project.id
                    ? 'rgba(59,130,246,0.4)'
                    : 'rgba(148,163,184,0.14)'
                }`,
                background:
                  selectedProject?.id === project.id
                    ? 'linear-gradient(145deg, rgba(37,99,235,0.18), rgba(14,165,233,0.14))'
                    : 'rgba(15,23,42,0.72)',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{project.projectTitle}</div>
                <div style={{ color: '#7dd3fc', fontWeight: 800 }}>{project.progressPercentage}%</div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                {project.clientName} · {project.serviceType}
              </div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{project.currentStatus}</div>
            </button>
          ))}
        </article>

        <article
          style={{
            borderRadius: 28,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(8,15,29,0.82)',
            padding: 20,
            display: 'grid',
            gap: 18,
          }}
        >
          {!draftProject ? (
            <div style={{ color: '#94a3b8' }}>Select a project to manage it.</div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.05em' }}>
                    {draftProject.projectTitle}
                  </h2>
                  <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
                    {draftProject.clientName} · {draftProject.clientEmail}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => void saveProject()} style={buttonStyle('primary', state.saving)}>
                    {state.saving ? 'Saving...' : 'Save project'}
                  </button>
                  <button type="button" onClick={() => openProgressWhatsApp()} style={buttonStyle()}>
                    Send WhatsApp update
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <Field label="Project title">
                  <input
                    value={draftProject.projectTitle}
                    onChange={event =>
                      setDraftProject({ ...draftProject, projectTitle: event.target.value })
                    }
                    style={fieldInputStyle}
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={draftProject.currentStatus}
                    onChange={event =>
                      setDraftProject({
                        ...draftProject,
                        currentStatus: event.target.value as ClientProject['currentStatus'],
                      })
                    }
                    style={fieldInputStyle}
                  >
                    {PROJECT_STATUS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Progress %">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draftProject.progressPercentage}
                    onChange={event =>
                      setDraftProject({
                        ...draftProject,
                        progressPercentage: Number(event.target.value),
                      })
                    }
                    style={fieldInputStyle}
                  />
                </Field>
                <Field label="Payment status">
                  <select
                    value={draftProject.paymentStatus}
                    onChange={event =>
                      setDraftProject({
                        ...draftProject,
                        paymentStatus: event.target.value as ClientProject['paymentStatus'],
                      })
                    }
                    style={fieldInputStyle}
                  >
                    {PAYMENT_STATUS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Budget / price">
                  <input
                    value={draftProject.budgetPrice}
                    onChange={event =>
                      setDraftProject({ ...draftProject, budgetPrice: event.target.value })
                    }
                    style={fieldInputStyle}
                  />
                </Field>
                <Field label="Deadline">
                  <input
                    value={draftProject.deadline}
                    onChange={event =>
                      setDraftProject({ ...draftProject, deadline: event.target.value })
                    }
                    style={fieldInputStyle}
                  />
                </Field>
                <Field label="Next step" full>
                  <input
                    value={draftProject.nextStep}
                    onChange={event =>
                      setDraftProject({ ...draftProject, nextStep: event.target.value })
                    }
                    style={fieldInputStyle}
                  />
                </Field>
                <Field label="Requirements" full>
                  <textarea
                    rows={5}
                    value={draftProject.requirements}
                    onChange={event =>
                      setDraftProject({ ...draftProject, requirements: event.target.value })
                    }
                    style={fieldTextareaStyle}
                  />
                </Field>
                <Field label="Client-visible notes" full>
                  <textarea
                    rows={4}
                    value={draftProject.clientVisibleNotes}
                    onChange={event =>
                      setDraftProject({
                        ...draftProject,
                        clientVisibleNotes: event.target.value,
                      })
                    }
                    style={fieldTextareaStyle}
                  />
                </Field>
                <Field label="Private admin notes" full>
                  <textarea
                    rows={4}
                    value={draftProject.privateAdminNotes}
                    onChange={event =>
                      setDraftProject({
                        ...draftProject,
                        privateAdminNotes: event.target.value,
                      })
                    }
                    style={fieldTextareaStyle}
                  />
                </Field>
              </div>

              <section style={panelStyle}>
                <div style={sectionHeadingStyle}>Files / links</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {draftProject.resources.map(resource => (
                    <div
                      key={resource.id}
                      style={{
                        borderRadius: 18,
                        border: '1px solid rgba(148,163,184,0.14)',
                        padding: '12px 14px',
                        background: 'rgba(2,6,23,0.82)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{resource.label}</div>
                        <a href={resource.url} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc', textDecoration: 'none', fontSize: 13 }}>
                          {resource.url}
                        </a>
                        {resource.description ? (
                          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                            {resource.description}
                          </div>
                        ) : null}
                      </div>
                      <button type="button" onClick={() => removeResource(resource.id)} style={buttonStyle()}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  <Field label="Label">
                    <input
                      value={resourceDraft.label}
                      onChange={event =>
                        setResourceDraft(current => ({ ...current, label: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="URL">
                    <input
                      value={resourceDraft.url}
                      onChange={event =>
                        setResourceDraft(current => ({ ...current, url: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Description">
                    <input
                      value={resourceDraft.description}
                      onChange={event =>
                        setResourceDraft(current => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Client visible">
                    <select
                      value={resourceDraft.clientVisible ? 'yes' : 'no'}
                      onChange={event =>
                        setResourceDraft(current => ({
                          ...current,
                          clientVisible: event.target.value === 'yes',
                        }))
                      }
                      style={fieldInputStyle}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </Field>
                </div>
                <button type="button" onClick={() => addResourceToDraft()} style={buttonStyle()}>
                  Add link to project
                </button>
              </section>

              <section style={panelStyle}>
                <div style={sectionHeadingStyle}>Milestones</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {projectMilestones.map(milestone => (
                    <div
                      key={milestone.id}
                      style={{
                        borderRadius: 18,
                        border: '1px solid rgba(148,163,184,0.14)',
                        padding: '12px 14px',
                        background: 'rgba(2,6,23,0.82)',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 150px 120px auto',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{milestone.title}</div>
                        {milestone.description ? (
                          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                            {milestone.description}
                          </div>
                        ) : null}
                      </div>
                      <input
                        value={milestone.dueDate}
                        onChange={event =>
                          void patchMilestone(milestone.id, { dueDate: event.target.value })
                        }
                        style={fieldInputStyle}
                      />
                      <select
                        value={milestone.status}
                        onChange={event =>
                          void patchMilestone(milestone.id, {
                            status: event.target.value as ProjectMilestone['status'],
                          })
                        }
                        style={fieldInputStyle}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button type="button" onClick={() => void removeMilestone(milestone.id)} style={buttonStyle()}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  <Field label="Title">
                    <input
                      value={milestoneDraft.title}
                      onChange={event =>
                        setMilestoneDraft(current => ({ ...current, title: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Due date">
                    <input
                      value={milestoneDraft.dueDate}
                      onChange={event =>
                        setMilestoneDraft(current => ({ ...current, dueDate: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Order">
                    <input
                      value={milestoneDraft.order}
                      onChange={event =>
                        setMilestoneDraft(current => ({ ...current, order: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={milestoneDraft.status}
                      onChange={event =>
                        setMilestoneDraft(current => ({ ...current, status: event.target.value }))
                      }
                      style={fieldInputStyle}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </Field>
                  <Field label="Description" full>
                    <textarea
                      rows={3}
                      value={milestoneDraft.description}
                      onChange={event =>
                        setMilestoneDraft(current => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      style={fieldTextareaStyle}
                    />
                  </Field>
                </div>
                <button type="button" onClick={() => void addMilestone()} style={buttonStyle()}>
                  Add milestone
                </button>
              </section>

              <section style={panelStyle}>
                <div style={sectionHeadingStyle}>Project updates</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {projectUpdates.map(update => (
                    <div
                      key={update.id}
                      style={{
                        borderRadius: 18,
                        border: '1px solid rgba(148,163,184,0.14)',
                        padding: '12px 14px',
                        background: 'rgba(2,6,23,0.82)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <div style={{ fontWeight: 700 }}>{update.title}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>
                          {new Date(update.createdAt).toLocaleString('en-GB')}
                        </div>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                        {update.type} · {update.visibility} · {update.statusSnapshot} · {update.progressSnapshot}%
                      </div>
                      <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                        {update.body}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  <Field label="Title">
                    <input
                      value={updateForm.title}
                      onChange={event =>
                        setUpdateForm(current => ({ ...current, title: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Type">
                    <select
                      value={updateForm.type}
                      onChange={event =>
                        setUpdateForm(current => ({
                          ...current,
                          type: event.target.value as UpdateFormState['type'],
                        }))
                      }
                      style={fieldInputStyle}
                    >
                      <option value="progress">progress</option>
                      <option value="delivery">delivery</option>
                      <option value="note">note</option>
                      <option value="payment">payment</option>
                      <option value="milestone">milestone</option>
                    </select>
                  </Field>
                  <Field label="Visibility">
                    <select
                      value={updateForm.visibility}
                      onChange={event =>
                        setUpdateForm(current => ({
                          ...current,
                          visibility: event.target.value as UpdateFormState['visibility'],
                        }))
                      }
                      style={fieldInputStyle}
                    >
                      <option value="client">client</option>
                      <option value="admin">admin</option>
                    </select>
                  </Field>
                  <Field label="Body" full>
                    <textarea
                      rows={4}
                      value={updateForm.body}
                      onChange={event =>
                        setUpdateForm(current => ({ ...current, body: event.target.value }))
                      }
                      style={fieldTextareaStyle}
                    />
                  </Field>
                </div>
                <button type="button" onClick={() => void addUpdateEntry()} style={buttonStyle()}>
                  Add project update
                </button>
              </section>
            </>
          )}
        </article>
      </section>
    </AdminShell>
  );
}

function Field({
  children,
  full = false,
  label,
}: {
  children: React.ReactNode;
  full?: boolean;
  label: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 8, gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
      {children}
    </label>
  );
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  padding: '11px 12px',
  border: '1px solid rgba(148,163,184,0.16)',
  background: 'rgba(2,6,23,0.92)',
  color: '#f8fafc',
  boxSizing: 'border-box',
};

const fieldTextareaStyle: React.CSSProperties = {
  ...fieldInputStyle,
  resize: 'vertical',
  lineHeight: 1.7,
};

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid rgba(148,163,184,0.14)',
  background: 'rgba(15,23,42,0.72)',
  padding: 18,
  display: 'grid',
  gap: 14,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: '-0.04em',
};

function buttonStyle(mode: 'default' | 'primary' = 'default', disabled = false) {
  return {
    borderRadius: 14,
    padding: '11px 14px',
    border:
      mode === 'primary'
        ? '1px solid rgba(56,189,248,0.24)'
        : '1px solid rgba(148,163,184,0.16)',
    background: disabled
      ? 'rgba(15,23,42,0.5)'
      : mode === 'primary'
        ? 'linear-gradient(135deg, rgba(37,99,235,0.96), rgba(14,165,233,0.88))'
        : 'rgba(2,6,23,0.9)',
    color: disabled ? '#64748b' : '#f8fafc',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
  } as const;
}
