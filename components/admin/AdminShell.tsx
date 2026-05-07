'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AdminChip,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import { useTheme } from '@/components/ThemeProvider';
import {
  ADMIN_MODULE_GROUPS,
  ADMIN_MODULES,
  findAdminModule,
  getAdminModulesByGroup,
} from '@/components/admin/admin-registry';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';

type AdminShellProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

function matchesQuery(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

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
  const tokens = useAdminThemeTokens();
  const dark = theme === 'dark';
  const [mobile, setMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [moduleQuery, setModuleQuery] = useState('');
  const [navOffset, setNavOffset] = useState(0);

  const currentModule = useMemo(() => findAdminModule(pathname), [pathname]);
  const uniqueModuleCount = ADMIN_MODULES.length;
  const filteredGroups = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase();

    return ADMIN_MODULE_GROUPS.map(group => {
      const items = getAdminModulesByGroup(group.id).filter(item => {
        if (!query) {
          return true;
        }

        const searchable = [
          item.label,
          item.meta,
          item.badge || '',
          ...(item.keywords || []),
        ].join(' ');

        return matchesQuery(searchable, query);
      });

      return { ...group, items };
    }).filter(group => group.items.length > 0);
  }, [moduleQuery]);

  const shellBg = dark
    ? 'radial-gradient(circle at top left, rgba(14,165,233,0.16), transparent 24%), radial-gradient(circle at top right, rgba(37,99,235,0.14), transparent 22%), linear-gradient(180deg, #030712 0%, #020617 100%)'
    : 'radial-gradient(circle at top left, rgba(14,165,233,0.08), transparent 24%), radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #edf4fb 100%)';
  const sidebarBg = dark
    ? 'linear-gradient(180deg, rgba(2,6,23,0.98), rgba(15,23,42,0.88))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(241,245,249,0.94))';
  const pageShadow = dark
    ? '0 28px 80px rgba(2,6,23,0.34)'
    : '0 24px 60px rgba(15,23,42,0.08)';
  const contentShadow = dark
    ? '0 26px 70px rgba(2,6,23,0.3)'
    : '0 22px 48px rgba(15,23,42,0.08)';

  useEffect(() => {
    const syncViewport = () => {
      setMobile(window.innerWidth < 1080);
      const navbar = document.querySelector<HTMLElement>('.site-navbar');
      setNavOffset(navbar?.offsetHeight || 0);
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);

    const navbar = document.querySelector<HTMLElement>('.site-navbar');
    const observer =
      typeof ResizeObserver !== 'undefined' && navbar
        ? new ResizeObserver(syncViewport)
        : null;

    if (observer && navbar) {
      observer.observe(navbar);
    }

    return () => {
      window.removeEventListener('resize', syncViewport);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobile) {
      setDrawerOpen(false);
    }
  }, [mobile]);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const ok = await verifyAdminSessionClient();
      if (active && !ok) {
        router.replace('/admin/login');
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
    }
  }

  function renderNavContent(isDrawer: boolean) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          color: tokens.text,
        }}
      >
        <div style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  color: tokens.accentText,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Admin
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em' }}>
                Portfolio Ops
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={toggleTheme}
                type="button"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.fieldSoft,
                  color: tokens.text,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
                aria-label="Toggle theme"
              >
                {dark ? '☀' : '☾'}
              </button>

              {isDrawer ? (
                <button
                  onClick={() => setDrawerOpen(false)}
                  type="button"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    color: tokens.text,
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                  aria-label="Close navigation"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 10,
              padding: 14,
              borderRadius: 20,
              border: `1px solid ${tokens.line}`,
              background: tokens.fieldSoft,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    color: tokens.accentText,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Module map
                </div>
                <div style={{ color: tokens.muted, fontSize: 13 }}>
                  {uniqueModuleCount} admin tools
                </div>
              </div>
              {currentModule ? <AdminChip>{currentModule.label}</AdminChip> : null}
            </div>

            <input
              value={moduleQuery}
              onChange={event => setModuleQuery(event.target.value)}
              placeholder="Search modules, builders, or settings"
              style={{
                width: '100%',
                background: tokens.field,
                border: `1px solid ${tokens.line}`,
                borderRadius: 14,
                color: tokens.text,
                padding: '11px 14px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              aria-label="Search admin modules"
            />
          </div>
        </div>

        <nav
          style={{
            display: 'grid',
            gap: 18,
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            paddingRight: 6,
            marginRight: -6,
            minHeight: 0,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarGutter: 'stable',
          }}
        >
          {filteredGroups.length === 0 ? (
            <div
              style={{
                borderRadius: 20,
                border: `1px dashed ${tokens.line}`,
                padding: 18,
                background: tokens.fieldSoft,
                color: tokens.muted,
                lineHeight: 1.7,
              }}
            >
              No modules matched “{moduleQuery}”. Try a broader word like “SEO”, “portfolio”, or “contact”.
            </div>
          ) : null}

          {filteredGroups.map(group => (
            <section key={group.id} style={{ display: 'grid', gap: 10 }}>
              <div style={{ padding: '0 4px' }}>
                <div
                  style={{
                    color: tokens.accentText,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {group.label}
                </div>
                <div style={{ color: tokens.subtle, fontSize: 12, lineHeight: 1.6 }}>
                  {group.description}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {group.items.map(item => {
                  const active =
                    item.href !== '/' &&
                    (pathname === item.href || pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      href={item.href}
                      key={`${group.id}:${item.href}`}
                      target={item.href === '/' ? '_blank' : undefined}
                      rel={item.href === '/' ? 'noreferrer' : undefined}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '46px minmax(0, 1fr)',
                        gap: 12,
                        alignItems: 'center',
                        padding: '14px 14px',
                        borderRadius: 18,
                        textDecoration: 'none',
                        color: active ? '#f8fafc' : tokens.text,
                        background: active
                          ? 'linear-gradient(135deg, rgba(37,99,235,0.94), rgba(14,165,233,0.82))'
                          : tokens.fieldSoft,
                        border: `1px solid ${
                          active ? 'rgba(56,189,248,0.34)' : tokens.line
                        }`,
                        boxShadow: active ? '0 18px 40px rgba(37,99,235,0.22)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 15,
                          display: 'grid',
                          placeItems: 'center',
                          background: active
                            ? 'rgba(255,255,255,0.12)'
                            : tokens.field,
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginBottom: 5,
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{item.label}</div>
                          {item.badge ? (
                            <span
                              style={{
                                borderRadius: 999,
                                padding: '4px 8px',
                                background: active
                                  ? 'rgba(255,255,255,0.12)'
                                  : tokens.accentSoft,
                                color: active ? '#f8fafc' : tokens.accentText,
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: active ? 'rgba(255,255,255,0.78)' : tokens.muted,
                            lineHeight: 1.6,
                          }}
                        >
                          {item.meta}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div
          style={{
            borderTop: `1px solid ${tokens.line}`,
            marginTop: 16,
            paddingTop: 16,
            flexShrink: 0,
            display: 'grid',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderRadius: 18,
              border: `1px solid ${tokens.line}`,
              background: tokens.fieldSoft,
              padding: '12px 14px',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>System status</div>
              <div style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                Navigation online
              </div>
            </div>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#22c55e',
                boxShadow: '0 0 0 6px rgba(34,197,94,0.14)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            style={{
              width: '100%',
              borderRadius: 16,
              border: `1px solid ${tokens.line}`,
              padding: '13px 16px',
              background: tokens.fieldSoft,
              color: tokens.text,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              opacity: loggingOut ? 0.72 : 1,
            }}
          >
            {loggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>
    );
  }

  const shellHeight = `calc(100vh - ${navOffset}px)`;

  return (
    <div
      style={{
        height: shellHeight,
        maxHeight: shellHeight,
        overflow: 'hidden',
        background: shellBg,
        color: tokens.text,
      }}
    >
      {mobile && drawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.62)',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            zIndex: 40,
          }}
        />
      ) : null}

      {mobile ? (
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: drawerOpen ? 0 : '-100%',
            bottom: 0,
            width: 'min(90vw, 380px)',
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            padding: 18,
            background: sidebarBg,
            borderRight: `1px solid ${tokens.line}`,
            boxShadow: pageShadow,
            zIndex: 50,
            transition: 'left 200ms ease',
          }}
        >
          {renderNavContent(true)}
        </aside>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '320px minmax(0, 1fr)',
          height: shellHeight,
          maxHeight: shellHeight,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {!mobile ? (
          <aside
            style={{
              padding: 22,
              borderRight: `1px solid ${tokens.line}`,
              background: sidebarBg,
              boxShadow: pageShadow,
              position: 'sticky',
              top: 0,
              height: shellHeight,
              maxHeight: shellHeight,
              minHeight: 0,
              overflow: 'hidden',
              alignSelf: 'start',
            }}
          >
            {renderNavContent(false)}
          </aside>
        ) : null}

        <main
          style={{
            height: shellHeight,
            maxHeight: shellHeight,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: mobile ? '16px 14px 22px' : '28px',
          }}
        >
          <div
            style={{
              maxWidth: 1360,
              margin: '0 auto',
              display: 'grid',
              gap: 22,
              paddingBottom: mobile ? 'calc(20px + env(safe-area-inset-bottom))' : 28,
            }}
          >
            {mobile ? (
              <div
                style={{
                  position: 'sticky',
                  top: 14,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  borderRadius: 20,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.panel,
                  boxShadow: contentShadow,
                  backdropFilter: 'blur(14px)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    color: tokens.text,
                    cursor: 'pointer',
                    fontSize: 17,
                  }}
                  aria-label="Open navigation"
                >
                  ☰
                </button>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      color: tokens.accentText,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {currentModule?.label || 'Admin'}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: tokens.muted,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentModule?.meta || 'Portfolio control center'}
                  </div>
                </div>

                <button
                  onClick={toggleTheme}
                  type="button"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    color: tokens.text,
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                  aria-label="Toggle theme"
                >
                  {dark ? '☀' : '☾'}
                </button>
              </div>
            ) : null}

            <header
              style={{
                borderRadius: mobile ? 26 : 32,
                border: `1px solid ${tokens.line}`,
                background: tokens.panel,
                padding: mobile ? '22px 18px' : '28px 30px',
                boxShadow: contentShadow,
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
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        color: tokens.accentText,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {eyebrow}
                    </div>
                    {currentModule ? <AdminChip>{currentModule.label}</AdminChip> : null}
                  </div>

                  <h1
                    style={{
                      margin: 0,
                      fontSize: mobile
                        ? 'clamp(1.8rem, 9vw, 2.5rem)'
                        : 'clamp(2.1rem, 4vw, 3.4rem)',
                      lineHeight: 0.98,
                      letterSpacing: '-0.07em',
                    }}
                  >
                    {title}
                  </h1>
                  <p
                    style={{
                      margin: '14px 0 0',
                      maxWidth: 760,
                      color: tokens.muted,
                      fontSize: 15,
                      lineHeight: 1.8,
                    }}
                  >
                    {description}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
                  <div
                    style={{
                      borderRadius: 20,
                      border: `1px solid ${tokens.line}`,
                      background: tokens.fieldSoft,
                      padding: '12px 14px',
                      minWidth: mobile ? '100%' : 250,
                    }}
                  >
                    <div style={{ color: tokens.muted, fontSize: 12, marginBottom: 6 }}>
                      Workspace status
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                      Smoother navigation and clearer controls
                    </div>
                    <div style={{ color: tokens.subtle, fontSize: 12 }}>
                      Search, grouping, mobile drawer, and theme-aware admin surfaces active
                    </div>
                  </div>

                  {actions ? (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{actions}</div>
                  ) : null}
                </div>
              </div>
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
