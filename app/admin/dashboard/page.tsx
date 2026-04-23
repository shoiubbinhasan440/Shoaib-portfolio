'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminShell from '@/components/admin/AdminShell';
import type { ContactLead, CreativeBrief, ClientProject } from '@/lib/crm';

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

export default function AdminDashboardPage() {
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

  const metrics = useMemo(() => {
    const unreadLeads = state.leads.filter(lead => !lead.read && !lead.archived).length;
    const activeProjects = state.projects.filter(project =>
      ['Accepted', 'In Progress', 'First Draft Sent', 'Revision', 'Final Delivery', 'Brief Received', 'Quotation Sent'].includes(
        project.currentStatus
      )
    ).length;
    const pendingBriefs = state.briefs.filter(brief => brief.status !== 'submitted').length;
    const completedProjects = state.projects.filter(
      project => project.currentStatus === 'Completed'
    ).length;

    return [
      {
        label: 'Unread Leads',
        value: unreadLeads,
        accent: 'linear-gradient(135deg, rgba(14,165,233,0.22), rgba(37,99,235,0.18))',
      },
      {
        label: 'Active Projects',
        value: activeProjects,
        accent: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.16))',
      },
      {
        label: 'Briefs Pending',
        value: pendingBriefs,
        accent: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.16))',
      },
      {
        label: 'Completed',
        value: completedProjects,
        accent: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.14))',
      },
      {
        label: 'Videos',
        value: state.videos,
        accent: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(14,165,233,0.14))',
      },
      {
        label: 'Graphics',
        value: state.graphics,
        accent: 'linear-gradient(135deg, rgba(244,114,182,0.16), rgba(168,85,247,0.14))',
      },
      {
        label: 'Categories',
        value: state.categories,
        accent: 'linear-gradient(135deg, rgba(56,189,248,0.16), rgba(45,212,191,0.14))',
      },
      {
        label: 'Visitors',
        value: state.views,
        accent: 'linear-gradient(135deg, rgba(148,163,184,0.16), rgba(99,102,241,0.14))',
      },
    ];
  }, [state]);

  const recentLeads = state.leads.slice(0, 4);
  const recentProjects = state.projects.slice(0, 4);
  const legacyTools = [
    { href: '/admin/videos', label: 'Video Manager', desc: 'Upload, edit, and sort videos' },
    { href: '/admin/graphics', label: 'Graphics Manager', desc: 'Manage graphics and image items' },
    { href: '/admin/portfolio', label: 'Portfolio Builder', desc: 'Hero, tabs, filters, CTA' },
    { href: '/admin/footer', label: 'Global Footer', desc: 'Shared footer content' },
    { href: '/admin/tutorials', label: 'Tutorial System', desc: 'Tutorial page builder' },
    { href: '/admin/categories', label: 'Category Manager', desc: 'Content categories' },
    { href: '/admin/homepage-portfolio', label: 'Homepage Builder', desc: 'Homepage sections' },
    { href: '/admin/about', label: 'About System', desc: 'About page and homepage about' },
    { href: '/admin/navigation', label: 'Navigation Editor', desc: 'Navbar menu items' },
  ];

  return (
    <AdminShell
      eyebrow="Admin Dashboard"
      title="Run your portfolio like a client-ready studio"
      description="The CRM, brief flow, client portal, and project delivery system now live alongside your existing content management tools."
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
              background: 'rgba(15,23,42,0.72)',
              color: '#e2e8f0',
              border: '1px solid rgba(148,163,184,0.16)',
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
              border: '1px solid rgba(148,163,184,0.14)',
              background: metric.accent,
              boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>{metric.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.06em' }}>
              {state.loading ? '...' : metric.value}
            </div>
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
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(8,15,29,0.84)',
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
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
              <div style={{ color: '#94a3b8', fontSize: 14 }}>No leads yet.</div>
            ) : (
              recentLeads.map(lead => (
                <div
                  key={lead.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.14)',
                    background: 'rgba(15,23,42,0.74)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <div style={{ fontWeight: 800 }}>{lead.name}</div>
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
                      }}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{lead.serviceType} · {lead.intentCategory}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
                    {new Date(lead.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article
          style={{
            borderRadius: 28,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(8,15,29,0.84)',
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                Client Delivery
              </div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
                Project watchlist
              </h2>
            </div>
            <Link href="/admin/projects" style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 700 }}>
              Open projects
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {recentProjects.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>No projects created yet.</div>
            ) : (
              recentProjects.map(project => (
                <div
                  key={project.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.14)',
                    background: 'rgba(15,23,42,0.74)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{project.projectTitle}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                        {project.clientName} · {project.serviceType}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800 }}>{project.progressPercentage}%</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{project.currentStatus}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: 'rgba(30,41,59,0.9)',
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
          border: '1px solid rgba(148,163,184,0.14)',
          background: 'rgba(8,15,29,0.84)',
          padding: 22,
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
            Content Tools
          </div>
          <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>
            Previous admin options
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {legacyTools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{
                borderRadius: 20,
                padding: '16px 18px',
                border: '1px solid rgba(148,163,184,0.14)',
                background: 'rgba(15,23,42,0.74)',
                textDecoration: 'none',
                color: '#f8fafc',
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{tool.label}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
                {tool.desc}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
