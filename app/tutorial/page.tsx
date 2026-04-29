'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';
import GlobalFooter from '@/components/shared/GlobalFooter';
import { getGlobalFooterConfig } from '@/lib/footer-content';
import { toSettingMap, type SettingRow } from '@/lib/hero-settings';
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
import {
  getTutorialCategoryConfig,
  getTutorialCategoryKey,
  getTutorialPageConfig,
  type TutorialPageConfig,
} from '@/lib/tutorial-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tutorial = {
  id: number;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail: string;
  category: string;
  duration: string;
  level: string;
  order_num: number;
  visible: boolean;
};

const LEVEL_META: Record<string, { label: string; color: string; bg: string }> = {
  beginner: {
    label: 'Beginner',
    color: '#4ade80',
    bg: 'rgba(34,197,94,0.12)',
  },
  intermediate: {
    label: 'Intermediate',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  advanced: {
    label: 'Advanced',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
  },
};

function getMaxWidth(width: TutorialPageConfig['hero']['width']) {
  switch (width) {
    case 'normal':
      return 1040;
    case 'full':
      return 1360;
    case 'wide':
    default:
      return 1240;
  }
}

function getSectionPadding(
  spacing: TutorialPageConfig['hero']['spacing'],
  isMobile: boolean
) {
  if (spacing === 'compact') {
    return isMobile ? '42px 16px' : '54px 28px';
  }

  if (spacing === 'spacious') {
    return isMobile ? '62px 16px' : '84px 28px';
  }

  return isMobile ? '52px 16px' : '68px 28px';
}

function getGapValue(gap: TutorialPageConfig['showcase']['gap']) {
  switch (gap) {
    case 'small':
      return 14;
    case 'large':
      return 24;
    default:
      return 18;
  }
}

function getColumns(
  width: number,
  config: TutorialPageConfig['showcase']
) {
  if (width < 720) {
    return config.mobileColumns;
  }

  if (width < 1080) {
    return config.tabletColumns;
  }

  return config.desktopColumns;
}

export default function TutorialPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [pageConfig, setPageConfig] = useState<TutorialPageConfig>(() =>
    getTutorialPageConfig({}, 0)
  );
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [footerConfig, setFooterConfig] = useState(() => createDefaultHomepageBuilderConfig().footer);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: settingsRows }, { data: tutorialRows }, dataset] = await Promise.all([
        supabase.from('site_settings').select('*'),
        supabase.from('tutorials').select('*').eq('visible', true).order('order_num', { ascending: true }),
        fetchPortfolioDataset(supabase),
      ]);

      const tutorialItems = (tutorialRows || []) as Tutorial[];
      const map = toSettingMap((settingsRows || []) as SettingRow[]);
      setPageConfig(getTutorialPageConfig(map, tutorialItems.length));
      setTutorials(tutorialItems);
      setFooterConfig(
        getGlobalFooterConfig(map, {
          projectCount: dataset.videos.length + dataset.graphics.length,
        })
      );
      setLoading(false);
    }

    void load();

    const syncViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportWidth(window.innerWidth);
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const bg = dark ? '#080808' : '#f8fbff';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? 'rgba(226,232,240,0.68)' : '#475569';
  const soft = dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)';
  const glass = dark
    ? 'linear-gradient(150deg, rgba(15,23,42,0.7), rgba(2,6,23,0.88))'
    : 'linear-gradient(150deg, rgba(255,255,255,0.96), rgba(239,246,255,0.84))';

  const visibleTutorials = useMemo(
    () =>
      tutorials.filter(item => {
        if (!item.category) {
          return true;
        }

        return getTutorialCategoryConfig(item.category, pageConfig.categoryConfig).enabled;
      }),
    [pageConfig.categoryConfig, tutorials]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(visibleTutorials.map(item => item.category).filter(Boolean)));
    return unique
      .map(category => {
        const config = getTutorialCategoryConfig(category, pageConfig.categoryConfig);
        return {
          key: getTutorialCategoryKey(category),
          original: category,
          label: config.label,
          order: config.order,
        };
      })
      .sort((leftItem, rightItem) => leftItem.order - rightItem.order || leftItem.label.localeCompare(rightItem.label));
  }, [pageConfig.categoryConfig, visibleTutorials]);

  const levels = useMemo(
    () => Array.from(new Set(visibleTutorials.map(item => item.level).filter(Boolean))),
    [visibleTutorials]
  );

  const resolvedActiveCategory =
    activeCategory === 'all' || categories.some(category => category.key === activeCategory)
      ? activeCategory
      : 'all';
  const resolvedActiveLevel =
    activeLevel === 'all' || levels.includes(activeLevel) ? activeLevel : 'all';

  const filteredTutorials = useMemo(
    () =>
      visibleTutorials.filter(item => {
        const categoryOk =
          resolvedActiveCategory === 'all' ||
          getTutorialCategoryKey(item.category) === resolvedActiveCategory;
        const levelOk = resolvedActiveLevel === 'all' || item.level === resolvedActiveLevel;
        return categoryOk && levelOk;
      }),
    [resolvedActiveCategory, resolvedActiveLevel, visibleTutorials]
  );

  const columns = getColumns(viewportWidth, pageConfig.showcase);
  const gridGap = getGapValue(pageConfig.showcase.gap);
  const denseCard = pageConfig.showcase.density === 'compact';
  const spaciousCard = pageConfig.showcase.density === 'spacious';
  const editorialMode = pageConfig.showcase.layoutType === 'editorial';

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#64748b',
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Tutorial page loading...
      </div>
    );
  }

  if (!pageConfig.pageEnabled) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: bg,
          color: text,
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'grid',
          placeItems: 'center',
          padding: '120px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 620,
            textAlign: 'center',
            borderRadius: 28,
            padding: '38px 28px',
            border: `1px solid ${soft}`,
            background: glass,
          }}
        >
          <div
            style={{
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Tutorials Hidden
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 34, fontWeight: 800, letterSpacing: '-0.05em' }}>
            Tutorial page is currently disabled.
          </h1>
          <p style={{ margin: 0, color: muted, lineHeight: 1.75 }}>
            Admin থেকে Tutorial Builder ব্যবহার করে visibility চালু করুন।
          </p>
        </div>
      </main>
    );
  }

  const sections = [
    { key: 'hero', order: pageConfig.hero.order, enabled: pageConfig.hero.enabled },
    {
      key: 'showcase',
      order: pageConfig.showcase.order,
      enabled: pageConfig.showcase.enabled,
    },
    { key: 'cta', order: pageConfig.cta.order, enabled: pageConfig.cta.enabled },
  ]
    .filter(section => section.enabled)
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);

  function renderHero() {
    const section = pageConfig.hero;
    const styles = section.styles;
    const center = section.alignment === 'center';
    const statItems = section.stats.filter(item => item.enabled).sort((a, b) => a.order - b.order);

    return (
      <section
        key="hero"
        style={{
          position: 'relative',
          padding: getSectionPaddingOverride(
            styles.layout.padding,
            isMobile,
            getSectionPadding(section.spacing, isMobile)
          ),
          background: dark
            ? 'radial-gradient(circle at 82% 18%, rgba(251,191,36,0.18), transparent 24%), radial-gradient(circle at 16% 24%, rgba(37,99,235,0.16), transparent 28%), #080808'
            : 'radial-gradient(circle at 82% 18%, rgba(251,191,36,0.12), transparent 24%), radial-gradient(circle at 16% 24%, rgba(37,99,235,0.12), transparent 28%), #f8fbff',
        }}
      >
        <div
          style={{
            maxWidth: getSectionWidthOverride(styles.layout.width, getMaxWidth(section.width)),
            margin: '0 auto',
            textAlign: section.alignment,
            display: 'grid',
            justifyItems: center ? 'center' : 'stretch',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              border: `1px solid ${dark ? 'rgba(251,191,36,0.22)' : 'rgba(245,158,11,0.18)'}`,
              background: dark ? 'rgba(251,191,36,0.08)' : 'rgba(254,243,199,0.88)',
              color: resolveSectionThemeColor(
                styles.colors.accentLight,
                styles.colors.accentDark,
                dark,
                '#fbbf24'
              ),
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              ...getTypographyStyleOverrides('label', styles.typography.label, {
                dark,
                isMobile,
                fallbackColor: resolveSectionThemeColor(
                  styles.colors.accentLight,
                  styles.colors.accentDark,
                  dark,
                  '#fbbf24'
                ),
                fallbackTextAlign: section.alignment,
                fallbackFontWeight: 900,
              }),
            }}
          >
            {section.label}
          </div>

          <h1
            style={{
              margin: 0,
              color: text,
              fontSize: isMobile ? 'clamp(2.7rem, 13vw, 4rem)' : 'clamp(4.1rem, 8vw, 6.5rem)',
              lineHeight: 0.94,
              letterSpacing: '-0.07em',
              fontWeight: 900,
              maxWidth: center ? 980 : 860,
              ...getTypographyStyleOverrides('title', styles.typography.title, {
                dark,
                isMobile,
                fallbackColor: text,
                fallbackTextAlign: section.alignment,
                fallbackFontWeight: 900,
                fallbackLineHeight: 0.94,
                fallbackLetterSpacing: '-0.07em',
              }),
            }}
          >
            {section.title}
          </h1>

          {section.subtitle ? (
            <div
              style={{
                color: resolveSectionThemeColor(
                  styles.colors.accentLight,
                  styles.colors.accentDark,
                  dark,
                  '#fbbf24'
                ),
                fontSize: isMobile ? 15 : 18,
                fontWeight: 850,
                ...getTypographyStyleOverrides('subtitle', styles.typography.subtitle, {
                  dark,
                  isMobile,
                  fallbackColor: resolveSectionThemeColor(
                    styles.colors.accentLight,
                    styles.colors.accentDark,
                    dark,
                    '#fbbf24'
                  ),
                  fallbackTextAlign: section.alignment,
                }),
              }}
            >
              {section.subtitle}
            </div>
          ) : null}

          {section.introText ? (
            <p
              style={{
                margin: 0,
                color: muted,
                fontSize: isMobile ? 15 : 17,
                lineHeight: 1.9,
                maxWidth: center ? 820 : 760,
                ...getTypographyStyleOverrides('body', styles.typography.body, {
                  dark,
                  isMobile,
                  fallbackColor: muted,
                  fallbackTextAlign: section.alignment,
                  fallbackLineHeight: 1.9,
                }),
              }}
            >
              {section.introText}
            </p>
          ) : null}

          {section.showStats && statItems.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : `repeat(${Math.min(4, statItems.length)}, minmax(0, 1fr))`,
                gap: 14,
                marginTop: 14,
                width: '100%',
                maxWidth: 820,
              }}
            >
              {statItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: isMobile ? 16 : 18,
                    borderRadius: 22,
                    border: `1px solid ${soft}`,
                    background: glass,
                    ...getCardSurfaceOverrides(styles, {
                      dark,
                      fallbackBackground: glass,
                      fallbackBorder: soft,
                    }),
                  }}
                >
                  <div style={{ color: '#fbbf24', fontSize: isMobile ? 22 : 26, fontWeight: 900 }}>
                    {item.value}
                  </div>
                  <div style={{ color: muted, fontSize: 12, marginTop: 6 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {section.showPrimaryButton ? (
            <div style={{ marginTop: 8 }}>
              <Link
                href={section.primaryButtonLink || '/contact'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: '14px 22px',
                  fontWeight: 850,
                  boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  ...getButtonStyleOverrides(styles, {
                    dark,
                    fallbackBackground: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    fallbackColor: '#fff',
                    fallbackBorder: soft,
                    fallbackShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  }),
                }}
              >
                {section.primaryButtonText}
                {styles.buttons.showIcon !== false ? <span>→</span> : null}
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  function renderShowcase() {
    const section = pageConfig.showcase;
    const styles = section.styles;

    function cardSurface() {
      switch (section.cardStyle) {
        case 'glass':
          return dark
            ? 'linear-gradient(180deg, rgba(15,23,42,0.62), rgba(2,6,23,0.84))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.84), rgba(239,246,255,0.86))';
        case 'minimal':
          return dark
            ? 'linear-gradient(180deg, rgba(6,10,24,0.92), rgba(2,6,23,0.98))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))';
        case 'light':
          return dark
            ? 'linear-gradient(180deg, rgba(8,15,32,0.94), rgba(2,6,23,0.98))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(241,245,249,0.98))';
        case 'cinematic':
        default:
          return dark
            ? 'linear-gradient(180deg, rgba(8,15,32,0.96), rgba(2,6,23,0.98))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(241,245,249,0.98))';
      }
    }

    return (
      <section
        key="showcase"
        style={{
          padding: getSectionPaddingOverride(
            styles.layout.padding,
            isMobile,
            getSectionPadding(section.spacing, isMobile)
          ),
        }}
      >
        <div
          style={{
            maxWidth: getSectionWidthOverride(styles.layout.width, getMaxWidth(section.width)),
            margin: '0 auto',
            display: 'grid',
            gap: styles.card.gap || 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: section.alignment === 'center' ? 'center' : 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {section.showCategoryFilters ? (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  justifyContent: section.alignment === 'center' ? 'center' : 'flex-start',
                }}
              >
                {section.showAllCategory ? (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    style={{
                      background:
                        resolvedActiveCategory === 'all'
                          ? 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)'
                          : dark
                            ? 'rgba(15,23,42,0.62)'
                            : 'rgba(255,255,255,0.82)',
                      color:
                        resolvedActiveCategory === 'all'
                          ? '#fff'
                          : resolveSectionThemeColor(
                              styles.colors.accentLight,
                              styles.colors.accentDark,
                              dark,
                              text
                            ),
                      border: `1px solid ${resolvedActiveCategory === 'all' ? 'rgba(96,165,250,0.5)' : soft}`,
                      borderRadius: 999,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {section.allCategoryLabel} ({visibleTutorials.length})
                  </button>
                ) : null}
                {categories.map(category => {
                  const count = visibleTutorials.filter(
                    item => getTutorialCategoryKey(item.category) === category.key
                  ).length;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setActiveCategory(category.key)}
                      style={{
                        background:
                          resolvedActiveCategory === category.key
                            ? 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)'
                            : dark
                              ? 'rgba(15,23,42,0.62)'
                              : 'rgba(255,255,255,0.82)',
                        color:
                          resolvedActiveCategory === category.key
                            ? '#fff'
                            : resolveSectionThemeColor(
                                styles.colors.accentLight,
                                styles.colors.accentDark,
                                dark,
                                text
                              ),
                        border: `1px solid ${resolvedActiveCategory === category.key ? 'rgba(96,165,250,0.5)' : soft}`,
                        borderRadius: 999,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {category.label} ({count})
                    </button>
                  );
                })}
              </div>
            ) : null}

            {section.showLevelFilters ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {section.showAllLevel ? (
                  <button
                    type="button"
                    onClick={() => setActiveLevel('all')}
                    style={{
                      background:
                        resolvedActiveLevel === 'all'
                          ? dark
                            ? 'rgba(251,191,36,0.18)'
                            : 'rgba(254,243,199,0.92)'
                          : 'transparent',
                      color: resolvedActiveLevel === 'all' ? '#fbbf24' : muted,
                      border: `1px solid ${resolvedActiveLevel === 'all' ? 'rgba(251,191,36,0.34)' : soft}`,
                      borderRadius: 999,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {section.allLevelLabel}
                  </button>
                ) : null}
                {levels.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActiveLevel(level)}
                    style={{
                      background:
                        resolvedActiveLevel === level ? LEVEL_META[level]?.bg || 'rgba(255,255,255,0.1)' : 'transparent',
                      color: resolvedActiveLevel === level ? LEVEL_META[level]?.color || text : muted,
                      border: `1px solid ${resolvedActiveLevel === level ? LEVEL_META[level]?.color || '#e2e8f0' : soft}`,
                      borderRadius: 999,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {LEVEL_META[level]?.label || level}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {filteredTutorials.length === 0 ? (
            <div
              style={{
                padding: '56px 24px',
                borderRadius: 26,
                border: `1px dashed ${soft}`,
                background: glass,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
              <div style={{ color: text, fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
                {section.emptyTitle}
              </div>
              <div style={{ color: muted, fontSize: 15, lineHeight: 1.8, maxWidth: 640, margin: '0 auto' }}>
                {section.emptyDescription}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: styles.card.gap || gridGap,
              }}
            >
              {filteredTutorials.map((tutorial, index) => (
                <button
                  key={tutorial.id}
                  type="button"
                  onClick={() => setSelectedTutorial(tutorial)}
                  style={{
                    textAlign: 'left',
                    padding: 0,
                    borderRadius: editorialMode ? 28 : 24,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `1px solid ${soft}`,
                    background: cardSurface(),
                    boxShadow: dark
                      ? '0 24px 44px rgba(2,6,23,0.24)'
                      : '0 18px 32px rgba(15,23,42,0.08)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    ...getCardSurfaceOverrides(styles, {
                      dark,
                      fallbackBackground: cardSurface(),
                      fallbackBorder: soft,
                      fallbackShadow: dark
                        ? '0 24px 44px rgba(2,6,23,0.24)'
                        : '0 18px 32px rgba(15,23,42,0.08)',
                    }),
                  }}
                  onMouseEnter={event => {
                    (event.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                    (event.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb';
                  }}
                  onMouseLeave={event => {
                    (event.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (event.currentTarget as HTMLButtonElement).style.borderColor = soft;
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      paddingBottom: editorialMode ? '64%' : '56.25%',
                      background: dark ? '#0f172a' : '#dbeafe',
                    }}
                  >
                    {tutorial.thumbnail ? (
                      <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.82))',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.92)',
                          display: 'grid',
                          placeItems: 'center',
                          boxShadow: '0 18px 34px rgba(2,6,23,0.28)',
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: '9px solid transparent',
                            borderBottom: '9px solid transparent',
                            borderLeft: '15px solid #0f172a',
                            marginLeft: 4,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: 'rgba(2,6,23,0.72)',
                        border: '1px solid rgba(148,163,184,0.16)',
                        color: '#e2e8f0',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      #{index + 1}
                    </div>
                    {tutorial.duration ? (
                      <div
                        style={{
                          position: 'absolute',
                          right: 14,
                          bottom: 14,
                          padding: '6px 10px',
                          borderRadius: 999,
                          background: 'rgba(2,6,23,0.72)',
                          border: '1px solid rgba(148,163,184,0.16)',
                          color: '#e2e8f0',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ⏱ {tutorial.duration}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      padding: denseCard
                        ? '16px 16px 15px'
                        : spaciousCard
                          ? '24px 22px 22px'
                          : '20px 18px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {tutorial.level && LEVEL_META[tutorial.level] ? (
                        <span
                          style={{
                            background: LEVEL_META[tutorial.level].bg,
                            color: LEVEL_META[tutorial.level].color,
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontWeight: 700,
                          }}
                        >
                          {LEVEL_META[tutorial.level].label}
                        </span>
                      ) : null}
                      {tutorial.category ? (
                        <span
                          style={{
                            background: dark ? 'rgba(15,23,42,0.62)' : 'rgba(226,232,240,0.82)',
                            color: muted,
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontWeight: 700,
                          }}
                        >
                          {getTutorialCategoryConfig(tutorial.category, pageConfig.categoryConfig).label}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: denseCard ? 17 : 20,
                        fontWeight: 800,
                        color: text,
                        lineHeight: 1.18,
                        marginBottom: 10,
                      }}
                    >
                      {tutorial.title}
                    </div>
                    {tutorial.description ? (
                      <p
                        style={{
                          margin: '0 0 14px',
                          color: muted,
                          fontSize: denseCard ? 13 : 14,
                          lineHeight: 1.7,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {tutorial.description}
                      </p>
                    ) : null}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#38bdf8',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Watch Preview
                      <span>↗</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderCta() {
    const section = pageConfig.cta;
    const styles = section.styles;

    return (
      <section
        key="cta"
        style={{
          padding: getSectionPaddingOverride(
            styles.layout.padding,
            isMobile,
            getSectionPadding(section.spacing, isMobile)
          ),
        }}
      >
        <div
          style={{
            maxWidth: getSectionWidthOverride(styles.layout.width, getMaxWidth(section.width)),
            margin: '0 auto',
            padding: isMobile ? '28px 20px' : '42px 30px',
            borderRadius: 34,
            border: `1px solid ${soft}`,
            background: glass,
            boxShadow: dark
              ? '0 28px 74px rgba(2,6,23,0.28)'
              : '0 24px 64px rgba(15,23,42,0.08)',
            textAlign: section.alignment,
            ...getCardSurfaceOverrides(styles, {
              dark,
              fallbackBackground: glass,
              fallbackBorder: soft,
              fallbackShadow: dark
                ? '0 28px 74px rgba(2,6,23,0.28)'
                : '0 24px 64px rgba(15,23,42,0.08)',
            }),
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              marginBottom: 16,
              border: `1px solid ${soft}`,
              background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.8)',
              color: resolveSectionThemeColor(
                styles.colors.accentLight,
                styles.colors.accentDark,
                dark,
                '#38bdf8'
              ),
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              ...getTypographyStyleOverrides('label', styles.typography.label, {
                dark,
                isMobile,
                fallbackColor: resolveSectionThemeColor(
                  styles.colors.accentLight,
                  styles.colors.accentDark,
                  dark,
                  '#38bdf8'
                ),
                fallbackTextAlign: section.alignment,
              }),
            }}
          >
            {section.label}
          </div>
          <h2
            style={{
              margin: '0 0 12px',
              color: text,
              fontSize: isMobile ? 28 : 42,
              letterSpacing: '-0.05em',
            }}
          >
            {section.title}
          </h2>
          {section.description ? (
            <p style={{ margin: '0 auto', color: muted, lineHeight: 1.85, fontSize: 15, maxWidth: 760 }}>
              {section.description}
            </p>
          ) : null}
          {section.showButton ? (
            <div style={{ marginTop: 24 }}>
              <Link
                href={section.buttonLink || '/contact'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: '14px 22px',
                  fontWeight: 850,
                  boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  ...getButtonStyleOverrides(styles, {
                    dark,
                    fallbackBackground: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    fallbackColor: '#fff',
                    fallbackBorder: soft,
                    fallbackShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  }),
                }}
              >
                {section.buttonText}
                {styles.buttons.showIcon !== false ? <span>→</span> : null}
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const renderers: Record<string, () => React.ReactNode> = {
    hero: renderHero,
    showcase: renderShowcase,
    cta: renderCta,
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: text,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {sections.map(section => renderers[section.key]())}

      {selectedTutorial ? (
        <div
          onClick={() => setSelectedTutorial(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.92)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 14 : 24,
          }}
        >
          <div
            onClick={event => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 980,
              borderRadius: 28,
              overflow: 'hidden',
              border: `1px solid ${soft}`,
              background: glass,
              boxShadow: dark
                ? '0 40px 120px rgba(2,6,23,0.54)'
                : '0 24px 80px rgba(15,23,42,0.16)',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                borderBottom: `1px solid ${soft}`,
              }}
            >
              <div>
                <div style={{ color: text, fontSize: isMobile ? 18 : 22, fontWeight: 800 }}>
                  {selectedTutorial.title}
                </div>
                <div style={{ color: muted, fontSize: 13, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {selectedTutorial.level && LEVEL_META[selectedTutorial.level] ? (
                    <span style={{ color: LEVEL_META[selectedTutorial.level].color }}>
                      {LEVEL_META[selectedTutorial.level].label}
                    </span>
                  ) : null}
                  {selectedTutorial.category ? (
                    <span>
                      {getTutorialCategoryConfig(selectedTutorial.category, pageConfig.categoryConfig).label}
                    </span>
                  ) : null}
                  {selectedTutorial.duration ? <span>⏱ {selectedTutorial.duration}</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTutorial(null)}
                style={{
                  background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.82)',
                  color: text,
                  border: `1px solid ${soft}`,
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
              <iframe
                src={`${selectedTutorial.youtube_url}${selectedTutorial.youtube_url.includes('?') ? '&' : '?'}autoplay=1`}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {selectedTutorial.description ? (
              <div style={{ padding: '18px 20px 24px', color: muted, fontSize: 15, lineHeight: 1.8 }}>
                {selectedTutorial.description}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <GlobalFooter config={footerConfig} isMobile={isMobile} />
    </main>
  );
}
