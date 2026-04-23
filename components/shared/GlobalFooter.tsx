'use client';

import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import type { HomepageFooterSection } from '@/lib/homepage-content';

function isExternal(url: string) {
  return /^https?:\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('tel:');
}

function getSectionMaxWidth(width: HomepageFooterSection['width']) {
  switch (width) {
    case 'narrow':
      return 920;
    case 'normal':
      return 1100;
    case 'full':
      return 1360;
    case 'wide':
    default:
      return 1240;
  }
}

function getSectionPadding(
  spacing: HomepageFooterSection['spacing'],
  isMobile: boolean
) {
  if (spacing === 'compact') {
    return isMobile ? '34px 16px 24px' : '42px 30px 28px';
  }

  if (spacing === 'spacious') {
    return isMobile ? '54px 18px 34px' : '60px 40px 36px';
  }

  return isMobile ? '42px 18px 28px' : '50px 36px 32px';
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {children}
    </Link>
  );
}

export default function GlobalFooter({
  config,
  isMobile = false,
}: {
  config: HomepageFooterSection;
  isMobile?: boolean;
}) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  if (!config.enabled) {
    return null;
  }

  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#64748b';
  const border = dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)';

  return (
    <footer
      style={{
        borderTop: `1px solid ${border}`,
        padding: getSectionPadding(config.spacing, isMobile),
        background: dark ? '#050505' : '#fff',
      }}
    >
      <div style={{ maxWidth: getSectionMaxWidth(config.width), margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              isMobile || config.layout === 'stacked'
                ? '1fr'
                : 'minmax(0, 1.1fr) repeat(3, minmax(0, 1fr))',
            gap: isMobile ? 28 : 40,
            marginBottom: 40,
            textAlign: config.alignment,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 10 }}>
              <span style={{ color: text }}>{config.brandText}</span>
              <span style={{ color: '#3b82f6' }}>{config.brandAccent}</span>
            </div>
            {config.showDescription ? (
              <p style={{ color: muted, fontSize: 14, lineHeight: 1.7 }}>
                {config.description}
              </p>
            ) : null}
          </div>

          {config.showQuickLinks ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>
                {config.quickLinksTitle}
              </div>
              {config.quickLinks
                .filter(item => item.enabled)
                .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
                .map(link => (
                  <FooterLink key={link.id} href={link.url}>
                    <span
                      style={{
                        display: 'block',
                        color: muted,
                        fontSize: 14,
                        marginBottom: 8,
                      }}
                    >
                      {link.label}
                    </span>
                  </FooterLink>
                ))}
            </div>
          ) : null}

          {config.showContact ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>
                {config.contactTitle}
              </div>
              <div style={{ color: muted, fontSize: 13, lineHeight: 2 }}>
                {config.contactItems
                  .filter(item => item.enabled)
                  .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
                  .map(item => (
                    <div key={item.id}>
                      {item.icon ? `${item.icon} ` : ''}
                      {item.value}
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {config.showSocial ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>
                {config.socialTitle}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.socialLinks
                  .filter(item => item.enabled)
                  .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
                  .map(link => (
                    <FooterLink key={link.id} href={link.url}>
                      <span
                        style={{
                          color: muted,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {link.label}
                      </span>
                    </FooterLink>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
        <div
          style={{
            borderTop: `1px solid ${border}`,
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, color: muted }}>{config.copyrightText}</div>
          <div style={{ fontSize: 13, color: muted }}>{config.noteText}</div>
        </div>
      </div>
    </footer>
  );
}
