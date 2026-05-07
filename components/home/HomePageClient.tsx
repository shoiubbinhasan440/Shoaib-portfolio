'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import ExperienceSection from '@/components/about/ExperienceSection';
import { useTheme } from '@/components/ThemeProvider';
import GlobalFooter from '@/components/shared/GlobalFooter';
import {
  type AboutSystemConfig,
  type AboutSpacingPreset,
  type AboutWidthPreset,
} from '@/lib/about-content';
import { getVisibleExperienceItems } from '@/lib/about-content';
import {
  type HomepageBuilderConfig,
  type HomepageSpacingPreset,
  type HomepageStatItem,
  type HomepageWidthPreset,
} from '@/lib/homepage-content';
import {
  getButtonAlignmentOverride,
  getButtonStyleOverrides,
  getCardSurfaceOverrides,
  getSectionPaddingOverride,
  getSectionWidthOverride,
  getTypographyStyleOverrides,
  resolveSectionThemeColor,
} from '@/lib/page-builder-styles';
import {
  getHomepagePortfolioPreviewItems,
  isHomepageItemAllowed,
  toPortfolioPreviewItems,
  type HomepagePortfolioSectionSettings,
  type PortfolioCategory,
  type PortfolioGraphic,
  type PortfolioItemMetaConfigMap,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
  type PortfolioVideo,
} from '@/lib/portfolio-content';

const PortfolioShowcase = dynamic(() => import('@/components/portfolio/PortfolioShowcase'), {
  ssr: false,
  loading: () => null,
});

function getSectionMaxWidth(
  preset: HomepageWidthPreset | AboutWidthPreset | undefined,
  fallback: HomepageWidthPreset | AboutWidthPreset = 'wide'
) {
  switch (preset || fallback) {
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
  spacing: HomepageSpacingPreset | AboutSpacingPreset | undefined,
  isMobile: boolean,
  fallback: HomepageSpacingPreset | AboutSpacingPreset = 'balanced'
) {
  const value = spacing || fallback;

  if (value === 'compact') {
    return isMobile ? '34px 16px' : '48px 32px';
  }

  if (value === 'spacious') {
    return isMobile ? '58px 18px' : '88px 40px';
  }

  return isMobile ? '42px 18px' : '64px 36px';
}

function getHeroHeightPreset(
  preset: HomepageBuilderConfig['hero']['heightPreset'],
  isMobile: boolean
) {
  const navOffset = isMobile ? '64px' : '72px';

  if (preset === 'medium') {
    return isMobile ? 'min(72svh, 640px)' : 'min(78vh, 680px)';
  }

  if (preset === 'large') {
    return isMobile
      ? `min(86svh, calc(100svh - ${navOffset}))`
      : `min(820px, calc(100svh - ${navOffset}))`;
  }

  return `calc(100svh - ${navOffset})`;
}

function getHeroOverlay(
  strength: HomepageBuilderConfig['hero']['overlayStrength'],
  isMobile: boolean
) {
  if (strength === 'soft') {
    return isMobile
      ? 'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(2,6,23,0.42) 54%, rgba(2,6,23,0.82) 100%)'
      : 'linear-gradient(96deg, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.56) 28%, rgba(15,23,42,0.22) 58%, rgba(14,165,233,0.12) 78%, rgba(2,6,23,0.64) 100%)';
  }

  if (strength === 'medium') {
    return isMobile
      ? 'linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(2,6,23,0.52) 50%, rgba(2,6,23,0.92) 100%)'
      : 'linear-gradient(96deg, rgba(2,6,23,0.84) 0%, rgba(2,6,23,0.68) 30%, rgba(15,23,42,0.28) 58%, rgba(14,165,233,0.14) 78%, rgba(2,6,23,0.72) 100%)';
  }

  return isMobile
    ? 'linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(2,6,23,0.58) 50%, rgba(2,6,23,0.96) 100%)'
    : 'linear-gradient(96deg, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.76) 30%, rgba(15,23,42,0.34) 58%, rgba(14,165,233,0.16) 78%, rgba(2,6,23,0.76) 100%)';
}

function getHeroBottomFade(
  strength: HomepageBuilderConfig['hero']['overlayStrength'],
  isMobile: boolean,
  enabled: boolean
) {
  if (!enabled) {
    return 'transparent';
  }

  if (strength === 'soft') {
    return isMobile
      ? 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.08) 24%, rgba(8,47,73,0.18) 54%, rgba(2,6,23,0.68) 78%, rgba(2,6,23,0.9) 100%)'
      : 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.06) 20%, rgba(8,47,73,0.16) 48%, rgba(2,6,23,0.48) 74%, rgba(2,6,23,0.76) 100%)';
  }

  if (strength === 'medium') {
    return isMobile
      ? 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.1) 24%, rgba(8,47,73,0.22) 54%, rgba(2,6,23,0.74) 78%, rgba(2,6,23,0.94) 100%)'
      : 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.08) 20%, rgba(8,47,73,0.18) 48%, rgba(2,6,23,0.56) 74%, rgba(2,6,23,0.82) 100%)';
  }

  return isMobile
    ? 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.12) 24%, rgba(8,47,73,0.26) 52%, rgba(2,6,23,0.78) 78%, rgba(2,6,23,0.96) 100%)'
    : 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.08) 20%, rgba(8,47,73,0.2) 48%, rgba(2,6,23,0.6) 74%, rgba(2,6,23,0.84) 100%)';
}

function toPrivacyEnhancedYouTubeUrl(url: string) {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);
    let videoId = '';

    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.pathname.startsWith('/embed/')
        ? parsed.pathname.split('/embed/')[1]?.split('/')[0] || ''
        : parsed.searchParams.get('v') || '';
    }

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace('/', '').split('/')[0] || '';
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
  } catch {
    return url;
  }

  return url.replace('https://www.youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/');
}

