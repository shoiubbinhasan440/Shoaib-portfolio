'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import type {
  ClientAccount,
  ClientProject,
  ProjectMilestone,
  ProjectUpdate,
} from '@/lib/crm';

type PortalPayload = {
  client: ClientAccount;
  milestones: ProjectMilestone[];
  projects: ClientProject[];
  updates: ProjectUpdate[];
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [portal, setPortal] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/client/dashboard');
        if (response.status === 401) {
          router.replace('/client/login');
          return;
        }

        const result = (await response.json()) as {
          portal?: PortalPayload;
        };
        setPortal(result.portal || null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  const primaryProject = portal?.projects[0] || null;
  const milestones = useMemo(
    () =>
      primaryProject
        ? portal?.milestones.filter(milestone => milestone.projectId === primaryProject.id) || []
        : [],
    [portal?.milestones, primaryProject]
  );
  const updates = useMemo(
    () =>
      primaryProject
        ? portal?.updates.filter(update => update.projectId === primaryProject.id) || []
        : [],
    [portal?.updates, primaryProject]
  );

  async function handleLogout() {
    await fetch('/api/client/logout', { method: 'POST' });
    router.replace('/client/login');
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: dark ? '#050816' : '#f5f9ff',
          color: dark ? '#94a3b8' : '#475569',
        }}
      >
        Loading client dashboard...
      </main>
    );
  }

  if (!portal || !primaryProject) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '120px 24px',
          background: dark ? '#050816' : '#f5f9ff',
          color: dark ? '#f8fafc' : '#0f172a',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            borderRadius: 32,
            padding: '28px 26px',
            textAlign: 'center',
            border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'}`,
            background: dark
              ? 'linear-gradient(145deg, rgba(2,6,23,0.92), rgba(15,23,42,0.82))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
          }}
        >
          <h1 style={{ margin: '0 0 10px', fontSize: 32, letterSpacing: '-0.05em' }}>
            No project found
          </h1>
          <p style={{ margin: 0, color: dark ? '#94a3b8' : '#475569', lineHeight: 1.8 }}>
            Your portal access is active, but there is not an accepted project connected to this account yet.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '120px 20px 80px',
        background: dark
          ? 'radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 30%), #050816'
          : 'radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 28%), #f5f9ff',
        color: dark ? '#f8fafc' : '#0f172a',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <section
          style={{
            borderRadius: 32,
            border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'}`,
            padding: '28px 26px',
            background: dark
              ? 'linear-gradient(145deg, rgba(2,6,23,0.92), rgba(15,23,42,0.82))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 18,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: dark ? 'rgba(14,165,233,0.12)' : 'rgba(219,234,254,0.84)',
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                Client Dashboard
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(2.4rem, 7vw, 4.2rem)', lineHeight: 0.95, letterSpacing: '-0.07em' }}>
                {primaryProject.projectTitle}
              </h1>
              <p style={{ margin: '16px 0 0', color: dark ? '#94a3b8' : '#475569', lineHeight: 1.9, maxWidth: 720 }}>
                Hello {portal.client.fullName}. This dashboard shows the latest shared progress, current requirements, files, and next steps for your project.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              style={{
                borderRadius: 16,
                padding: '11px 14px',
                border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)'}`,
                background: dark ? 'rgba(15,23,42,0.76)' : 'rgba(255,255,255,0.88)',
                color: dark ? '#f8fafc' : '#0f172a',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Log out
            </button>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {[
            ['Current status', primaryProject.currentStatus],
            ['Progress', `${primaryProject.progressPercentage}%`],
            ['Deadline', primaryProject.deadline || 'To be confirmed'],
            ['Payment', primaryProject.paymentStatus],
          ].map(([label, value]) => (
            <article
              key={label}
              style={{
                borderRadius: 24,
                padding: '18px 20px',
                border: `1px solid ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
                background: dark ? 'rgba(8,15,29,0.82)' : 'rgba(255,255,255,0.94)',
              }}
            >
              <div style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 13, marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em' }}>{value}</div>
            </article>
          ))}
        </section>

        <section
          style={{
            borderRadius: 28,
            border: `1px solid ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
            background: dark ? 'rgba(8,15,29,0.82)' : 'rgba(255,255,255,0.94)',
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em' }}>Progress overview</div>
          </div>
          <div
            style={{
              height: 12,
              borderRadius: 999,
              overflow: 'hidden',
              background: dark ? 'rgba(30,41,59,0.9)' : 'rgba(226,232,240,0.92)',
            }}
          >
            <div
              style={{
                width: `${primaryProject.progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              }}
            />
          </div>
          <div style={{ color: dark ? '#94a3b8' : '#475569', marginTop: 10, lineHeight: 1.8 }}>
            Next step: <strong style={{ color: dark ? '#f8fafc' : '#0f172a' }}>{primaryProject.nextStep || 'Shared soon'}</strong>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          <article style={panelStyle(dark)}>
            <div style={headingStyle}>Requirements</div>
            <div style={bodyStyle(dark)}>
              {primaryProject.requirements || 'Requirements will appear here once they are confirmed.'}
            </div>
          </article>

          <article style={panelStyle(dark)}>
            <div style={headingStyle}>Client-visible notes</div>
            <div style={bodyStyle(dark)}>
              {primaryProject.clientVisibleNotes || 'No public notes shared yet.'}
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
          <article style={panelStyle(dark)}>
            <div style={headingStyle}>Milestones</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {milestones.length === 0 ? (
                <div style={bodyStyle(dark)}>Milestones will appear here as the project is planned.</div>
              ) : (
                milestones.map(milestone => (
                  <div
                    key={milestone.id}
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
                      padding: '12px 14px',
                      background: dark ? 'rgba(2,6,23,0.82)' : 'rgba(248,250,252,0.9)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700 }}>{milestone.title}</div>
                      <div style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 800 }}>
                        {milestone.status}
                      </div>
                    </div>
                    {milestone.description ? (
                      <div style={{ color: dark ? '#cbd5e1' : '#334155', fontSize: 14, lineHeight: 1.7 }}>
                        {milestone.description}
                      </div>
                    ) : null}
                    {milestone.dueDate ? (
                      <div style={{ color: dark ? '#64748b' : '#64748b', fontSize: 12, marginTop: 8 }}>
                        Target: {milestone.dueDate}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </article>

          <article style={panelStyle(dark)}>
            <div style={headingStyle}>Files and links</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {primaryProject.resources.filter(resource => resource.clientVisible).length === 0 ? (
                <div style={bodyStyle(dark)}>No delivery links shared yet.</div>
              ) : (
                primaryProject.resources
                  .filter(resource => resource.clientVisible)
                  .map(resource => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'block',
                        borderRadius: 18,
                        border: `1px solid ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
                        padding: '12px 14px',
                        background: dark ? 'rgba(2,6,23,0.82)' : 'rgba(248,250,252,0.9)',
                        textDecoration: 'none',
                        color: dark ? '#f8fafc' : '#0f172a',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{resource.label}</div>
                      <div style={{ color: '#38bdf8', fontSize: 13, marginTop: 6 }}>{resource.url}</div>
                      {resource.description ? (
                        <div style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 12, marginTop: 6 }}>
                          {resource.description}
                        </div>
                      ) : null}
                    </a>
                  ))
              )}
            </div>
          </article>
        </section>

        <section style={panelStyle(dark)}>
          <div style={headingStyle}>Latest updates</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {updates.length === 0 ? (
              <div style={bodyStyle(dark)}>No public updates have been posted yet.</div>
            ) : (
              updates.map(update => (
                <div
                  key={update.id}
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
                    padding: '12px 14px',
                    background: dark ? 'rgba(2,6,23,0.82)' : 'rgba(248,250,252,0.9)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700 }}>{update.title}</div>
                    <div style={{ color: dark ? '#64748b' : '#64748b', fontSize: 12 }}>
                      {new Date(update.createdAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                  <div style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 12, marginBottom: 8 }}>
                    {update.statusSnapshot} · {update.progressSnapshot}% complete
                  </div>
                  <div style={bodyStyle(dark)}>{update.body}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <div style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 13, lineHeight: 1.8 }}>
          Need to discuss a change? Use the <Link href="/contact" style={{ color: '#38bdf8' }}>contact page</Link> or reply to the shared WhatsApp thread so everything stays attached to the project.
        </div>
      </div>
    </main>
  );
}

function panelStyle(dark: boolean): React.CSSProperties {
  return {
    borderRadius: 28,
    border: `1px solid ${dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
    background: dark ? 'rgba(8,15,29,0.82)' : 'rgba(255,255,255,0.94)',
    padding: 20,
  };
}

const headingStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: '-0.04em',
  marginBottom: 14,
};

function bodyStyle(dark: boolean): React.CSSProperties {
  return {
    color: dark ? '#cbd5e1' : '#334155',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
  };
}
