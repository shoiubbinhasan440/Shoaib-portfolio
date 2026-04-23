'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import {
  buildWhatsAppUrl,
  LEAD_CATEGORY_OPTIONS,
  LEAD_PRIORITY_OPTIONS,
  LEAD_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  renderTemplate,
  SERVICE_TYPE_OPTIONS,
} from '@/lib/crm-shared';
import type {
  ClientAccount,
  ClientProject,
  ContactLead,
  CreativeBrief,
  MessageTemplate,
  RateTemplate,
} from '@/lib/crm';

type InboxState = {
  briefs: CreativeBrief[];
  clients: ClientAccount[];
  leads: ContactLead[];
  loading: boolean;
  messageTemplates: MessageTemplate[];
  projects: ClientProject[];
  rateTemplates: RateTemplate[];
};

type ProjectFormState = {
  budgetPrice: string;
  clientVisibleNotes: string;
  currentStatus: string;
  deadline: string;
  nextStep: string;
  paymentStatus: string;
  privateAdminNotes: string;
  progressPercentage: string;
  projectTitle: string;
  requirements: string;
  serviceType: string;
};

function createProjectForm(lead?: ContactLead | null): ProjectFormState {
  return {
    budgetPrice: lead?.budgetRange || '',
    clientVisibleNotes: '',
    currentStatus: 'Accepted',
    deadline: lead?.deadline || '',
    nextStep: 'Confirm kickoff details and share the first milestone.',
    paymentStatus: 'Pending',
    privateAdminNotes: '',
    progressPercentage: '10',
    projectTitle: lead?.projectType || '',
    requirements: lead?.message || '',
    serviceType: lead?.serviceType || 'Other',
  };
}