function withAutoplay(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}autoplay=1`;
}

function toEnabledStats(items: HomepageStatItem[]) {
  return items
    .filter(item => item.enabled)
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

export type HomePageClientProps = {
  aboutSystem: AboutSystemConfig;
  homepageBuilder: HomepageBuilderConfig;
  portfolioVideos: PortfolioVideo[];
  portfolioGraphics: PortfolioGraphic[];
  portfolioCategories: PortfolioCategory[];
  homepagePortfolioSettings: HomepagePortfolioSectionSettings;
  portfolioPageSettings: PortfolioPageSettings;
  portfolioItemMetaConfig: PortfolioItemMetaConfigMap;
};

export default function HomePageClient({
  aboutSystem,
  homepageBuilder,
  portfolioVideos,
  portfolioGraphics,
  portfolioCategories,
  homepagePortfolioSettings,
  portfolioPageSettings,
  portfolioItemMetaConfig,
}: HomePageClientProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const contactRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [showInlineShowreel, setShowInlineShowreel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const bg = dark ? '#080808' : '#f9f9f9';
  const text = dark ? '#fff' : '#111';
  const sub = dark ? '#94a3b8' : '#64748b';
  const card = dark ? '#0d0d0d' : '#fff';
  const border = dark ? '#1a1a1a' : '#e5e5e5';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const allPortfolioItems: PortfolioPreviewItem[] = useMemo(
    () =>
      toPortfolioPreviewItems(
        portfolioVideos,
        portfolioGraphics,
        portfolioCategories
      ),
    [portfolioCategories, portfolioGraphics, portfolioVideos]
  );

  const homepagePreviewItems = useMemo(
    () =>
      getHomepagePortfolioPreviewItems(allPortfolioItems, {
        itemConfig: homepagePortfolioSettings.itemConfig,
        itemLimit: homepagePortfolioSettings.itemLimit,
        showVideos: homepagePortfolioSettings.showVideos,
        showGraphics: homepagePortfolioSettings.showGraphics,
        categoryConfig: homepagePortfolioSettings.categoryConfig,
        itemMetaConfig: portfolioItemMetaConfig,
      }),
    [allPortfolioItems, homepagePortfolioSettings, portfolioItemMetaConfig]
  );

  const homepageCategoryPreviewItems = useMemo(
    () =>
      allPortfolioItems.filter(item =>
        isHomepageItemAllowed(item, {
          itemConfig: homepagePortfolioSettings.itemConfig,
          showVideos: homepagePortfolioSettings.showVideos,
          showGraphics: homepagePortfolioSettings.showGraphics,
          categoryConfig: homepagePortfolioSettings.categoryConfig,
        })
      ),
    [allPortfolioItems, homepagePortfolioSettings]
  );

  const openLink = (href: string) => {
    if (!href) {
      return;
    }

    if (href === '#contact') {
      contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (/^https?:\/\//.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    router.push(href);
  };

  const hero = homepageBuilder.hero;
  const showreelSection = homepageBuilder.showreel;
  const statsSection = homepageBuilder.stats;
  const ctaSection = homepageBuilder.cta;
  const homepageAbout = aboutSystem.homepage;
  const heroStyles = hero.styles;
  const showreelStyles = showreelSection.styles;
  const statsStyles = statsSection.styles;
  const ctaStyles = ctaSection.styles;
  const aboutStyles = homepageAbout.styles;
  const homepageExperienceItems = useMemo(
    () =>
      getVisibleExperienceItems(aboutSystem.experience, 'homepage').slice(
        0,
        aboutSystem.experience.homepageItemLimit
      ),
    [aboutSystem.experience]
  );
  const heroStats = toEnabledStats(hero.stats).slice(0, 3);
  const heroCtaIsStacked =
    hero.ctaLayout === 'stack' || (hero.ctaLayout === 'responsive' && isMobile);
  const heroCtaJustify =
    hero.ctaAlignment === 'center'
      ? 'center'
      : hero.ctaAlignment === 'right'
        ? 'flex-end'
        : 'flex-start';
  const heroCtaAlignItems =
    hero.ctaAlignment === 'center'
      ? 'center'
      : hero.ctaAlignment === 'right'
        ? 'flex-end'
        : 'flex-start';
  const statsItems = toEnabledStats(statsSection.items);
  const heroUsesSplitLayout = !isMobile && hero.layout === 'split';
  const heroContentOrder = heroUsesSplitLayout && hero.alignment === 'right' ? 2 : 1;
  const heroFloatingOrder = heroContentOrder === 2 ? 1 : 2;
  const currentHeroImage = isMobile
    ? hero.mobileImage || hero.desktopImage
    : hero.desktopImage || hero.mobileImage;
  const showreelEmbedUrl = toPrivacyEnhancedYouTubeUrl(showreelSection.videoUrl);
  const heroMaxWidth = getSectionMaxWidth(hero.width, homepageBuilder.global.contentWidth);
  const heroMinHeight = getHeroHeightPreset(hero.heightPreset, isMobile);
  const heroPanelMaxWidth = heroUsesSplitLayout
    ? Math.min(hero.contentMaxWidth, 520)
    : hero.contentMaxWidth;
  const heroOverlay = getHeroOverlay(hero.overlayStrength, isMobile);
  const heroBottomFade = getHeroBottomFade(hero.overlayStrength, isMobile, hero.showBottomOverlay);
  const heroPanelBackground = dark
    ? 'linear-gradient(180deg, rgba(2,6,23,0.62) 0%, rgba(2,6,23,0.82) 100%)'
    : 'linear-gradient(180deg, rgba(15,23,42,0.46) 0%, rgba(15,23,42,0.72) 100%)';
  const heroPanelBorder = dark ? 'rgba(148,163,184,0.16)' : 'rgba(255,255,255,0.22)';
  const heroAccent = resolveSectionThemeColor(
    heroStyles.colors.accentLight,
    heroStyles.colors.accentDark,
    dark,
    dark ? '#bae6fd' : '#e0f2fe'
  );
  const aboutAccent = resolveSectionThemeColor(
    aboutStyles.colors.accentLight,
    aboutStyles.colors.accentDark,
    dark,
    dark ? '#7dd3fc' : '#2563eb'
  );
  const aboutIsStacked =
    isMobile || homepageAbout.layout === 'stacked' || homepageAbout.layout === 'centered';
  const aboutImageFirst =
    homepageAbout.layout === 'image-left' || homepageAbout.layout === 'card-left';
  const aboutUsesCompactVisual =
    homepageAbout.layout === 'card-left' || homepageAbout.layout === 'card-right';
  const aboutTextAlign =
    aboutIsStacked && homepageAbout.layout === 'centered'
      ? 'center'
      : homepageAbout.alignment;
  const aboutCards = homepageAbout.cards.slice(0, homepageAbout.maxCards);
  const aboutPadding = getSectionPaddingOverride(
    aboutStyles.layout.padding,
    isMobile,
    getSectionPadding(homepageAbout.spacing, isMobile, 'balanced')
  );
  const aboutMaxWidth = getSectionWidthOverride(
    aboutStyles.layout.width,
    getSectionMaxWidth(homepageAbout.width, 'wide')
  );
  const ctaMaxWidth = getSectionWidthOverride(
    ctaStyles.layout.width,
    getSectionMaxWidth(ctaSection.width, 'narrow')
  );
  const ctaUsesSplitLayout =
    !isMobile &&
    (ctaSection.layout === 'split' ||
      ctaSection.layout === 'media-left' ||
      ctaSection.layout === 'media-right');
  const ctaTextOrder = ctaUsesSplitLayout && ctaSection.layout === 'media-left' ? 2 : 1;
  const ctaVisualOrder = ctaUsesSplitLayout && ctaSection.layout === 'media-left' ? 1 : 2;

  const heroSection = hero.enabled ? (
    <section
      style={{
        position: 'relative',
        minHeight: heroMinHeight,
        display: 'flex',
        alignItems:
          isMobile && hero.mobileContentPosition === 'center'
            ? 'center'
            : isMobile
              ? 'flex-end'
              : 'stretch',
        overflow: 'hidden',
        isolation: 'isolate',
        background: '#020617',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#020617',
          transform: isMobile ? 'scale(1.02)' : 'scale(1.01)',
        }}
      >
        {currentHeroImage ? (
          <Image
            src={currentHeroImage}
            alt=""
            fill
            priority
            fetchPriority="high"
            quality={72}
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: isMobile ? 'center top' : '58% center',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1d4ed8 100%)',
            }}
          />
        )}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: heroOverlay }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 76% 28%, rgba(59,130,246,0.28), transparent 34%), radial-gradient(circle at 14% 18%, rgba(14,165,233,0.16), transparent 24%)',
        }}
      />
      {hero.showBottomOverlay ? (
        <div
          style={{
            position: 'absolute',
            inset: 'auto 0 0 0',
            height: isMobile ? '48%' : '38%',
            background: heroBottomFade,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: getSectionWidthOverride(heroStyles.layout.width, heroMaxWidth),
          margin: '0 auto',
          minHeight: heroMinHeight,
          display: 'grid',
          gridTemplateColumns:
            !heroUsesSplitLayout
              ? '1fr'
              : hero.alignment === 'right'
                ? 'minmax(420px, 1fr) minmax(360px, 520px)'
                : 'minmax(360px, 520px) minmax(420px, 1fr)',
          alignItems:
            isMobile && hero.mobileContentPosition === 'center'
              ? 'center'
              : isMobile
                ? 'end'
                : 'center',
          gap: isMobile ? 20 : 40,
          padding: getSectionPaddingOverride(
            heroStyles.layout.padding,
            isMobile,
            hero.spacing === 'compact'
              ? isMobile
                ? '24px 14px calc(10px + env(safe-area-inset-bottom))'
                : '34px clamp(18px, 4vw, 48px) 38px'
              : hero.spacing === 'spacious'
                ? isMobile
                  ? '54px 16px calc(14px + env(safe-area-inset-bottom))'
                  : '56px clamp(24px, 5vw, 72px) 58px'
                : isMobile
                  ? '36px 14px calc(10px + env(safe-area-inset-bottom))'
                  : '44px clamp(22px, 5vw, 64px) 46px'
          ),
          justifyItems:
            !isMobile && !heroUsesSplitLayout && hero.alignment === 'center'
              ? 'center'
              : 'stretch',
        }}
      >
        <div
          style={{
            width: isMobile ? 'min(100%, 380px)' : '100%',
            maxWidth: isMobile ? 380 : heroPanelMaxWidth,
            order: heroContentOrder,
            justifySelf:
              heroUsesSplitLayout
                ? hero.alignment === 'right'
                  ? 'end'
                  : 'start'
                : isMobile || hero.alignment === 'center'
                ? 'center'
                : hero.alignment === 'right'
                  ? 'end'
                  : 'start',
            alignSelf: isMobile ? 'end' : 'auto',
            padding: isMobile ? '18px 14px 16px' : '34px 32px 28px',
            borderRadius: isMobile ? 22 : 30,
            border: `1px solid ${heroPanelBorder}`,
            background: heroPanelBackground,
            backdropFilter: 'blur(18px)',
            boxShadow: dark
              ? '0 30px 90px rgba(2,6,23,0.38)'
              : '0 30px 90px rgba(15,23,42,0.22)',
            textAlign: hero.layout === 'centered' ? 'center' : hero.alignment,
            ...getCardSurfaceOverrides(heroStyles, {
              dark,
              fallbackBackground: heroPanelBackground,
              fallbackBorder: heroPanelBorder,
              fallbackShadow: dark
                ? '0 30px 90px rgba(2,6,23,0.38)'
                : '0 30px 90px rgba(15,23,42,0.22)',
            }),
          }}
        >
          {hero.showBadge ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${heroPanelBorder}`,
                color: heroAccent,
                padding: isMobile ? '6px 13px' : '7px 16px',
                borderRadius: 999,
                marginBottom: isMobile ? 16 : 22,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                ...getTypographyStyleOverrides('label', heroStyles.typography.label, {
                  dark,
                  isMobile,
                  fallbackColor: heroAccent,
                  fallbackTextAlign: hero.layout === 'centered' ? 'center' : hero.alignment,
                  fallbackLetterSpacing: '0.14em',
                }),
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  background: heroAccent,
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: '0 0 18px rgba(56,189,248,0.75)',
                }}
              />
              <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700 }}>
                {hero.badge}
              </span>
            </div>
          ) : null}

          <h1
            style={{
              fontSize: isMobile ? 'clamp(2.1rem, 9.8vw, 3.15rem)' : 'clamp(3.5rem, 6vw, 5.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.06em',
              lineHeight: isMobile ? 0.98 : 0.95,
              margin: isMobile ? '0 0 14px' : '0 0 18px',
              color: dark ? '#f8fafc' : '#ffffff',
              maxWidth: isMobile ? '100%' : hero.contentMaxWidth,
              ...getTypographyStyleOverrides('title', heroStyles.typography.title, {
                dark,
                isMobile,
                fallbackColor: dark ? '#f8fafc' : '#ffffff',
                fallbackTextAlign: hero.layout === 'centered' ? 'center' : hero.alignment,
                fallbackFontWeight: 800,
                fallbackLineHeight: isMobile ? 0.98 : 0.95,
                fallbackLetterSpacing: '-0.06em',
              }),
            }}
          >
            {hero.title}
          </h1>

          {hero.showSubtitle ? (
            <p
              style={{
                fontSize: isMobile ? 14 : 17,
                color: dark ? 'rgba(226,232,240,0.82)' : 'rgba(255,255,255,0.82)',
                maxWidth: hero.layout === 'centered' ? 620 : 470,
                margin: isMobile ? '0 0 22px' : '0 0 28px',
                lineHeight: isMobile ? 1.62 : 1.78,
                ...getTypographyStyleOverrides('body', heroStyles.typography.body, {
                  dark,
                  isMobile,
                  fallbackColor: dark ? 'rgba(226,232,240,0.82)' : 'rgba(255,255,255,0.82)',
                  fallbackTextAlign: hero.layout === 'centered' ? 'center' : hero.alignment,
                  fallbackLineHeight: isMobile ? 1.62 : 1.78,
                }),
              }}
            >
              {hero.subtitle}
            </p>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexDirection: heroCtaIsStacked ? 'column' : 'row',
              flexWrap: heroCtaIsStacked ? 'nowrap' : 'wrap',
              justifyContent: getButtonAlignmentOverride(
                heroStyles.layout.buttonAlign,
                heroCtaJustify
              ),
              alignItems: heroCtaIsStacked ? heroCtaAlignItems : 'center',
              gap: heroCtaIsStacked ? 12 : isMobile ? 10 : 14,
              marginBottom: hero.showStats && heroStats.length > 0 ? (isMobile ? 16 : 22) : 0,
            }}
          >
            {hero.showPrimaryButton ? (
              <button
                onClick={() => openLink(hero.primaryButtonLink)}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                  color: '#fff',
                  border: 'none',
                  width: heroCtaIsStacked ? (isMobile ? '100%' : 'max-content') : 'auto',
                  minWidth: 0,
                  padding: isMobile ? '10px 8px' : '14px 26px',
                  borderRadius: isMobile ? 12 : 14,
                  fontWeight: 700,
                  fontSize: isMobile ? 12 : 15,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  boxShadow: '0 18px 40px rgba(37,99,235,0.35)',
                  ...getButtonStyleOverrides(heroStyles, {
                    dark,
                    fallbackBackground: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                    fallbackColor: '#fff',
                    fallbackBorder: heroPanelBorder,
                    fallbackShadow: '0 18px 40px rgba(37,99,235,0.35)',
                  }),
                }}
              >
                {isMobile
                  ? hero.primaryButtonText
                  : heroStyles.buttons.showIcon !== false
                    ? `${hero.primaryButtonText} →`
                    : hero.primaryButtonText}
              </button>
            ) : null}
            {hero.showSecondaryButton ? (
              <button
                onClick={() => openLink(hero.secondaryButtonLink)}
                style={{
                  background: 'rgba(2,6,23,0.18)',
                  color: '#f8fafc',
                  border: `1px solid ${dark ? 'rgba(148,163,184,0.26)' : 'rgba(255,255,255,0.24)'}`,
                  width: heroCtaIsStacked ? (isMobile ? '100%' : 'max-content') : 'auto',
                  minWidth: 0,
                  padding: isMobile ? '10px 8px' : '14px 24px',
                  borderRadius: isMobile ? 12 : 14,
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 15,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  ...getButtonStyleOverrides(heroStyles, {
                    dark,
                    fallbackBackground: 'rgba(2,6,23,0.18)',
                    fallbackColor: '#f8fafc',
                    fallbackBorder: dark ? 'rgba(148,163,184,0.26)' : 'rgba(255,255,255,0.24)',
                    fallbackShadow: 'none',
                  }),
                }}
              >
                {hero.secondaryButtonText}
              </button>
            ) : null}
            {hero.showShowreelButton ? (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'rgba(2,6,23,0.14)',
                  color: '#f8fafc',
                  border: `1px solid ${dark ? 'rgba(148,163,184,0.26)' : 'rgba(255,255,255,0.24)'}`,
                  width: heroCtaIsStacked ? (isMobile ? '100%' : 'max-content') : 'auto',
                  minWidth: 0,
                  padding: isMobile ? '10px 8px' : '14px 20px',
                  borderRadius: isMobile ? 12 : 14,
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 4 : 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                  ...getButtonStyleOverrides(heroStyles, {
                    dark,
                    fallbackBackground: 'rgba(2,6,23,0.14)',
                    fallbackColor: '#f8fafc',
                    fallbackBorder: dark ? 'rgba(148,163,184,0.26)' : 'rgba(255,255,255,0.24)',
                    fallbackShadow: 'none',
                  }),
                }}
              >
                <span
                  style={{
                    width: isMobile ? 18 : 26,
                    height: isMobile ? 18 : 26,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.14)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: isMobile ? 7 : 10,
                  }}
                >
                  ▶
                </span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hero.showreelButtonText}
                </span>
              </button>
            ) : null}
          </div>

          {hero.showStats && heroStats.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? `repeat(${Math.min(3, heroStats.length)}, minmax(0, 1fr))` : `repeat(${heroStats.length}, max-content)`,
                gap: isMobile ? 6 : 10,
                justifyContent:
                  hero.layout === 'centered'
                    ? 'center'
                    : hero.alignment === 'center'
                      ? 'center'
                      : 'flex-start',
              }}
            >
              {heroStats.map(item => (
                <div
                  key={item.id}
                  style={{
                    minWidth: 0,
                    padding: isMobile ? '9px 8px' : '12px 14px',
                    borderRadius: isMobile ? 14 : 16,
                    background: dark ? 'rgba(15,23,42,0.52)' : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${heroPanelBorder}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#f8fafc', marginBottom: isMobile ? 2 : 4 }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: isMobile ? 9 : 11, color: 'rgba(226,232,240,0.72)', letterSpacing: isMobile ? '0.05em' : '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {heroUsesSplitLayout && hero.showFloatingCard ? (
          <div
            style={{
              order: heroFloatingOrder,
              minHeight: '100%',
              display: 'flex',
              alignItems:
                hero.floatingCardPosition === 'top-right' || hero.floatingCardPosition === 'top-left'
                  ? 'flex-start'
                  : 'center',
              justifyContent:
                hero.floatingCardPosition === 'top-left' || hero.floatingCardPosition === 'bottom-left'
                  ? 'flex-start'
                  : 'flex-end',
              paddingTop:
                hero.floatingCardPosition === 'top-right' || hero.floatingCardPosition === 'top-left'
                  ? 18
                  : 0,
              paddingBottom:
                hero.floatingCardPosition === 'bottom-right' || hero.floatingCardPosition === 'bottom-left'
                  ? 0
                  : 0,
            }}
          >
            <div
              style={{
                maxWidth: 340,
                padding: '18px 18px 16px',
                borderRadius: 24,
                border: `1px solid ${heroPanelBorder}`,
                background: dark ? 'rgba(2,6,23,0.4)' : 'rgba(15,23,42,0.24)',
                color: '#e2e8f0',
                backdropFilter: 'blur(14px)',
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 10 }}>
                {hero.floatingCardEyebrow}
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.55, fontWeight: 600 }}>
                {hero.floatingCardText}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  ) : null;

  const portfolioSection =
    homepagePortfolioSettings.enabled &&
    (homepagePortfolioSettings.displayMode === 'category-preview'
      ? homepageCategoryPreviewItems.length > 0
      : homepagePreviewItems.length > 0) ? (
      <PortfolioShowcase
        variant="homepage"
        items={
          homepagePortfolioSettings.displayMode === 'category-preview'
            ? homepageCategoryPreviewItems
            : homepagePreviewItems
        }
        categories={portfolioCategories}
        pageSettings={portfolioPageSettings}
        badge={homepagePortfolioSettings.badge}
        title={homepagePortfolioSettings.title}
        subtitle={homepagePortfolioSettings.subtitle}
        buttonText={homepagePortfolioSettings.buttonText}
        buttonLink={homepagePortfolioSettings.buttonLink}
        homepageSettings={homepagePortfolioSettings}
        itemMetaConfig={portfolioItemMetaConfig}
      />
    ) : null;

  const aboutSection = homepageAbout.enabled ? (
    <>
      <section
        style={{
          padding: aboutPadding,
          background: dark
            ? 'linear-gradient(180deg, #080808 0%, #020617 48%, #080808 100%)'
            : 'linear-gradient(180deg, #f9f9f9 0%, #eef5ff 48%, #f9f9f9 100%)',
        }}
      >
        <div
          style={{
            maxWidth: aboutMaxWidth,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns:
              aboutIsStacked
                ? '1fr'
                : 'minmax(0, 0.9fr) minmax(360px, 0.75fr)',
            gap: homepageAbout.spacing === 'compact' ? 24 : homepageAbout.spacing === 'spacious' ? 64 : 44,
            alignItems: 'center',
            textAlign: aboutTextAlign,
          }}
        >
          <div style={{ order: aboutImageFirst ? 2 : 1, justifySelf: aboutTextAlign === 'center' ? 'center' : 'stretch' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 13px',
                borderRadius: 999,
                border: `1px solid ${dark ? 'rgba(56,189,248,0.22)' : 'rgba(37,99,235,0.18)'}`,
                background: dark ? 'rgba(14,165,233,0.08)' : 'rgba(219,234,254,0.78)',
                color: aboutAccent,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: aboutAccent }} />
              {homepageAbout.label}
            </div>

            <h2
              style={{
                fontSize: isMobile ? 'clamp(30px, 10vw, 42px)' : 'clamp(40px, 5vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-0.06em',
                lineHeight: 0.98,
                margin: '0 0 16px',
                color: text,
                maxWidth: 720,
              }}
            >
              {homepageAbout.title}
            </h2>

            <div
              style={{
                color: aboutAccent,
                fontSize: isMobile ? 14 : 16,
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              {homepageAbout.role}
            </div>

            <p
              style={{
                color: dark ? 'rgba(226,232,240,0.72)' : '#475569',
                fontSize: isMobile ? 14 : 16,
                lineHeight: 1.85,
                maxWidth: 650,
                margin: '0 0 26px',
              }}
            >
              {homepageAbout.description}
            </p>

            {homepageAbout.showCards && aboutCards.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                  marginBottom: 28,
                  maxWidth: 680,
                }}
              >
                {aboutCards.map((skill, index) => (
                  <div
                    key={`${skill.id}-${index}`}
                    style={{
                      padding: isMobile ? '14px 15px' : '16px 18px',
                      borderRadius: 18,
                      border: `1px solid ${dark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.08)'}`,
                      background: dark
                        ? 'linear-gradient(145deg, rgba(15,23,42,0.58), rgba(2,6,23,0.72))'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(239,246,255,0.72))',
                      boxShadow: dark ? '0 20px 48px rgba(0,0,0,0.24)' : '0 18px 42px rgba(15,23,42,0.07)',
                      ...getCardSurfaceOverrides(aboutStyles, {
                        dark,
                        fallbackBackground: dark
                          ? 'linear-gradient(145deg, rgba(15,23,42,0.58), rgba(2,6,23,0.72))'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(239,246,255,0.72))',
                        fallbackBorder: dark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.08)',
                        fallbackShadow: dark ? '0 20px 48px rgba(0,0,0,0.24)' : '0 18px 42px rgba(15,23,42,0.07)',
                      }),
                    }}
                  >
                    <div style={{ color: text, fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                      {skill.icon ? `${skill.icon} ` : ''}{skill.title}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.55 }}>
                      {skill.subtitle || skill.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => openLink(homepageAbout.primaryButtonLink || '/about')}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  border: 'none',
                  padding: '13px 22px',
                  borderRadius: 13,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  ...getButtonStyleOverrides(aboutStyles, {
                    dark,
                    fallbackBackground: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    fallbackColor: '#fff',
                    fallbackBorder: border,
                    fallbackShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  }),
                }}
              >
                {homepageAbout.primaryButtonText}
                {aboutStyles.buttons.showIcon !== false ? ' →' : ''}
              </button>
              {homepageAbout.secondaryButtonText ? (
                <button
                  onClick={() => openLink(homepageAbout.secondaryButtonLink || '/contact')}
                  style={{
                    background: dark ? 'rgba(15,23,42,0.46)' : 'rgba(255,255,255,0.78)',
                    color: text,
                    border: `1px solid ${border}`,
                    padding: '13px 20px',
                    borderRadius: 13,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    ...getButtonStyleOverrides(aboutStyles, {
                      dark,
                      fallbackBackground: dark ? 'rgba(15,23,42,0.46)' : 'rgba(255,255,255,0.78)',
                      fallbackColor: text,
                      fallbackBorder: border,
                      fallbackShadow: 'none',
                    }),
                  }}
                >
                  {homepageAbout.secondaryButtonText}
                </button>
              ) : null}
            </div>
          </div>

          <div
            style={{
              order: aboutImageFirst ? 1 : 2,
              position: 'relative',
              minHeight: isMobile ? 420 : aboutUsesCompactVisual ? 500 : 560,
              borderRadius: aboutUsesCompactVisual ? 28 : 34,
              overflow: 'hidden',
              border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)'}`,
              background: homepageAbout.image
                ? `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.84)), url(${homepageAbout.image}) center/cover no-repeat`
                : 'linear-gradient(145deg, #020617, #0f172a 52%, #0ea5e9)',
              boxShadow: dark
                ? '0 40px 120px rgba(0,0,0,0.52)'
                : '0 34px 90px rgba(15,23,42,0.16)',
              ...getCardSurfaceOverrides(aboutStyles, {
                dark,
                fallbackBackground: homepageAbout.image
                  ? `linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.84)), url(${homepageAbout.image}) center/cover no-repeat`
                  : 'linear-gradient(145deg, #020617, #0f172a 52%, #0ea5e9)',
                fallbackBorder: dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)',
                fallbackShadow: dark
                  ? '0 40px 120px rgba(0,0,0,0.52)'
                  : '0 34px 90px rgba(15,23,42,0.16)',
              }),
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 20% 18%, rgba(56,189,248,0.22), transparent 28%), linear-gradient(180deg, rgba(2,6,23,0) 22%, rgba(2,6,23,0.82) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 18,
                right: 18,
                bottom: 18,
                padding: isMobile ? 18 : 22,
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'linear-gradient(180deg, rgba(2,6,23,0.58), rgba(2,6,23,0.82))',
                backdropFilter: 'blur(18px)',
                color: '#f8fafc',
              }}
            >
              <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800, marginBottom: 14 }}>
                Creator Profile
              </div>
              {homepageAbout.showStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {homepageAbout.stats.slice(0, 3).map(item => (
                    <div key={item.id} style={{ padding: '12px 10px', borderRadius: 16, background: 'rgba(15,23,42,0.62)', border: '1px solid rgba(148,163,184,0.16)', textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900 }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      {aboutSystem.experience.showOnHomepage ? (
        <ExperienceSection
          config={aboutSystem.experience}
          dark={dark}
          isMobile={isMobile}
          items={homepageExperienceItems}
          mode="homepage"
        />
      ) : null}
    </>
  ) : null;

  const showreelSectionNode = showreelSection.enabled ? (
    <section
      style={{
        padding: getSectionPaddingOverride(
          showreelStyles.layout.padding,
          isMobile,
          getSectionPadding(showreelSection.spacing, isMobile, homepageBuilder.global.sectionSpacing)
        ),
      }}
    >
      <div
        style={{
          maxWidth: getSectionWidthOverride(
            showreelStyles.layout.width,
            getSectionMaxWidth(showreelSection.width, homepageBuilder.global.contentWidth)
          ),
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns:
            isMobile || showreelSection.layout === 'centered' || showreelSection.layout === 'stacked'
              ? '1fr'
              : showreelSection.layout === 'media-left'
                ? 'minmax(0, 0.9fr) minmax(0, 1.1fr)'
                : 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 28,
          alignItems: 'center',
          textAlign: showreelSection.alignment,
        }}
      >
        <div
          style={{
            order: showreelSection.layout === 'media-left' && !isMobile ? 2 : 1,
            textAlign:
              showreelSection.layout === 'centered' || isMobile
                ? 'center'
                : showreelSection.alignment,
          }}
        >
          {showreelSection.showLabel ? (
            <div style={{ fontSize: 11, color: resolveSectionThemeColor(showreelStyles.colors.accentLight, showreelStyles.colors.accentDark, dark, '#3b82f6'), fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
              {showreelSection.label}
            </div>
          ) : null}
          <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-1px', margin: 0, color: text }}>
            {showreelSection.title}
          </h2>
          {showreelSection.subtitle ? (
            <p style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 15, lineHeight: 1.8, margin: '14px auto 0', maxWidth: 680 }}>
              {showreelSection.subtitle}
            </p>
          ) : null}
          {showreelSection.showDescription && showreelSection.description ? (
            <p style={{ color: sub, fontSize: 14, lineHeight: 1.75, margin: '14px auto 0', maxWidth: 680 }}>
              {showreelSection.description}
            </p>
          ) : null}
          {showreelSection.showButton ? (
            <button
              onClick={() => openLink(showreelSection.buttonLink)}
              style={{
                marginTop: 22,
                background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
              ...getButtonStyleOverrides(showreelStyles, {
                dark,
                fallbackBackground: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                fallbackColor: '#fff',
                fallbackBorder: border,
                fallbackShadow: '0 18px 38px rgba(37,99,235,0.28)',
              }),
            }}
          >
              {showreelSection.buttonText}
              {showreelStyles.buttons.showIcon !== false ? ' →' : ''}
            </button>
          ) : null}
        </div>

        <div style={{ order: showreelSection.layout === 'media-left' && !isMobile ? 1 : 2 }}>
          {showreelSection.showInlinePreview ? (
            <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}`, boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.08)', ...getCardSurfaceOverrides(showreelStyles, { dark, fallbackBackground: card, fallbackBorder: border, fallbackShadow: dark ? '0 40px 100px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.08)' }) }}>
              <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                {showInlineShowreel ? (
                  <iframe
                    title="Homepage portfolio showreel video"
                    src={showreelEmbedUrl}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowInlineShowreel(true)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      border: 'none',
                      background: showreelSection.posterImage
                        ? `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.78)), url(${showreelSection.posterImage}) center/cover no-repeat`
                        : dark
                          ? 'linear-gradient(135deg, #0f172a, #1e1b4b)'
                          : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                    aria-label="Load homepage portfolio showreel video"
                  >
                    ▶ {showreelSection.buttonText || 'Watch Showreel'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                width: '100%',
                minHeight: 320,
                borderRadius: 22,
                border: `1px solid ${border}`,
                background: showreelSection.posterImage
                  ? `linear-gradient(180deg, rgba(2,6,23,0.28), rgba(2,6,23,0.8)), url(${showreelSection.posterImage}) center/cover no-repeat`
                  : dark
                    ? 'linear-gradient(135deg, #0f172a, #1e1b4b)'
                    : 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ▶ {showreelSection.buttonText || 'Watch Showreel'}
            </button>
          )}
        </div>
      </div>
    </section>
  ) : null;

  const statsSectionNode = statsSection.enabled && statsItems.length > 0 ? (
    <section
      style={{
        padding: getSectionPaddingOverride(
          statsStyles.layout.padding,
          isMobile,
          getSectionPadding(statsSection.spacing, isMobile, homepageBuilder.global.sectionSpacing)
        ),
      }}
    >
      <div style={{ maxWidth: getSectionWidthOverride(statsStyles.layout.width, getSectionMaxWidth(statsSection.width, homepageBuilder.global.contentWidth)), margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? `repeat(${statsSection.columnsMobile}, 1fr)` : `repeat(${statsSection.columnsDesktop}, 1fr)`,
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 20,
            overflow: 'hidden',
            ...getCardSurfaceOverrides(statsStyles, {
              dark,
              fallbackBackground: card,
              fallbackBorder: border,
              fallbackShadow: 'none',
            }),
          }}
        >
          {statsItems.map((item, index) => {
            const perRow = isMobile ? statsSection.columnsMobile : statsSection.columnsDesktop;
            const lastInRow = (index + 1) % perRow === 0;
            const hasRowBelow = index < statsItems.length - perRow;

            return (
              <div
                key={item.id}
                style={{
                  padding: isMobile ? '28px 16px' : '44px 24px',
                  textAlign: statsSection.alignment,
                  borderRight: !lastInRow ? `1px solid ${border}` : 'none',
                  borderBottom: hasRowBelow ? `1px solid ${border}` : 'none',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: isMobile ? '32px' : 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-2px', color: text, marginBottom: 6 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: sub }}>{item.label}</div>
                {item.description ? (
                  <div style={{ fontSize: 12, color: dark ? '#64748b' : '#64748b', marginTop: 8 }}>
                    {item.description}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  ) : null;

  const ctaSectionNode = ctaSection.enabled ? (
    <section
      ref={contactRef}
      style={{
        padding: getSectionPaddingOverride(
          ctaStyles.layout.padding,
          isMobile,
          getSectionPadding(ctaSection.spacing, isMobile, homepageBuilder.global.sectionSpacing)
        ),
      }}
    >
      <div style={{ maxWidth: ctaMaxWidth, margin: '0 auto' }}>
        <div
          style={{
            background: ctaSection.backgroundImage
              ? `linear-gradient(135deg, rgba(15,23,42,0.82), rgba(30,27,75,0.76)), url(${ctaSection.backgroundImage}) center/cover no-repeat`
              : dark
                ? 'linear-gradient(135deg, #0f172a, #1e1b4b)'
                : 'linear-gradient(135deg, #eff6ff, #eef2ff)',
            border: `1px solid ${dark ? '#1e3a8a' : '#bfdbfe'}`,
            borderRadius: 24,
            padding: isMobile ? '34px 22px' : '44px 34px',
            display: 'grid',
            gridTemplateColumns: ctaUsesSplitLayout ? 'minmax(0, 1.1fr) minmax(280px, 0.82fr)' : '1fr',
            gap: ctaUsesSplitLayout ? 24 : 0,
            alignItems: 'center',
            ...getCardSurfaceOverrides(ctaStyles, {
              dark,
              fallbackBackground: ctaSection.backgroundImage
                ? `linear-gradient(135deg, rgba(15,23,42,0.82), rgba(30,27,75,0.76)), url(${ctaSection.backgroundImage}) center/cover no-repeat`
                : dark
                  ? 'linear-gradient(135deg, #0f172a, #1e1b4b)'
                  : 'linear-gradient(135deg, #eff6ff, #eef2ff)',
              fallbackBorder: dark ? '#1e3a8a' : '#bfdbfe',
              fallbackShadow: 'none',
            }),
          }}
        >
          <div
            style={{
              order: ctaTextOrder,
              textAlign: ctaSection.alignment,
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 20, color: resolveSectionThemeColor(ctaStyles.colors.accentLight, ctaStyles.colors.accentDark, dark, text) }}>{ctaSection.icon}</div>
            <h2 style={{ fontSize: isMobile ? '24px' : 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.5px', color: text }}>
              {ctaSection.title}
            </h2>
            <p style={{ color: sub, fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
              {ctaSection.subtitle}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: getButtonAlignmentOverride(ctaStyles.layout.buttonAlign, ctaSection.alignment === 'left' ? 'flex-start' : ctaSection.alignment === 'right' ? 'flex-end' : 'center'), flexWrap: 'wrap' }}>
              <button
                onClick={() => openLink(ctaSection.primaryButtonLink)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', ...getButtonStyleOverrides(ctaStyles, { dark, fallbackBackground: '#3b82f6', fallbackColor: '#fff', fallbackBorder: border, fallbackShadow: 'none' }) }}
              >
                {ctaSection.primaryButtonText}{ctaStyles.buttons.showIcon !== false ? ' →' : ''}
              </button>
              {ctaSection.showSecondaryButton ? (
                <button
                  onClick={() => openLink(ctaSection.secondaryButtonLink)}
                  style={{ background: dark ? '#111827' : '#25d366', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer', ...getButtonStyleOverrides(ctaStyles, { dark, fallbackBackground: dark ? '#111827' : '#25d366', fallbackColor: '#fff', fallbackBorder: border, fallbackShadow: 'none' }) }}
                >
                  {ctaSection.secondaryButtonText}
                </button>
              ) : null}
            </div>
          </div>
          {ctaUsesSplitLayout ? (
            <div
              style={{
                order: ctaVisualOrder,
                minHeight: 240,
                borderRadius: 22,
                overflow: 'hidden',
                border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(255,255,255,0.24)'}`,
                background: ctaSection.backgroundImage
                  ? `linear-gradient(180deg, rgba(2,6,23,0.16), rgba(2,6,23,0.74)), url(${ctaSection.backgroundImage}) center/cover no-repeat`
                  : dark
                    ? 'radial-gradient(circle at 24% 20%, rgba(59,130,246,0.22), transparent 32%), linear-gradient(145deg, rgba(15,23,42,0.8), rgba(2,6,23,0.92))'
                    : 'radial-gradient(circle at 24% 20%, rgba(59,130,246,0.18), transparent 32%), linear-gradient(145deg, rgba(255,255,255,0.92), rgba(224,242,254,0.92))',
                boxShadow: dark
                  ? '0 28px 70px rgba(2,6,23,0.34)'
                  : '0 24px 56px rgba(15,23,42,0.12)',
                display: 'grid',
                placeItems: 'end start',
                padding: 22,
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 18,
                  background: dark ? 'rgba(2,6,23,0.54)' : 'rgba(255,255,255,0.78)',
                  border: `1px solid ${dark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.08)'}`,
                  backdropFilter: 'blur(14px)',
                  maxWidth: 280,
                }}
              >
                <div style={{ fontSize: 11, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800, marginBottom: 10 }}>
                  Quick Response
                </div>
                <div style={{ color: text, fontWeight: 700, lineHeight: 1.5 }}>
                  Creative brief, portfolio fit, timeline and delivery plan in one clean workflow.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  ) : null;

  const footerSectionNode = homepageBuilder.footer.enabled ? (
    <GlobalFooter config={homepageBuilder.footer} isMobile={isMobile} />
  ) : null;

  const sections = [
    heroSection ? { key: 'hero', order: hero.order, node: heroSection } : null,
    portfolioSection
      ? { key: 'portfolio', order: homepagePortfolioSettings.order, node: portfolioSection }
      : null,
    aboutSection ? { key: 'about', order: homepageAbout.order, node: aboutSection } : null,
    showreelSectionNode ? { key: 'showreel', order: showreelSection.order, node: showreelSectionNode } : null,
    statsSectionNode ? { key: 'stats', order: statsSection.order, node: statsSectionNode } : null,
    ctaSectionNode ? { key: 'cta', order: ctaSection.order, node: ctaSectionNode } : null,
    footerSectionNode ? { key: 'footer', order: homepageBuilder.footer.order, node: footerSectionNode } : null,
  ]
    .filter(Boolean)
    .sort((leftSection, rightSection) => (leftSection?.order || 0) - (rightSection?.order || 0)) as Array<{
    key: string;
    order: number;
    node: ReactNode;
  }>;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        background: bg,
        color: text,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: 'hidden',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
        animation: 'homepage-content-fade-in 220ms ease-out both',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: 'clip',
        }}
      >
        {sections.map(section => (
          <div key={section.key} style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            {section.node}
          </div>
        ))}
      </div>

      {showModal ? (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: dark ? '#0d0d0d' : '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <span style={{ fontWeight: 700, color: text }}>🎬 Showreel</span>
              <button onClick={() => setShowModal(false)} style={{ background: dark ? '#111' : '#f5f5f5', border: `1px solid ${border}`, color: sub, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe
                title="Homepage showreel modal video"
                src={withAutoplay(showreelEmbedUrl)}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
