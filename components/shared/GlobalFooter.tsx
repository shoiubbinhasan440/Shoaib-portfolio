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

function getFlexAlignment(alignment: HomepageFooterSection['alignment']) {
  if (alignment === 'center') {
    return 'center';
  }

  if (alignment === 'right') {
    return 'flex-end';
  }

  return 'flex-start';
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

  const stylePreset = config.stylePreset || 'cinematic';
  const text =
    stylePreset === 'light' && !dark ? '#0f172a' : dark ? '#f8fafc' : '#0f172a';
  const muted =
    stylePreset === 'light' && !dark ? '#475569' : dark ? '#94a3b8' : '#64748b';
  const border = dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)';
  const background =
    stylePreset === 'minimal'
      ? dark
        ? '#04070f'
        : '#ffffff'
      : stylePreset === 'light'
        ? dark
          ? '#050505'
          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.96))'
        : dark
          ? 'radial-gradient(circle at 12% 0%, rgba(37,99,235,0.12), transparent 32%), #050505'
          : 'radial-gradient(circle at 12% 0%, rgba(37,99,235,0.08), transparent 28%), #ffffff';

  return (
    <footer
      style={{
        borderTop: `1px solid ${border}`,
        padding: getSectionPadding(config.spacing, isMobile),
        background,
      }}
    >
      <div style={{ maxWidth: getSectionMaxWidth(config.width), margin: '0 auto' }}>
        {config.showCta && config.ctaText && config.ctaLink ? (
          <div
            style={{
              marginBottom: 28,
              padding: isMobile ? '20px 18px' : '22px 24px',
              borderRadius: 22,
              border: `1px solid ${border}`,
              background: dark
                ? 'linear-gradient(135deg, rgba(15,23,42,0.7), rgba(2,6,23,0.92))'
                : 'linear-gradient(135deg, rgba(239,246,255,0.88), rgba(255,255,255,0.96))',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: text, marginBottom: config.ctaCaption ? 6 : 0 }}>
                Global Footer CTA
              </div>
              {config.ctaCaption ? (
                <div style={{ fontSize: 14, color: muted, lineHeight: 1.7 }}>{config.ctaCaption}</div>
              ) : null}
            </div>
            <FooterLink href={config.ctaLink}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 46,
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {config.ctaText}
                <span>→</span>
              </span>
            </FooterLink>
          </div>
        ) : null}

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
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.logoAlt || `${config.brandText} logo`}
                style={{
                  height: 44,
                  width: 'auto',
                  marginBottom: 14,
                  objectFit: 'contain',
                }}
              />
            ) : null}
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: getFlexAlignment(config.alignment),
                }}
              >
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
                          justifyContent: getFlexAlignment(config.alignment),
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
            justifyContent:
              config.alignment === 'center'
                ? 'center'
                : config.alignment === 'right'
                  ? 'flex-end'
                  : 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            textAlign: config.alignment,
          }}
        >
          <div style={{ fontSize: 13, color: muted }}>{config.copyrightText}</div>
          <div style={{ fontSize: 13, color: muted }}>{config.noteText}</div>
        </div>
      </div>
    </footer>
  );
}
