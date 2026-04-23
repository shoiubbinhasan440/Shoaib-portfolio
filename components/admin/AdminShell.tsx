'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

type AdminShellProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', meta: 'Overview', icon: '◧', section: 'Core' },
  { href: '/admin/inbox', label: 'Inbox', meta: 'Leads & messages', icon: '✉', section: 'Core' },
  { href: '/admin/projects', label: 'Projects', meta: 'Client delivery', icon: '▣', section: 'Core' },
  { href: '/admin/templates', label: 'Templates', meta: 'Replies & rates', icon: '⟡', section: 'Core' },
  { href: '/admin/contact', label: 'Contact Builder', meta: 'Public page config', icon: '✦', section: 'Core' },
  { href: '/admin/videos', label: 'Video Manager', meta: 'Manage videos', icon: '🎬', section: 'Content' },
  { href: '/admin/graphics', label: 'Graphics Manager', meta: 'Manage graphics', icon: '🎨', section: 'Content' },
  { href: '/admin/portfolio', label: 'Portfolio Builder', meta: 'Portfolio page sections', icon: '🖼', section: 'Content' },
  { href: '/admin/footer', label: 'Global Footer', meta: 'Shared footer controls', icon: '🦶', section: 'Content' },
  { href: '/admin/tutorials', label: 'Tutorial System', meta: 'Tutorial page builder', icon: '🎓', section: 'Content' },
  { href: '/admin/categories', label: 'Category Manager', meta: 'Video/graphics categories', icon: '📂', section: 'Content' },
  { href: '/admin/homepage-portfolio', label: 'Homepage Builder', meta: 'Homepage sections', icon: '🧩', section: 'Content' },
  { href: '/admin/about', label: 'About System', meta: 'About page content', icon: '👤', section: 'Content' },
  { href: '/admin/navigation', label: 'Navigation Editor', meta: 'Menu items', icon: '🧭', section: 'Content' },
  { href: '/admin/settings', label: 'Settings', meta: 'System settings', icon: '⚙', section: 'Content' },
  { href: '/', label: 'View Site', meta: 'Open portfolio', icon: '↗', section: 'Content' },
] as const;

export default function AdminShell({
  actions,
  children,
  description,
  eyebrow = 'Admin Workspace',
  title,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const [compact, setCompact] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const shellBg = dark
    ? 'radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 30%), radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 26%), #04070f'
    : 'radial-gradient(circle at top left, rgba(14,165,233,0.1), transparent 30%), radial-gradient(circle at top right, rgba(37,99,235,0.12), transparent 28%), #f4f8fc';
  const panel = dark ? 'rgba(7,12,24,0.9)' : 'rgba(255,255,255,0.9)';
  const line = dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#475569';
  const sidebarGlow = dark
    ? '0 28px 80px rgba(2,6,23,0.42)'
    : '0 24px 60px rgba(15,23,42,0.08)';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('admin_token');
      router.replace('/admin/login');
    }
  }

  useEffect(() => {
    const sync = () => setCompact(window.innerWidth < 1080);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: shellBg,
        color: text,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '280px minmax(0, 1fr)',
          minHeight: '100vh',
        }}
      >
        <aside
          style={{
            padding: 22,
            borderRight: `1px solid ${line}`,
            background: dark
              ? 'linear-gradient(180deg, rgba(2,6,23,0.96), rgba(15,23,42,0.82))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
            boxShadow: sidebarGlow,
            position: compact ? 'relative' : 'sticky',
            top: 0,
            height: compact ? 'auto' : '100vh',
            alignSelf: compact ? 'stretch' : 'start',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div>
              <div
                style={{
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Admin
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em' }}>
                Portfolio Ops
              </div>
            </div>
            <button
              onClick={toggleTheme}
              type="button"
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                border: `1px solid ${line}`,
                background: dark ? 'rgba(15,23,42,0.86)' : 'rgba(255,255,255,0.92)',
                color: text,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              {dark ? '☀' : '☾'}
            </button>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 24,
              marginBottom: 18,
              border: `1px solid ${line}`,
              background: dark
                ? 'linear-gradient(145deg, rgba(2,6,23,0.8), rgba(8,47,73,0.28))'
                : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(224,242,254,0.8))',
            }}
          >
            <div style={{ fontSize: 13, color: muted, marginBottom: 8 }}>
              Workspace focus
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Leads, briefs, projects, and delivery in one flow
            </div>
            <p style={{ margin: 0, color: muted, fontSize: 13, lineHeight: 1.7 }}>
              Use the inbox to qualify leads, send WhatsApp replies, request briefs, and launch the client portal.
            </p>
          </div>

          <nav style={{ display: 'grid', gap: 14 }}>
            {(['Core', 'Content'] as const).map(section => (
              <div key={section} style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    color: '#38bdf8',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '0 4px',
                  }}
                >
                  {section}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                    gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(180px, 1fr))' : '1fr',
                  }}
                >
                  {navItems
                    .filter(item => item.section === section)
                    .map(item => {
                      const active =
                        item.href === '/'
                          ? false
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          href={item.href}
                          key={item.href}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '38px minmax(0, 1fr)',
                            gap: 12,
                            alignItems: 'center',
                            padding: '12px 14px',
                            borderRadius: 18,
                            textDecoration: 'none',
                            color: active ? '#f8fafc' : text,
                            background: active
                              ? 'linear-gradient(135deg, rgba(37,99,235,0.9), rgba(14,165,233,0.8))'
                              : dark
                                ? 'rgba(15,23,42,0.52)'
                                : 'rgba(255,255,255,0.72)',
                            border: `1px solid ${active ? 'rgba(56,189,248,0.34)' : line}`,
                            boxShadow: active ? '0 18px 40px rgba(37,99,235,0.22)' : 'none',
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 14,
                              display: 'grid',
                              placeItems: 'center',
                              background: active
                                ? 'rgba(255,255,255,0.12)'
                                : dark
                                  ? 'rgba(30,41,59,0.76)'
                                  : 'rgba(226,232,240,0.82)',
                              fontSize: 16,
                            }}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>{item.label}</div>
                            <div
                              style={{
                                fontSize: 12,
                                color: active ? 'rgba(255,255,255,0.78)' : muted,
                                marginTop: 2,
                              }}
                            >
                              {item.meta}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            style={{
              width: '100%',
              marginTop: 18,
              borderRadius: 16,
              border: `1px solid ${line}`,
              padding: '13px 16px',
              background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.86)',
              color: text,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {loggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </aside>

        <main style={{ padding: compact ? 18 : 28 }}>
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              display: 'grid',
              gap: 22,
            }}
          >
            <header
              style={{
                borderRadius: 32,
                border: `1px solid ${line}`,
                background: panel,
                padding: '26px 28px',
                boxShadow: dark
                  ? '0 26px 70px rgba(2,6,23,0.34)'
                  : '0 22px 50px rgba(15,23,42,0.07)',
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
                      color: '#38bdf8',
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    {eyebrow}
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 'clamp(2rem, 4vw, 3rem)',
                      lineHeight: 0.98,
                      letterSpacing: '-0.06em',
                    }}
                  >
                    {title}
                  </h1>
                  <p
                    style={{
                      margin: '14px 0 0',
                      maxWidth: 720,
                      color: muted,
                      fontSize: 15,
                      lineHeight: 1.8,
                    }}
                  >
                    {description}
                  </p>
                </div>

                {actions ? (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{actions}</div>
                ) : null}
              </div>
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
