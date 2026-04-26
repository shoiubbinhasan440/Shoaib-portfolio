'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

export type AdminThemeTokens = {
  accent: string;
  accentSoft: string;
  accentText: string;
  dark: boolean;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  field: string;
  fieldSoft: string;
  line: string;
  muted: string;
  panel: string;
  panelStrong: string;
  shadow: string;
  softShadow: string;
  subtle: string;
  success: string;
  successSoft: string;
  successText: string;
  text: string;
};

export function getAdminThemeTokens(dark: boolean): AdminThemeTokens {
  return {
    accent: '#2563eb',
    accentSoft: dark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.1)',
    accentText: dark ? '#7dd3fc' : '#2563eb',
    dark,
    danger: '#ef4444',
    dangerSoft: dark ? 'rgba(127,29,29,0.2)' : 'rgba(254,226,226,0.9)',
    dangerText: dark ? '#fecaca' : '#b91c1c',
    field: dark ? 'rgba(2,6,23,0.86)' : 'rgba(255,255,255,0.96)',
    fieldSoft: dark ? 'rgba(15,23,42,0.72)' : 'rgba(248,250,252,0.96)',
    line: dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)',
    muted: dark ? '#94a3b8' : '#475569',
    panel: dark ? 'rgba(8,15,29,0.84)' : 'rgba(255,255,255,0.92)',
    panelStrong: dark
      ? 'linear-gradient(180deg, rgba(8,15,29,0.94), rgba(15,23,42,0.82))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
    shadow: dark ? '0 22px 60px rgba(2,6,23,0.24)' : '0 20px 50px rgba(15,23,42,0.08)',
    softShadow: dark ? '0 18px 46px rgba(2,6,23,0.22)' : '0 16px 34px rgba(15,23,42,0.06)',
    subtle: '#64748b',
    success: '#16a34a',
    successSoft: dark ? 'rgba(22,163,74,0.16)' : 'rgba(220,252,231,0.92)',
    successText: dark ? '#86efac' : '#166534',
    text: dark ? '#f8fafc' : '#0f172a',
  };
}

export function useAdminThemeTokens() {
  const { theme } = useTheme();
  return getAdminThemeTokens(theme === 'dark');
}

export function getAdminInputStyle(
  tokens: AdminThemeTokens,
  options: {
    hasError?: boolean;
    minHeight?: number;
  } = {}
) {
  return {
    width: '100%',
    background: tokens.field,
    border: `1px solid ${
      options.hasError ? 'rgba(248,113,113,0.4)' : tokens.line
    }`,
    borderRadius: 14,
    color: tokens.text,
    padding: '12px 14px',
    fontSize: 14,
    boxSizing: 'border-box' as const,
    minHeight: options.minHeight,
    boxShadow: options.hasError ? '0 0 0 3px rgba(248,113,113,0.08)' : 'none',
  };
}

export function getAdminTextareaStyle(
  tokens: AdminThemeTokens,
  options: {
    hasError?: boolean;
    minHeight?: number;
  } = {}
) {
  return {
    ...getAdminInputStyle(tokens, options),
    resize: 'vertical' as const,
    minHeight: options.minHeight ?? 110,
    fontFamily: 'inherit',
  };
}

