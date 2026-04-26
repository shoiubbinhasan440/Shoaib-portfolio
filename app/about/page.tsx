'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';
import GlobalFooter from '@/components/shared/GlobalFooter';
import {
  getAboutSystemConfig,
  type AboutPageSectionConfig,
  type AboutSystemConfig,
} from '@/lib/about-content';
import { getGlobalFooterConfig } from '@/lib/footer-content';
import {
  HERO_SETTING_KEYS,
  getFirstSetting,
  parseStyledSetting,
  toSettingMap,
  type SettingRow,
} from '@/lib/hero-settings';
import { createDefaultHomepageBuilderConfig } from '@/lib/homepage-content';
import {
  getButtonStyleOverrides,
  getCardSurfaceOverrides,
  getSectionPaddingOverride,
  getSectionWidthOverride,
  getTypographyStyleOverrides,
  resolveSectionThemeColor,
} from '@/lib/page-builder-styles';
import { fetchPortfolioDataset } from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AboutPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [aboutSystem, setAboutSystem] = useState<AboutSystemConfig>(() => getAboutSystemConfig({}));
  const [footerConfig, setFooterConfig] = useState(() => createDefaultHomepageBuilderConfig().footer);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: settings }, { videos, graphics }] = await Promise.all([
        supabase.from('site_settings').select('*'),
        fetchPortfolioDataset(supabase),
      ]);

      if (settings) {
        const map = toSettingMap(settings as SettingRow[]);
        const statProjects = parseStyledSetting(map.stat1_label, 'Projects');
        const statClientsText = parseStyledSetting(map.stat2_label, 'Clients');
        const statYearsText = parseStyledSetting(map.stat3_label, 'Years Crafting');
        const savedClients = getFirstSetting(map, HERO_SETTING_KEYS.statClients);
        const savedYears = getFirstSetting(map, HERO_SETTING_KEYS.statYears);
        const clientCount = savedClients ? parseInt(savedClients, 10) || 50 : 50;
        const yearsCount = savedYears ? parseInt(savedYears, 10) || 3 : 3;
        const projectCount = videos.length + graphics.length;

        setAboutSystem(
          getAboutSystemConfig(map, {
            projectsValue: `${projectCount}+`,
            projectsLabel: statProjects.value,
            clientsValue: `${clientCount}+`,
            clientsLabel: statClientsText.value,
            yearsValue: `${yearsCount}+`,
            yearsLabel: statYearsText.value,
          })
        );
        setFooterConfig(
          getGlobalFooterConfig(map, {
            projectCount,
            clientCount,
            yearsCount,
          })
        );
      }

      setLoading(false);
    }

    void load();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const bg = dark ? '#080808' : '#f8fbff';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? 'rgba(226,232,240,0.68)' : '#475569';
  const soft = dark ? '#64748b' : '#64748b';
  const border = dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.09)';
  const accent = '#38bdf8';
  const glass = dark
    ? 'linear-gradient(150deg, rgba(15,23,42,0.62), rgba(2,6,23,0.84))'
    : 'linear-gradient(150deg, rgba(255,255,255,0.94), rgba(239,246,255,0.78))';
  const strongGlass = dark
    ? 'linear-gradient(135deg, rgba(2,6,23,0.94), rgba(15,23,42,0.82))'
    : 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.9))';

  function sectionAccent(section: AboutPageSectionConfig) {
    return resolveSectionThemeColor(
      section.styles?.colors.accentLight || '',
      section.styles?.colors.accentDark || '',
      dark,
      accent
    );
  }

  function sectionMaxWidth(section: AboutPageSectionConfig, fallback = 1240) {
    return getSectionWidthOverride(section.styles?.layout.width || 'default', fallback);
  }

  function sectionPadding(section: AboutPageSectionConfig, mobile: string, desktop: string) {
    return getSectionPaddingOverride(
      section.styles?.layout.padding || 'default',
      isMobile,
      isMobile ? mobile : desktop
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        লোড হচ্ছে...
      </div>
    );
  }

  const sections = [...aboutSystem.pageSections]
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);

  function sectionTextAlign(section: AboutPageSectionConfig) {
    return section.alignment;
  }

  function isStacked(section: AboutPageSectionConfig) {
    return (
      isMobile ||
      section.layout === 'stacked' ||
      section.layout === 'centered' ||
      section.layout === 'grid'
    );
  }

  function contentFirst(section: AboutPageSectionConfig) {
    return section.layout !== 'image-left' && section.layout !== 'card-left';
  }

  function renderLabel(label?: string) {
    if (!label) {
      return null;
    }

    return (
      <div
        style={{
          display: 'inline-flex',
          gap: 8,
          alignItems: 'center',
          padding: '7px 14px',
          borderRadius: 999,
          border: `1px solid ${dark ? 'rgba(56,189,248,0.22)' : 'rgba(37,99,235,0.18)'}`,
          background: dark ? 'rgba(14,165,233,0.08)' : 'rgba(219,234,254,0.82)',
          color: dark ? '#7dd3fc' : '#2563eb',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
        {label}
      </div>
    );
  }

  function renderButtons(section: AboutPageSectionConfig) {
    const hasPrimary = section.primaryButtonText && section.primaryButtonLink;
    const hasSecondary = section.secondaryButtonText && section.secondaryButtonLink;

    if (!hasPrimary && !hasSecondary) {
      return null;
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: section.alignment === 'center' ? 'center' : section.alignment === 'right' ? 'flex-end' : 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 28,
        }}
      >
        {hasPrimary ? (
          <Link
            href={section.primaryButtonLink || '#'}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff',
              borderRadius: 14,
              padding: '14px 22px',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 850,
              boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
              ...getButtonStyleOverrides(section.styles, {
                dark,
                fallbackBackground: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                fallbackColor: '#fff',
                fallbackBorder: border,
                fallbackShadow: '0 18px 38px rgba(37,99,235,0.28)',
              }),
            }}
          >
            {section.primaryButtonText}
            {section.styles?.buttons.showIcon !== false ? ' →' : ''}
          </Link>
        ) : null}
        {hasSecondary ? (
          <Link
            href={section.secondaryButtonLink || '#'}
            style={{
              background: dark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.78)',
              color: text,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: '14px 20px',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 750,
              ...getButtonStyleOverrides(section.styles, {
                dark,
                fallbackBackground: dark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.78)',
                fallbackColor: text,
                fallbackBorder: border,
                fallbackShadow: 'none',
              }),
            }}
          >
            {section.secondaryButtonText}
          </Link>
        ) : null}
      </div>
    );
  }

  function renderVisual(section: AboutPageSectionConfig) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: isMobile ? 460 : 620,
          borderRadius: isMobile ? 30 : 38,
          overflow: 'hidden',
          border: `1px solid ${border}`,
          background: section.image
            ? `linear-gradient(180deg, rgba(2,6,23,0.03), rgba(2,6,23,0.82)), url(${section.image}) center/cover no-repeat`
            : 'linear-gradient(145deg, #020617, #0f172a 48%, #0ea5e9)',
          boxShadow: dark
            ? '0 50px 140px rgba(0,0,0,0.55)'
            : '0 34px 95px rgba(15,23,42,0.18)',
          ...getCardSurfaceOverrides(section.styles, {
            dark,
            fallbackBackground: section.image
              ? `linear-gradient(180deg, rgba(2,6,23,0.03), rgba(2,6,23,0.82)), url(${section.image}) center/cover no-repeat`
              : 'linear-gradient(145deg, #020617, #0f172a 48%, #0ea5e9)',
            fallbackBorder: border,
            fallbackShadow: dark
              ? '0 50px 140px rgba(0,0,0,0.55)'
              : '0 34px 95px rgba(15,23,42,0.18)',
          }),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 25% 18%, rgba(56,189,248,0.22), transparent 30%), linear-gradient(180deg, rgba(2,6,23,0) 34%, rgba(2,6,23,0.88) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            padding: 22,
            borderRadius: 26,
            background: 'linear-gradient(180deg, rgba(2,6,23,0.56), rgba(2,6,23,0.84))',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Personal Creative Profile
          </div>
          <p style={{ margin: 0, color: '#e2e8f0', fontSize: 16, lineHeight: 1.7, fontWeight: 650 }}>
            {section.subtitle || 'Story-first editing, clean design systems, and visuals built to feel premium from the first frame.'}
          </p>
        </div>
      </div>
    );
  }

  function renderHero(section: AboutPageSectionConfig) {
    const stacked = isStacked(section);
    const textAlign = sectionTextAlign(section);

    return (
      <section
        key={section.id}
        style={{
          position: 'relative',
          padding: sectionPadding(section, '56px 16px 40px', '88px 40px 64px'),
          background: dark
            ? 'radial-gradient(circle at 78% 18%, rgba(37,99,235,0.24), transparent 30%), radial-gradient(circle at 12% 28%, rgba(14,165,233,0.12), transparent 26%), #080808'
            : 'radial-gradient(circle at 78% 18%, rgba(37,99,235,0.13), transparent 30%), radial-gradient(circle at 12% 28%, rgba(14,165,233,0.12), transparent 28%), #f8fbff',
        }}
      >
        <div
          style={{
            maxWidth: sectionMaxWidth(section, 1240),
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: stacked ? '1fr' : 'minmax(0, 0.94fr) minmax(360px, 0.76fr)',
            gap: isMobile ? 30 : 56,
            alignItems: 'center',
            textAlign,
          }}
        >
          <div style={{ order: contentFirst(section) ? 1 : 2 }}>
            {renderLabel(section.label)}
            <h1
              style={{
                color: text,
                fontSize: isMobile ? 'clamp(38px, 13vw, 58px)' : 'clamp(58px, 7vw, 96px)',
                lineHeight: 0.92,
                letterSpacing: '-0.07em',
                fontWeight: 950,
                margin: '0 0 18px',
                maxWidth: textAlign === 'center' ? 920 : 840,
                ...getTypographyStyleOverrides('title', section.styles?.typography.title, {
                  dark,
                  isMobile,
                  fallbackColor: text,
                  fallbackTextAlign: textAlign,
                  fallbackFontWeight: 950,
                  fallbackLineHeight: 0.92,
                  fallbackLetterSpacing: '-0.07em',
                }),
              }}
            >
              {section.title}
            </h1>
            {section.subtitle ? (
              <div
                style={{
                  color: sectionAccent(section),
                  fontSize: isMobile ? 15 : 18,
                  fontWeight: 850,
                  marginBottom: 22,
                  ...getTypographyStyleOverrides('subtitle', section.styles?.typography.subtitle, {
                    dark,
                    isMobile,
                    fallbackColor: sectionAccent(section),
                    fallbackTextAlign: textAlign,
                    fallbackFontWeight: 850,
                  }),
                }}
              >
                {section.subtitle}
              </div>
            ) : null}
            {section.description ? (
              <p
                style={{
                  color: muted,
                  fontSize: isMobile ? 15 : 17,
                  lineHeight: 1.85,
                  maxWidth: 740,
                  margin: textAlign === 'center' ? '0 auto' : 0,
                  ...getTypographyStyleOverrides('body', section.styles?.typography.body, {
                    dark,
                    isMobile,
                    fallbackColor: muted,
                    fallbackTextAlign: textAlign,
                    fallbackLineHeight: 1.85,
                  }),
                }}
              >
                {section.description}
              </p>
            ) : null}
            {renderButtons(section)}
          </div>
          <div style={{ order: contentFirst(section) ? 2 : 1 }}>{renderVisual(section)}</div>
        </div>
      </section>
    );
  }

  function renderStats(section: AboutPageSectionConfig) {
    return (
      <section
        key={section.id}
        style={{ padding: sectionPadding(section, '18px 16px 54px', '20px 40px 78px') }}
      >
        <div style={{ maxWidth: sectionMaxWidth(section, 1240), margin: '0 auto' }}>
          {(section.title || section.subtitle) && (
            <div style={{ textAlign: section.alignment, marginBottom: 24 }}>
              {section.title ? <h2 style={{ color: text, fontSize: isMobile ? 28 : 42, letterSpacing: '-0.05em', margin: '0 0 8px' }}>{section.title}</h2> : null}
              {section.subtitle ? <p style={{ color: muted, margin: 0 }}>{section.subtitle}</p> : null}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : `repeat(${Math.min(section.stats?.length || 4, 4)}, minmax(0, 1fr))`,
              gap: 12,
            }}
          >
            {(section.stats || []).map(stat => (
              <div
                key={stat.id}
                style={{
                  padding: isMobile ? '20px 14px' : '28px 22px',
                  borderRadius: 22,
                  border: `1px solid ${border}`,
                  background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.82)',
                  boxShadow: dark ? '0 18px 52px rgba(0,0,0,0.18)' : '0 18px 44px rgba(15,23,42,0.06)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 10 }}>{stat.icon}</div>
                <div style={{ color: text, fontSize: isMobile ? 30 : 42, fontWeight: 950, letterSpacing: '-0.05em', marginBottom: 6 }}>
                  {stat.value}
                </div>
                <div style={{ color: soft, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderCards(section: AboutPageSectionConfig) {
    return (
      <section key={section.id} style={{ padding: isMobile ? '0 16px 64px' : '0 40px 92px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ maxWidth: 760, marginBottom: 30, textAlign: section.alignment }}>
            {renderLabel(section.label)}
            <h2 style={{ color: text, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.05em', margin: 0 }}>
              {section.title}
            </h2>
            {section.subtitle ? <p style={{ color: muted, marginTop: 14, lineHeight: 1.7 }}>{section.subtitle}</p> : null}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
              gap: 14,
            }}
          >
            {(section.cards || []).map(card => (
              <article
                key={card.id}
                style={{
                  minHeight: 230,
                  padding: 22,
                  borderRadius: 26,
                  border: `1px solid ${border}`,
                  background: card.image
                    ? `linear-gradient(180deg, rgba(2,6,23,0.24), rgba(2,6,23,0.86)), url(${card.image}) center/cover no-repeat`
                    : glass,
                  boxShadow: dark ? '0 22px 60px rgba(0,0,0,0.22)' : '0 20px 50px rgba(15,23,42,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
                <h3 style={{ color: text, fontSize: 18, lineHeight: 1.25, margin: '0 0 12px', fontWeight: 850 }}>
                  {card.title}
                </h3>
                {card.subtitle ? (
                  <div style={{ color: accent, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {card.subtitle}
                  </div>
                ) : null}
                <p style={{ color: muted, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderStory(section: AboutPageSectionConfig) {
    const stacked = isStacked(section);

    return (
      <section key={section.id} style={{ padding: isMobile ? '0 16px 64px' : '0 40px 92px' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: stacked ? '1fr' : '0.85fr 1.15fr',
            gap: 18,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              order: contentFirst(section) ? 1 : 2,
              minHeight: 320,
              borderRadius: 30,
              border: `1px solid ${border}`,
              background: section.image
                ? `linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.84)), url(${section.image}) center/cover no-repeat`
                : strongGlass,
              boxShadow: dark ? '0 26px 80px rgba(0,0,0,0.26)' : '0 22px 54px rgba(15,23,42,0.08)',
            }}
          />
          <div
            style={{
              order: contentFirst(section) ? 2 : 1,
              padding: isMobile ? 24 : 34,
              borderRadius: 30,
              border: `1px solid ${border}`,
              background: strongGlass,
              textAlign: section.alignment,
            }}
          >
            {renderLabel(section.label)}
            <h2 style={{ color: text, fontSize: isMobile ? 28 : 42, lineHeight: 1.08, letterSpacing: '-0.05em', margin: '0 0 18px' }}>
              {section.title}
            </h2>
            {section.subtitle ? <p style={{ color: accent, fontWeight: 800, margin: '0 0 16px' }}>{section.subtitle}</p> : null}
            {section.description ? <p style={{ color: muted, fontSize: 15, lineHeight: 1.85, margin: 0 }}>{section.description}</p> : null}
          </div>
        </div>
      </section>
    );
  }

  function renderCta(section: AboutPageSectionConfig) {
    return (
      <section key={section.id} style={{ padding: isMobile ? '0 16px 76px' : '0 40px 100px' }}>
        <div
          style={{
            maxWidth: 980,
            margin: '0 auto',
            textAlign: section.alignment,
            padding: isMobile ? '38px 22px' : '56px 48px',
            borderRadius: 34,
            border: `1px solid ${dark ? 'rgba(56,189,248,0.2)' : 'rgba(37,99,235,0.16)'}`,
            background: dark
              ? 'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.2), transparent 42%), linear-gradient(135deg, rgba(2,6,23,0.94), rgba(15,23,42,0.86))'
              : 'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.14), transparent 42%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.9))',
            boxShadow: dark ? '0 34px 120px rgba(0,0,0,0.36)' : '0 30px 90px rgba(15,23,42,0.1)',
          }}
        >
          {renderLabel(section.label)}
          <h2 style={{ color: text, fontSize: isMobile ? 32 : 52, letterSpacing: '-0.06em', lineHeight: 1, margin: '0 0 16px' }}>
            {section.title}
          </h2>
          {section.description ? (
            <p style={{ color: muted, maxWidth: 620, margin: section.alignment === 'center' ? '0 auto 28px' : '0 0 28px', lineHeight: 1.75, fontSize: 15 }}>
              {section.description}
            </p>
          ) : null}
          {renderButtons(section)}
        </div>
      </section>
    );
  }

  function renderSection(section: AboutPageSectionConfig) {
    if (section.type === 'hero') return renderHero(section);
    if (section.type === 'stats') return renderStats(section);
    if (section.type === 'skills' || section.type === 'services') return renderCards(section);
    if (section.type === 'story') return renderStory(section);
    if (section.type === 'cta') return renderCta(section);
    return null;
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: text,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {sections.map(renderSection)}
      <GlobalFooter config={footerConfig} isMobile={isMobile} />
    </main>
  );
}
