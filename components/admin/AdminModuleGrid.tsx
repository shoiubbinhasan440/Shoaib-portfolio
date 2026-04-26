import Link from 'next/link';
import { useAdminThemeTokens } from '@/components/admin/admin-ui';
import {
  ADMIN_MODULE_GROUPS,
  findAdminModule,
  getAdminModulesByGroup,
} from '@/components/admin/admin-registry';

type AdminModuleGridProps = {
  activePath?: string;
  compact?: boolean;
  tone?: 'soft' | 'solid';
};

export default function AdminModuleGrid({
  activePath,
  compact = false,
  tone = 'soft',
}: AdminModuleGridProps) {
  const tokens = useAdminThemeTokens();

  return (
    <div style={{ display: 'grid', gap: compact ? 16 : 20 }}>
      {ADMIN_MODULE_GROUPS.map(group => {
        const items = getAdminModulesByGroup(group.id);

        return (
          <section key={group.id} style={{ display: 'grid', gap: 12 }}>
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
                {group.label}
              </div>
              {!compact ? (
                <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                  {group.description}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: compact
                  ? 'repeat(auto-fit, minmax(190px, 1fr))'
                  : 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {items.map(item => {
                const active = activePath ? findAdminModule(activePath)?.href === item.href : false;

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    style={{
                      textDecoration: 'none',
                      color: tokens.text,
                      borderRadius: 22,
                      border: `1px solid ${
                        active
                          ? 'rgba(56,189,248,0.28)'
                          : tokens.line
                      }`,
                      background:
                        tone === 'solid'
                          ? active
                            ? 'linear-gradient(135deg, rgba(37,99,235,0.24), rgba(14,165,233,0.18))'
                            : tokens.panel
                          : active
                            ? 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.14))'
                            : tokens.fieldSoft,
                      padding: compact ? '16px 18px' : '18px 20px',
                      boxShadow: active ? tokens.softShadow : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          display: 'grid',
                          placeItems: 'center',
                          background: active
                            ? 'rgba(255,255,255,0.14)'
                            : tokens.field,
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      {item.badge ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '5px 9px',
                            background: tokens.accentSoft,
                            color: tokens.accentText,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
                      {item.label}
                    </div>
                    <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                      {item.meta}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