export default function AdminInboxPage() {
  const [state, setState] = useState<InboxState>({
    briefs: [],
    clients: [],
    leads: [],
    loading: true,
    messageTemplates: [],
    projects: [],
    rateTemplates: [],
  });
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [whatsAppDraft, setWhatsAppDraft] = useState('');
  const [savingMessage, setSavingMessage] = useState('');
  const [projectForm, setProjectForm] = useState<ProjectFormState>(createProjectForm());
  const [creatingProject, setCreatingProject] = useState(false);
  const noticeTimerRef = useRef<number | undefined>(undefined);

  async function loadInbox() {
    setState(current => ({ ...current, loading: true }));
    try {
      const [leadResponse, templateResponse, briefResponse, projectResponse] =
        await Promise.all([
          fetch('/api/contact'),
          fetch('/api/admin/templates'),
          fetch('/api/admin/briefs'),
          fetch('/api/admin/projects'),
        ]);

      const leadData = leadResponse.ok
        ? ((await leadResponse.json()) as { leads: ContactLead[] })
        : { leads: [] };
      const templateData = templateResponse.ok
        ? ((await templateResponse.json()) as {
            messageTemplates: MessageTemplate[];
            rateTemplates: RateTemplate[];
          })
        : { messageTemplates: [], rateTemplates: [] };
      const briefData = briefResponse.ok
        ? ((await briefResponse.json()) as { briefs: CreativeBrief[] })
        : { briefs: [] };
      const projectData = projectResponse.ok
        ? ((await projectResponse.json()) as {
            clients: ClientAccount[];
            projects: ClientProject[];
          })
        : { clients: [], projects: [] };

      setState({
        briefs: briefData.briefs || [],
        clients: projectData.clients || [],
        leads: leadData.leads || [],
        loading: false,
        messageTemplates: templateData.messageTemplates || [],
        projects: projectData.projects || [],
        rateTemplates: templateData.rateTemplates || [],
      });
    } catch {
      setState(current => ({ ...current, loading: false }));
    }
  }

  useEffect(() => {
    void loadInbox();
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.leads.filter(lead => {
      const searchableText = [
        lead.name,
        lead.email,
        lead.mobileNumber,
        lead.whatsappNumber,
        lead.serviceType,
        lead.projectType,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || searchableText.includes(query);
      const matchesCategory = categoryFilter === 'All' || lead.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;

      return matchesQuery && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [categoryFilter, priorityFilter, search, state.leads, statusFilter]);

  useEffect(() => {
    if (!filteredLeads.length) {
      setSelectedLeadId('');
      return;
    }

    const stillExists = filteredLeads.some(lead => lead.id === selectedLeadId);
    if (!stillExists) {
      setSelectedLeadId(filteredLeads[0]?.id || '');
    }
  }, [filteredLeads, selectedLeadId]);

  const selectedLead =
    filteredLeads.find(lead => lead.id === selectedLeadId) ||
    state.leads.find(lead => lead.id === selectedLeadId) ||
    null;

  const selectedBrief = selectedLead
    ? state.briefs.find(
        brief => brief.id === selectedLead.briefId || brief.leadId === selectedLead.id
      ) || null
    : null;

  const selectedProject = selectedLead
    ? state.projects.find(
        project => project.id === selectedLead.projectId || project.leadId === selectedLead.id
      ) || null
    : null;

  const selectedClient =
    (selectedProject
      ? state.clients.find(client => client.id === selectedProject.clientId)
      : null) ||
    (selectedLead
      ? state.clients.find(client => client.id === selectedLead.clientId)
      : null) ||
    null;

  useEffect(() => {
    if (selectedLead) {
      setProjectForm(current => {
        if (current.projectTitle || current.requirements) {
          return current;
        }

        return createProjectForm(selectedLead);
      });
    }
  }, [selectedLead]);

  const baseVariables = selectedLead
    ? {
        access_code: selectedClient?.portalAccessCode || '',
        brief_link:
          selectedBrief && typeof window !== 'undefined'
            ? `${window.location.origin}/brief/${selectedBrief.token}`
            : '',
        budget_range: selectedLead.budgetRange,
        client_name: selectedLead.name,
        deadline: selectedProject?.deadline || selectedLead.deadline || 'To be confirmed',
        portal_login_url:
          typeof window !== 'undefined' ? `${window.location.origin}/client/login` : '',
        price: selectedProject?.budgetPrice || selectedLead.budgetRange,
        progress_percentage: selectedProject?.progressPercentage ?? 0,
        project_status: selectedProject?.currentStatus || selectedLead.status,
        project_title: selectedProject?.projectTitle || selectedLead.projectType,
        service_type: selectedProject?.serviceType || selectedLead.serviceType,
      }
    : null;

  function pushNotice(message: string) {
    setSavingMessage(message);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = window.setTimeout(() => {
      setSavingMessage('');
    }, 2800);
  }

  async function patchLead(id: string, patch: Record<string, unknown>) {
    const response = await fetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error || 'Failed to update lead.');
    }

    await loadInbox();
  }

  async function deleteLead(id: string) {
    const response = await fetch(`/api/contact?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error || 'Failed to delete lead.');
    }

    await loadInbox();
  }

  function applyMessageTemplate(templateKey: MessageTemplate['key']) {
    if (!selectedLead || !baseVariables) {
      return;
    }

    const template = state.messageTemplates.find(item => item.key === templateKey);
    if (!template) {
      return;
    }

    setWhatsAppDraft(renderTemplate(template.body, baseVariables));
  }

  async function prepareProjectAcceptedDraft(forceRegenerate = false) {
    if (!selectedLead || !baseVariables) {
      return;
    }

    if (!selectedProject) {
      pushNotice('Create the project first to prepare portal access.');
      return;
    }

    const response = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'portal-access',
        forceRegenerate,
        leadId: selectedLead.id,
      }),
    });
    const result = (await response.json()) as {
      accessCode?: string;
      error?: string;
      project?: ClientProject;
    };

    if (!response.ok || !result.accessCode) {
      throw new Error(result.error || 'Failed to prepare portal access.');
    }

    await loadInbox();
    const template = state.messageTemplates.find(
      item => item.key === 'project_accepted'
    );
    const body = template
      ? renderTemplate(template.body, {
          ...baseVariables,
          access_code: result.accessCode,
          portal_login_url:
            typeof window !== 'undefined'
              ? `${window.location.origin}/client/login`
              : '/client/login',
          progress_percentage:
            result.project?.progressPercentage ?? selectedProject.progressPercentage,
          project_status: result.project?.currentStatus || selectedProject.currentStatus,
          project_title: result.project?.projectTitle || selectedProject.projectTitle,
          service_type: result.project?.serviceType || selectedProject.serviceType,
        })
      : `Hi ${selectedLead.name}, your project has been accepted. Login here: ${window.location.origin}/client/login Access code: ${result.accessCode}`;

    setWhatsAppDraft(body);
    pushNotice(
      forceRegenerate
        ? 'New portal access code generated.'
        : 'Portal access message prepared.'
    );
  }

  function applyRateTemplate(rateTemplateId: string) {
    if (!selectedLead || !baseVariables) {
      return;
    }

    const template = state.rateTemplates.find(item => item.id === rateTemplateId);
    if (!template) {
      return;
    }

    setWhatsAppDraft(
      renderTemplate(template.messageBody, {
        ...baseVariables,
        deadline: template.deliveryTime,
        price: template.priceRange,
        service_type: template.serviceType,
      })
    );
  }

  async function openWhatsApp() {
    if (!selectedLead) {
      return;
    }

    const url = buildWhatsAppUrl(
      selectedLead.whatsappNumber || selectedLead.mobileNumber,
      whatsAppDraft
    );

    if (!url) {
      pushNotice('No WhatsApp number found for this lead.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    await patchLead(selectedLead.id, {
      lastContactedAt: new Date().toISOString(),
      read: true,
      status: 'Pending Reply',
    });
    pushNotice('Opened WhatsApp reply.');
  }

  async function generateBriefLink() {
    if (!selectedLead) {
      return;
    }

    const response = await fetch('/api/admin/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selectedLead.id }),
    });
    const result = (await response.json()) as { brief?: CreativeBrief; error?: string };

    if (!response.ok || !result.brief) {
      throw new Error(result.error || 'Failed to create brief.');
    }

    await loadInbox();
    const briefLink =
      typeof window !== 'undefined'
        ? `${window.location.origin}/brief/${result.brief.token}`
        : `/brief/${result.brief.token}`;
    const template = state.messageTemplates.find(
      item => item.key === 'creative_brief_request'
    );
    const body = template
      ? renderTemplate(template.body, {
          ...baseVariables,
          brief_link: briefLink,
        })
      : `Hi ${selectedLead.name}, please fill in the creative brief here: ${briefLink}`;

    setWhatsAppDraft(body);
    pushNotice('Creative brief link generated.');
  }

  async function convertLeadToProject() {
    if (!selectedLead) {
      return;
    }

    setCreatingProject(true);
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectForm,
          leadId: selectedLead.id,
          progressPercentage: Number(projectForm.progressPercentage || 0),
        }),
      });

      const result = (await response.json()) as {
        accessCode?: string;
        error?: string;
        project?: ClientProject;
      };

      if (!response.ok || !result.project) {
        throw new Error(result.error || 'Failed to create project.');
      }

      await loadInbox();
      const template = state.messageTemplates.find(
        item => item.key === 'project_accepted'
      );
      const body = template
        ? renderTemplate(template.body, {
            ...baseVariables,
            access_code: result.accessCode || '',
            portal_login_url:
              typeof window !== 'undefined'
                ? `${window.location.origin}/client/login`
                : '/client/login',
            progress_percentage: result.project.progressPercentage,
            project_status: result.project.currentStatus,
            project_title: result.project.projectTitle,
          })
        : `Hi ${selectedLead.name}, your project has been accepted. Login here: ${window.location.origin}/client/login Access code: ${result.accessCode || ''}`;

      setWhatsAppDraft(body);
      pushNotice('Project created and portal access prepared.');
    } finally {
      setCreatingProject(false);
    }
  }

  const stats = {
    activeProjects: state.leads.filter(lead => lead.category === 'Active Project').length,
    important: state.leads.filter(lead => lead.important).length,
    unread: state.leads.filter(lead => !lead.read && !lead.archived).length,
  };

  return (
    <AdminShell
      eyebrow="Lead Inbox"
      title="Dedicated admin inbox for contact leads"
      description="Review every inbound message from a separate CRM-style inbox, qualify the lead, reply on WhatsApp, send packages or briefs, and convert accepted work into a client project."
    >
      {savingMessage ? (
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
          {savingMessage}
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
          ['Unread / New', stats.unread],
          ['Important', stats.important],
          ['Filtered leads', filteredLeads.length],
          ['Active projects', stats.activeProjects],
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
          borderRadius: 28,
          border: '1px solid rgba(148,163,184,0.14)',
          background: 'rgba(8,15,29,0.82)',
          padding: 20,
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by name, email, mobile, service..."
            style={{
              width: '100%',
              borderRadius: 14,
              padding: '12px 14px',
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.82)',
              color: '#f8fafc',
            }}
          />
          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
            style={{
              borderRadius: 14,
              padding: '12px 14px',
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.82)',
              color: '#f8fafc',
            }}
          >
            <option value="All">All categories</option>
            {LEAD_CATEGORY_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            style={{
              borderRadius: 14,
              padding: '12px 14px',
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.82)',
              color: '#f8fafc',
            }}
          >
            <option value="All">All statuses</option>
            {LEAD_STATUS_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={event => setPriorityFilter(event.target.value)}
            style={{
              borderRadius: 14,
              padding: '12px 14px',
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.82)',
              color: '#f8fafc',
            }}
          >
            <option value="All">All priorities</option>
            {LEAD_PRIORITY_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>All leads</div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                {state.loading ? 'Loading...' : `${filteredLeads.length} visible lead(s)`}
              </div>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>No leads match these filters.</div>
          ) : (
            filteredLeads.map(lead => {
              const active = selectedLead?.id === lead.id;
              const brief = state.briefs.find(item => item.leadId === lead.id);
              const project = state.projects.find(item => item.leadId === lead.id);
              return (
                <button
                  type="button"
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setProjectForm(createProjectForm(lead));
                    setWhatsAppDraft('');
                  }}
                  style={{
                    textAlign: 'left',
                    borderRadius: 20,
                    padding: '16px 16px',
                    border: `1px solid ${
                      active ? 'rgba(59,130,246,0.4)' : 'rgba(148,163,184,0.14)'
                    }`,
                    background: active
                      ? 'linear-gradient(145deg, rgba(37,99,235,0.18), rgba(14,165,233,0.14))'
                      : 'rgba(15,23,42,0.7)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>{lead.name}</div>
                    {!lead.read ? (
                      <span style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>
                    {lead.serviceType} · {lead.intentCategory}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[lead.category, lead.status, lead.priority].map(badge => (
                      <span
                        key={badge}
                        style={{
                          borderRadius: 999,
                          padding: '5px 9px',
                          background: 'rgba(30,41,59,0.9)',
                          color: '#cbd5e1',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                    {lead.important ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '5px 9px',
                          background: 'rgba(251,191,36,0.18)',
                          color: '#fcd34d',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Important
                      </span>
                    ) : null}
                    {brief ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '5px 9px',
                          background: 'rgba(59,130,246,0.16)',
                          color: '#7dd3fc',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Brief {brief.status}
                      </span>
                    ) : null}
                    {project ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '5px 9px',
                          background: 'rgba(34,197,94,0.18)',
                          color: '#86efac',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Project created
                      </span>
                    ) : null}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>
                    {new Date(lead.createdAt).toLocaleString('en-GB')}
                  </div>
                </button>
              );
            })
          )}
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
          {!selectedLead ? (
            <div style={{ color: '#94a3b8', fontSize: 15 }}>Select a lead to review the full conversation details.</div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.05em' }}>
                    {selectedLead.name}
                  </h2>
                  <div style={{ color: '#94a3b8', marginTop: 8, fontSize: 14 }}>
                    {selectedLead.email} · {selectedLead.mobileNumber}
                    {selectedLead.whatsappNumber ? ` · ${selectedLead.whatsappNumber}` : ''}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
                    Submitted {new Date(selectedLead.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => void patchLead(selectedLead.id, { read: !selectedLead.read })}
                    style={{
                      borderRadius: 14,
                      padding: '10px 12px',
                      border: '1px solid rgba(148,163,184,0.16)',
                      background: 'rgba(15,23,42,0.76)',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedLead.read ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void patchLead(selectedLead.id, { important: !selectedLead.important })
                    }
                    style={{
                      borderRadius: 14,
                      padding: '10px 12px',
                      border: '1px solid rgba(251,191,36,0.18)',
                      background: 'rgba(251,191,36,0.12)',
                      color: '#fcd34d',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedLead.important ? 'Remove importance' : 'Mark important'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchLead(selectedLead.id, { archived: true, status: 'Archived' })}
                    style={{
                      borderRadius: 14,
                      padding: '10px 12px',
                      border: '1px solid rgba(148,163,184,0.16)',
                      background: 'rgba(15,23,42,0.76)',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteLead(selectedLead.id)}
                    style={{
                      borderRadius: 14,
                      padding: '10px 12px',
                      border: '1px solid rgba(248,113,113,0.18)',
                      background: 'rgba(127,29,29,0.2)',
                      color: '#fca5a5',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[selectedLead.category, selectedLead.status, selectedLead.priority].map(badge => (
                  <span
                    key={badge}
                    style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      background: 'rgba(30,41,59,0.88)',
                      color: '#cbd5e1',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {badge}
                  </span>
                ))}
                {!selectedLead.read ? (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      background: 'rgba(59,130,246,0.16)',
                      color: '#7dd3fc',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    New lead
                  </span>
                ) : null}
                {selectedBrief ? (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      background: 'rgba(59,130,246,0.16)',
                      color: '#7dd3fc',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Brief {selectedBrief.status}
                  </span>
                ) : null}
                {selectedProject ? (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      background: 'rgba(34,197,94,0.16)',
                      color: '#86efac',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Active project
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                {[
                  ['Service type', selectedLead.serviceType],
                  ['Project type', selectedLead.projectType],
                  ['Budget', selectedLead.budgetRange],
                  ['Deadline', selectedLead.deadline || 'Not specified'],
                  ['Intent', selectedLead.intentCategory],
                  ['Contact method', selectedLead.preferredContactMethod],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 18,
                      border: '1px solid rgba(148,163,184,0.12)',
                      padding: '14px 16px',
                      background: 'rgba(15,23,42,0.72)',
                    }}
                  >
                    <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {selectedLead.attachmentLink ? (
                <a
                  href={selectedLead.attachmentLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#7dd3fc',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Open attached file / link
                </a>
              ) : null}

              <div
                style={{
                  borderRadius: 22,
                  border: '1px solid rgba(148,163,184,0.12)',
                  background: 'rgba(15,23,42,0.72)',
                  padding: 18,
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.85,
                }}
              >
                {selectedLead.message}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Category</span>
                  <select
                    value={selectedLead.category}
                    onChange={event =>
                      void patchLead(selectedLead.id, { category: event.target.value })
                    }
                    style={{
                      borderRadius: 14,
                      padding: '11px 12px',
                      border: '1px solid rgba(148,163,184,0.16)',
                      background: 'rgba(15,23,42,0.82)',
                      color: '#f8fafc',
                    }}
                  >
                    {LEAD_CATEGORY_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Status</span>
                  <select
                    value={selectedLead.status}
                    onChange={event =>
                      void patchLead(selectedLead.id, { status: event.target.value })
                    }
                    style={{
                      borderRadius: 14,
                      padding: '11px 12px',
                      border: '1px solid rgba(148,163,184,0.16)',
                      background: 'rgba(15,23,42,0.82)',
                      color: '#f8fafc',
                    }}
                  >
                    {LEAD_STATUS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Priority</span>
                  <select
                    value={selectedLead.priority}
                    onChange={event =>
                      void patchLead(selectedLead.id, { priority: event.target.value })
                    }
                    style={{
                      borderRadius: 14,
                      padding: '11px 12px',
                      border: '1px solid rgba(148,163,184,0.16)',
                      background: 'rgba(15,23,42,0.82)',
                      color: '#f8fafc',
                    }}
                  >
                    {LEAD_PRIORITY_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <section
                style={{
                  borderRadius: 24,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: 'rgba(15,23,42,0.72)',
                  padding: 18,
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    WhatsApp Reply
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>
                    Quick reply actions
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => applyMessageTemplate('greeting_reply')}
                    style={quickButtonStyle()}
                  >
                    Send greeting
                  </button>
                  <button
                    type="button"
                    onClick={() => void prepareProjectAcceptedDraft()}
                    style={quickButtonStyle()}
                  >
                    Acceptance message
                  </button>
                  <button
                    type="button"
                    onClick={() => applyMessageTemplate('progress_update')}
                    style={quickButtonStyle()}
                  >
                    Progress update
                  </button>
                  <button
                    type="button"
                    onClick={() => void generateBriefLink()}
                    style={quickButtonStyle('primary')}
                  >
                    Creative brief request
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                  }}
                >
                  {state.rateTemplates.map(template => (
                    <button
                      type="button"
                      key={template.id}
                      onClick={() => applyRateTemplate(template.id)}
                      style={quickButtonStyle()}
                    >
                      {template.title}
                    </button>
                  ))}
                </div>

                <textarea
                  value={whatsAppDraft}
                  onChange={event => setWhatsAppDraft(event.target.value)}
                  placeholder="Choose a quick action or type a custom WhatsApp message here..."
                  rows={7}
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    padding: 14,
                    border: '1px solid rgba(148,163,184,0.16)',
                    background: 'rgba(2,6,23,0.92)',
                    color: '#f8fafc',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.7,
                  }}
                />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => void openWhatsApp()}
                    style={quickButtonStyle('primary')}
                  >
                    Open WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsAppDraft('')}
                    style={quickButtonStyle()}
                  >
                    Clear draft
                  </button>
                </div>
              </section>

              <section
                style={{
                  borderRadius: 24,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: 'rgba(15,23,42,0.72)',
                  padding: 18,
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Project Conversion
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>
                    Convert lead into a client project
                  </div>
                </div>

                {selectedProject ? (
                  <div
                    style={{
                      borderRadius: 18,
                      padding: '14px 16px',
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.18)',
                      color: '#86efac',
                    }}
                  >
                    Project already created: <strong>{selectedProject.projectTitle}</strong> ({selectedProject.currentStatus}, {selectedProject.progressPercentage}%)
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  <Field label="Project title">
                    <input
                      value={projectForm.projectTitle}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, projectTitle: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Service type">
                    <select
                      value={projectForm.serviceType}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, serviceType: event.target.value }))
                      }
                      style={fieldInputStyle}
                    >
                      {SERVICE_TYPE_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Budget / price">
                    <input
                      value={projectForm.budgetPrice}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, budgetPrice: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Deadline">
                    <input
                      value={projectForm.deadline}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, deadline: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={projectForm.currentStatus}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, currentStatus: event.target.value }))
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
                      value={projectForm.progressPercentage}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, progressPercentage: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Payment status">
                    <select
                      value={projectForm.paymentStatus}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, paymentStatus: event.target.value }))
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
                  <Field label="Next step">
                    <input
                      value={projectForm.nextStep}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, nextStep: event.target.value }))
                      }
                      style={fieldInputStyle}
                    />
                  </Field>
                  <Field label="Requirements" full>
                    <textarea
                      value={projectForm.requirements}
                      onChange={event =>
                        setProjectForm(current => ({ ...current, requirements: event.target.value }))
                      }
                      rows={5}
                      style={fieldTextareaStyle}
                    />
                  </Field>
                  <Field label="Client-visible notes" full>
                    <textarea
                      value={projectForm.clientVisibleNotes}
                      onChange={event =>
                        setProjectForm(current => ({
                          ...current,
                          clientVisibleNotes: event.target.value,
                        }))
                      }
                      rows={3}
                      style={fieldTextareaStyle}
                    />
                  </Field>
                  <Field label="Private admin notes" full>
                    <textarea
                      value={projectForm.privateAdminNotes}
                      onChange={event =>
                        setProjectForm(current => ({
                          ...current,
                          privateAdminNotes: event.target.value,
                        }))
                      }
                      rows={3}
                      style={fieldTextareaStyle}
                    />
                  </Field>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => void convertLeadToProject()}
                    disabled={creatingProject || Boolean(selectedProject)}
                    style={quickButtonStyle('primary', creatingProject || Boolean(selectedProject))}
                  >
                    {creatingProject ? 'Creating project...' : 'Convert to project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectForm(createProjectForm(selectedLead))}
                    style={quickButtonStyle()}
                  >
                    Reset form
                  </button>
                </div>
              </section>
            </>
          )}
        </article>
      </section>
    </AdminShell>
  );
}

function quickButtonStyle(mode: 'default' | 'primary' = 'default', disabled = false) {
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
        : 'rgba(2,6,23,0.88)',
    color: disabled ? '#64748b' : '#f8fafc',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
  } as const;
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
  minHeight: 120,
};