export function AdminField({
  label,
  hint,
  full = false,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div
        style={{
          fontSize: 12,
          color: tokens.muted,
          marginBottom: 7,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      {children}
      {hint ? (
        <div
          style={{
            color: tokens.subtle,
            fontSize: 12,
            lineHeight: 1.6,
            marginTop: 7,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  badge,
  actions,
  children,
}: {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <section
      style={{
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
        borderRadius: 26,
        padding: 22,
        boxShadow: tokens.shadow,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: description || badge ? 8 : 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                letterSpacing: '-0.04em',
              }}
            >
              {title}
            </h2>
            {badge ? <AdminChip>{badge}</AdminChip> : null}
          </div>
          {description ? (
            <p
              style={{
                margin: 0,
                color: tokens.muted,
                fontSize: 14,
                lineHeight: 1.75,
                maxWidth: 820,
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AdminChip({
  children,
  tone = 'accent',
}: {
  children: React.ReactNode;
  tone?: 'accent' | 'success' | 'danger' | 'neutral';
}) {
  const tokens = useAdminThemeTokens();

  const styles =
    tone === 'success'
      ? {
          background: tokens.successSoft,
          color: tokens.successText,
          border: `1px solid ${tokens.successSoft}`,
        }
      : tone === 'danger'
        ? {
            background: tokens.dangerSoft,
            color: tokens.dangerText,
            border: `1px solid ${tokens.dangerSoft}`,
          }
        : tone === 'neutral'
          ? {
              background: tokens.fieldSoft,
              color: tokens.muted,
              border: `1px solid ${tokens.line}`,
            }
          : {
              background: tokens.accentSoft,
              color: tokens.accentText,
              border: `1px solid ${tokens.accentSoft}`,
            };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        ...styles,
      }}
    >
      {children}
    </span>
  );
}

export function AdminNotice({ message }: { message: string }) {
  const tokens = useAdminThemeTokens();
  const success = message.startsWith('✅');
  const danger = message.startsWith('❌');
  const styles = success
    ? {
        background: tokens.successSoft,
        border: `1px solid ${tokens.successSoft}`,
        color: tokens.successText,
      }
    : danger
      ? {
          background: tokens.dangerSoft,
          border: `1px solid ${tokens.dangerSoft}`,
          color: tokens.dangerText,
        }
      : {
          background: tokens.fieldSoft,
          border: `1px solid ${tokens.line}`,
          color: tokens.text,
        };

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 18,
        boxShadow: tokens.softShadow,
        ...styles,
      }}
    >
      {message}
    </div>
  );
}

export function AdminActionButton({
  children,
  href,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const tokens = useAdminThemeTokens();

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    padding: '11px 16px',
    fontWeight: 800,
    fontSize: 14,
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
  };

  const variantStyle =
    variant === 'secondary'
      ? {
          background: tokens.fieldSoft,
          color: tokens.text,
          border: `1px solid ${tokens.line}`,
          boxShadow: tokens.softShadow,
        }
      : variant === 'ghost'
        ? {
            background: 'transparent',
            color: tokens.text,
            border: `1px solid ${tokens.line}`,
            boxShadow: 'none',
          }
        : variant === 'danger'
          ? {
              background: tokens.dangerSoft,
              color: tokens.dangerText,
              border: `1px solid ${tokens.dangerSoft}`,
              boxShadow: 'none',
            }
          : {
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 18px 40px rgba(37,99,235,0.24)',
            };

  if (href) {
    return (
      <Link href={href} style={{ ...baseStyle, ...variantStyle }}>
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyle }}
    >
      {children}
    </button>
  );
}

export function AdminSectionTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ description?: string; id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}
    >
      {items.map(item => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              borderRadius: 18,
              border: `1px solid ${active ? 'rgba(56,189,248,0.26)' : tokens.line}`,
              background: active
                ? `linear-gradient(135deg, ${tokens.accentSoft}, rgba(14,165,233,0.12))`
                : tokens.fieldSoft,
              color: tokens.text,
              padding: '13px 14px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: active ? tokens.softShadow : 'none',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: item.description ? 5 : 0 }}>
              {item.label}
            </div>
            {item.description ? (
              <div style={{ color: tokens.muted, fontSize: 12, lineHeight: 1.5 }}>
                {item.description}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function AdminBuilderSection<T extends string>({
  title,
  description,
  badge,
  status,
  statusTone = 'neutral',
  headerControls,
  tabs,
  defaultTab,
  defaultCollapsed = false,
}: {
  title: string;
  description?: string;
  badge?: string;
  status?: string;
  statusTone?: 'accent' | 'success' | 'danger' | 'neutral';
  headerControls?: React.ReactNode;
  tabs: Array<{ content: React.ReactNode; description?: string; id: T; label: string }>;
  defaultTab?: T;
  defaultCollapsed?: boolean;
}) {
  const tokens = useAdminThemeTokens();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<T>(defaultTab ?? tabs[0]?.id);
  const activeContent =
    tabs.find(item => item.id === activeTab)?.content ?? tabs[0]?.content ?? null;

  return (
    <section
      style={{
        background: tokens.panel,
        border: `1px solid ${tokens.line}`,
        borderRadius: 26,
        padding: 22,
        boxShadow: tokens.shadow,
        display: 'grid',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: description || badge || status ? 8 : 0,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>{title}</h2>
            {badge ? <AdminChip>{badge}</AdminChip> : null}
            {status ? <AdminChip tone={statusTone}>{status}</AdminChip> : null}
          </div>
          {description ? (
            <p
              style={{
                margin: 0,
                color: tokens.muted,
                fontSize: 14,
                lineHeight: 1.75,
                maxWidth: 860,
              }}
            >
              {description}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {headerControls}
          <button
            type="button"
            onClick={() => setCollapsed(current => !current)}
            style={{
              borderRadius: 14,
              border: `1px solid ${tokens.line}`,
              background: tokens.fieldSoft,
              color: tokens.text,
              padding: '10px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: 104,
            }}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {!collapsed ? (
        <>
          {tabs.length > 1 ? (
            <AdminSectionTabs
              items={tabs.map(item => ({
                description: item.description,
                id: item.id,
                label: item.label,
              }))}
              value={activeTab}
              onChange={setActiveTab}
            />
          ) : null}
          <div>{activeContent}</div>
        </>
      ) : null}
    </section>
  );
}

export function AdminPreviewFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${tokens.line}`,
        background: tokens.panelStrong,
        padding: 18,
        boxShadow: tokens.softShadow,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: tokens.accentText,
            fontWeight: 900,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        {description ? (
          <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.6 }}>
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
