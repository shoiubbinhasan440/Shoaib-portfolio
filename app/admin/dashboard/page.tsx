'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminModuleGrid from '@/components/admin/AdminModuleGrid';
import AdminShell from '@/components/admin/AdminShell';
import { useTheme } from '@/components/ThemeProvider';
import type { ClientProject, ContactLead, CreativeBrief } from '@/lib/crm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DashboardState = {
  briefs: CreativeBrief[];
  categories: number;
  graphics: number;
  leads: ContactLead[];
  loading: boolean;
  projects: ClientProject[];
  videos: number;
  views: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-GB');
}

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [state, setState] = useState<DashboardState>({
    briefs: [],
    categories: 0,
    graphics: 0,
    leads: [],
    loading: true,
    projects: [],
    videos: 0,
    views: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [leadResponse, briefResponse, projectResponse, videos, graphics, categories, views] =
          await Promise.all([
            fetch('/api/contact'),
            fetch('/api/admin/briefs'),
            fetch('/api/admin/projects'),
            supabase.from('videos').select('id', { count: 'exact' }),
            supabase.from('graphics').select('id', { count: 'exact' }),
            supabase.from('categories').select('id', { count: 'exact' }),
            supabase.from('page_views').select('id', { count: 'exact' }),
          ]);

        const leadData = leadResponse.ok
          ? ((await leadResponse.json()) as { leads: ContactLead[] })
          : { leads: [] };
        const briefData = briefResponse.ok
          ? ((await briefResponse.json()) as { briefs: CreativeBrief[] })
          : { briefs: [] };
        const projectData = projectResponse.ok
          ? ((await projectResponse.json()) as { projects: ClientProject[] })
          : { projects: [] };

        setState({
          briefs: briefData.briefs || [],
          categories: categories.count || 0,
          graphics: graphics.count || 0,
          leads: leadData.leads || [],
          loading: false,
          projects: projectData.projects || [],
          videos: videos.count || 0,
          views: views.count || 0,
        });
      } catch {
        setState(current => ({ ...current, loading: false }));
      }
    }

    void load();
  }, []);

  const panel = dark ? 'rgba(8,15,29,0.84)' : 'rgba(255,255,255,0.92)';
  const softPanel = dark ? 'rgba(15,23,42,0.74)' : 'rgba(248,250,252,0.94)';
  const line = dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#475569';
  const subtle = dark ? '#64748b' : '#64748b';
  const shadow = dark ? '0 20px 50px rgba(15,23,42,0.18)' : '0 20px 50px rgba(15,23,42,0.08)';

  const metrics = useMemo(() => {
    const unreadLeads = state.leads.filter(lead => !lead.read && !lead.archived).length;
    const activeProjects = state.projects.filter(project =>
      [
        'Accepted',
        'In Progress',
        'First Draft Sent',
        'Revision',
        'Final Delivery',
        'Brief Received',
        'Quotation Sent',
      ].includes(project.currentStatus)
    ).length;
    const pendingBriefs = state.briefs.filter(brief => brief.status !== 'submitted').length;
    const completedProjects = state.projects.filter(
      project => project.currentStatus === 'Completed'
    ).length;

    return [
      {
        label: 'Unread Leads',
        value: unreadLeads,
        note: unreadLeads > 0 ? 'Needs review' : 'Inbox is clear',
        accent: 'linear-gradient(135deg, rgba(14,165,233,0.22), rgba(37,99,235,0.18))',
      },
      {
        label: 'Active Projects',
        value: activeProjects,
        note: activeProjects > 0 ? 'Client delivery live' : 'No active delivery',
        accent: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.16))',
      },
      {
        label: 'Briefs Pending',
        value: pendingBriefs,
        note: pendingBriefs > 0 ? 'Follow up pending' : 'No brief bottlenecks',
        accent: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.16))',
      },
      {
        label: 'Completed',
        value: completedProjects,
        note: completedProjects > 0 ? 'Delivered projects archived' : 'Nothing closed yet',
        accent: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.14))',
      },
      {
        label: 'Videos',
        value: state.videos,
        note: 'Published video library',
        accent: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(14,165,233,0.14))',
      },
      {
        label: 'Graphics',
        value: state.graphics,
        note: 'Visual asset library',
        accent: 'linear-gradient(135deg, rgba(244,114,182,0.16), rgba(168,85,247,0.14))',
      },
      {
        label: 'Categories',
        value: state.categories,
        note: 'Shared taxonomy',
        accent: 'linear-gradient(135deg, rgba(56,189,248,0.16), rgba(45,212,191,0.14))',
      },
      {
        label: 'Visitors',
        value: state.views,
        note: 'Tracked page views',
        accent: 'linear-gradient(135deg, rgba(148,163,184,0.16), rgba(99,102,241,0.14))',
      },
    ];
  }, [state]);

  const recentLeads = state.leads.slice(0, 5);
  const recentProjects = state.projects.slice(0, 5);
  const quickActions = [
    { href: '/admin/inbox', label: 'Review inbox', meta: 'Qualify new leads and reply fast' },
    { href: '/admin/projects', label: 'Update projects', meta: 'Move delivery status and milestones' },
    { href: '/admin/templates', label: 'Refine templates', meta: 'Adjust rates, replies, and brief messages' },
    { href: '/admin/contact', label: 'Tune contact page', meta: 'Improve the public conversion path' },
  ];
  const systemStatus = [
    {
      label: 'Client portal',
      value: state.projects.length > 0 ? 'Active' : 'Ready',
      meta: state.projects.length > 0
        ? `${state.projects.length} project record${state.projects.length === 1 ? '' : 's'} connected`
        : 'Portal access becomes active once projects are created',
    },
    {
      label: 'Brief workflow',
      value: state.briefs.length > 0 ? `${state.briefs.length} brief${state.briefs.length === 1 ? '' : 's'}` : 'Ready',
      meta: state.briefs.filter(brief => brief.status === 'submitted').length > 0
        ? `${state.briefs.filter(brief => brief.status === 'submitted').length} submitted`
        : 'No submitted briefs yet',
    },
    {
      label: 'Content library',
      value: `${state.videos + state.graphics}`,
      meta: `${state.videos} videos and ${state.graphics} graphics available`,
    },
  ];

  return (
    <AdminShell
      eyebrow="Admin Dashboard"
      title="Run your portfolio like a client-ready studio"
      description="The CRM, client delivery, and site builders now live in a clearer operating system with module visibility, quick actions, and mobile-safe navigation."
      actions={
        <>
          <Link
            href="/admin/inbox"
            style={{
              borderRadius: 16,
              padding: '12px 18px',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 18px 40px rgba(37,99,235,0.26)',
            }}
          >
            Open Inbox
          </Link>
          <Link
            href="/admin/projects"
            style={{
              borderRadius: 16,
              padding: '12px 18px',
              background: softPanel,
              color: text,
              border: `1px solid ${line}`,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Manage Projects
          </Link>
        </>
      }
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {metrics.map(metric => (
          <article
            key={metric.label}
            style={{
              borderRadius: 24,
              padding: '20px 22px',
              border: `1px solid ${line}`,
              background: metric.accent,
              boxShadow: shadow,
            }}
          >
            <div style={{ color: muted, fontSize: 13, marginBottom: 10 }}>{metric.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.06em', marginBottom: 8 }}>
              {state.loading ? '...' : metric.value}
            </div>
            <div style={{ color: subtle, fontSize: 12 }}>{metric.note}</div>
          </article>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 18,
        }}
      >
        <article
          style={{
            borderRadius: 28,
            border: `1px solid ${line}`,
            background: panel,
            padding: 22,
            boxShadow: shadow,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Quick Actions
            </div>
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
              Jump into your highest-impact admin flows
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {quickActions.map(action => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  borderRadius: 20,
                  padding: '16px 18px',
                  border: `1px solid ${line}`,
                  background: softPanel,
                  textDecoration: 'none',
                  color: text,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{action.label}</div>
                <div style={{ color: muted, fontSize: 13, lineHeight: 1.7 }}>{action.meta}</div>
              </Link>
            ))}
          </div>
        </article>

        <article
          style={{
            borderRadius: 28,
            border: `1px solid ${line}`,
            background: panel,
            padding: 22,
            boxShadow: shadow,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              System Status
            </div>
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
              Studio health at a glance
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {systemStatus.map(item => (
              <div
                key={item.label}
                style={{
                  borderRadius: 20,
                  padding: '16px 18px',
                  border: `1px solid ${line}`,
                  background: softPanel,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{item.label}</div>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '4px 8px',
                      background: 'rgba(56,189,248,0.12)',
                      color: '#7dd3fc',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
                <div style={{ color: muted, fontSize: 13, lineHeight: 1.7 }}>{item.meta}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 18,
        }}
      >
        <article
          style={{
            borderRadius: 28,
            border: `1px solid ${line}`,
            background: panel,
            padding: 22,
            boxShadow: shadow,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}
          >
            <div>
              <div
                style={{
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Lead Pipeline
              </div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
                Recent inbox activity
              </h2>
            </div>
            <Link href="/admin/inbox" style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 700 }}>
              View all
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {recentLeads.length === 0 ? (
              <div
                style={{
                  borderRadius: 20,
                  border: `1px dashed ${line}`,
                  background: softPanel,
                  padding: '18px 20px',
                  color: muted,
                  fontSize: 14,
                }}
              >
                No leads yet. New contact submissions will show here first.
              </div>
            ) : (
              recentLeads.map(lead => (
                <div
                  key={lead.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: `1px solid ${line}`,
                    background: softPanel,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{lead.name}</div>
                      <div style={{ color: muted, fontSize: 13 }}>
                        {lead.contactPurpose || lead.intentCategory || 'Message'} ·{' '}
                        {lead.serviceType || 'General'}
                      </div>
                    </div>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '4px 8px',
                        background: lead.read ? 'rgba(15,23,42,0.82)' : 'rgba(37,99,235,0.22)',
                        color: lead.read ? '#cbd5e1' : '#7dd3fc',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        alignSelf: 'flex-start',
                      }}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div style={{ color: subtle, fontSize: 12 }}>{formatDate(lead.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </article>

        <article
          style={{
            borderRadius: 28,
            border: `1px solid ${line}`,
            background: panel,
            padding: 22,
            boxShadow: shadow,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}
          >
            <div>
              <div
                style={{
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Client Delivery
              </div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
                Project watchlist
              </h2>
            </div>
            <Link
              href="/admin/projects"
              style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 700 }}
            >
              Open projects
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {recentProjects.length === 0 ? (
              <div
                style={{
                  borderRadius: 20,
                  border: `1px dashed ${line}`,
                  background: softPanel,
                  padding: '18px 20px',
                  color: muted,
                  fontSize: 14,
                }}
              >
                No projects created yet. Convert a lead from the inbox to start client delivery.
              </div>
            ) : (
              recentProjects.map(project => (
                <div
                  key={project.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: `1px solid ${line}`,
                    background: softPanel,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{project.projectTitle}</div>
                      <div style={{ color: muted, fontSize: 13, marginTop: 4 }}>
                        {project.clientName} · {project.serviceType}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800 }}>{project.progressPercentage}%</div>
                      <div style={{ color: subtle, fontSize: 12 }}>{project.currentStatus}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: dark ? 'rgba(30,41,59,0.9)' : 'rgba(226,232,240,0.9)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${project.progressPercentage}%`,
                        height: '100%',
                        background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section
        style={{
          borderRadius: 28,
          border: `1px solid ${line}`,
          background: panel,
          padding: 22,
          boxShadow: shadow,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              color: '#38bdf8',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Admin Tools / Modules
          </div>
          <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
            Every admin program in one discoverable map
          </h2>
          <p style={{ margin: '8px 0 0', color: muted, fontSize: 14, lineHeight: 1.8 }}>
            Overview, CRM, content managers, builders, and settings are grouped below so no admin route gets buried.
          </p>
        </div>

        <AdminModuleGrid activePath="/admin/dashboard" tone="solid" />
      </section>
    </AdminShell>
  );
}
