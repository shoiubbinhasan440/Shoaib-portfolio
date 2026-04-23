import { getFirstSetting, getHeroImages, parseStyledSetting, type SettingMap } from './hero-settings';

export const HOMEPAGE_BUILDER_SETTING_KEY = 'homepage_builder_config';

export type HomepageWidthPreset = 'narrow' | 'normal' | 'wide' | 'full';
export type HomepageSpacingPreset = 'compact' | 'balanced' | 'spacious';
export type HomepageAlignment = 'left' | 'center' | 'right';
export type HomepageHeroLayout = 'split' | 'centered' | 'stacked';
export type HomepageMediaLayout = 'centered' | 'split' | 'stacked' | 'media-right' | 'media-left';
export type HomepageHeroHeightPreset = 'screen' | 'large' | 'medium';
export type HomepageOverlayStrength = 'soft' | 'medium' | 'strong';
export type HomepageMobileContentPosition = 'bottom' | 'lower' | 'center';
export type HomepageFloatingCardPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'hidden';

export type HomepageRuntimeStats = {
  projectCount?: number;
  clientCount?: number;
  yearsCount?: number;
};

export type HomepageStatItem = {
  id: string;
  icon?: string;
  value: string;
  label: string;
  description?: string;
  enabled: boolean;
  order: number;
};

export type HomepageLinkItem = {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  order: number;
};

export type HomepageContactItem = {
  id: string;
  icon?: string;
  label: string;
  value: string;
  enabled: boolean;
  order: number;
};

export type HomepageHeroSection = {
  enabled: boolean;
  order: number;
  layout: HomepageHeroLayout;
  alignment: HomepageAlignment;
  width: HomepageWidthPreset;
  spacing: HomepageSpacingPreset;
  contentMaxWidth: number;
  heightPreset: HomepageHeroHeightPreset;
  mobileContentPosition: HomepageMobileContentPosition;
  overlayStrength: HomepageOverlayStrength;
  showBottomOverlay: boolean;
  showBadge: boolean;
  showSubtitle: boolean;
  showStats: boolean;
  showPrimaryButton: boolean;
  showSecondaryButton: boolean;
  showShowreelButton: boolean;
  showFloatingCard: boolean;
  badge: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  showreelButtonText: string;
  desktopImage: string;
  mobileImage: string;
  floatingCardEyebrow: string;
  floatingCardText: string;
  floatingCardPosition: HomepageFloatingCardPosition;
  stats: HomepageStatItem[];
};

export type HomepageShowreelSection = {
  enabled: boolean;
  order: number;
  layout: HomepageMediaLayout;
  alignment: HomepageAlignment;
  width: HomepageWidthPreset;
  spacing: HomepageSpacingPreset;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  posterImage: string;
  showInlinePreview: boolean;
  showLabel: boolean;
  showDescription: boolean;
  showButton: boolean;
  buttonText: string;
  buttonLink: string;
};

export type HomepageStatsSection = {
  enabled: boolean;
  order: number;
  alignment: HomepageAlignment;
  width: HomepageWidthPreset;
  spacing: HomepageSpacingPreset;
  columnsDesktop: number;
  columnsMobile: number;
  items: HomepageStatItem[];
};

export type HomepageCtaSection = {
  enabled: boolean;
  order: number;
  layout: HomepageMediaLayout;
  alignment: HomepageAlignment;
  width: HomepageWidthPreset;
  spacing: HomepageSpacingPreset;
  icon: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  showSecondaryButton: boolean;
  backgroundImage: string;
};

export type HomepageFooterSection = {
  enabled: boolean;
  order: number;
  layout: 'grid' | 'stacked';
  stylePreset: 'cinematic' | 'minimal' | 'light';
  alignment: HomepageAlignment;
  width: HomepageWidthPreset;
  spacing: HomepageSpacingPreset;
  brandText: string;
  brandAccent: string;
  description: string;
  showDescription: boolean;
  showCta: boolean;
  ctaText: string;
  ctaLink: string;
  ctaCaption: string;
  showQuickLinks: boolean;
  showContact: boolean;
  showSocial: boolean;
  quickLinksTitle: string;
  contactTitle: string;
  socialTitle: string;
  quickLinks: HomepageLinkItem[];
  socialLinks: HomepageLinkItem[];
  contactItems: HomepageContactItem[];
  copyrightText: string;
  noteText: string;
};

export type HomepageBuilderGlobal = {
  contentWidth: HomepageWidthPreset;
  sectionSpacing: HomepageSpacingPreset;
  themeSafeMode: boolean;
};

export type HomepageBuilderConfig = {
  global: HomepageBuilderGlobal;
  hero: HomepageHeroSection;
  showreel: HomepageShowreelSection;
  stats: HomepageStatsSection;
  cta: HomepageCtaSection;
  footer: HomepageFooterSection;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function num(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: unknown, fallback: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num(value, fallback)));
}

function widthPreset(value: unknown, fallback: HomepageWidthPreset): HomepageWidthPreset {
  return value === 'narrow' || value === 'normal' || value === 'wide' || value === 'full'
    ? value
    : fallback;
}

function spacingPreset(value: unknown, fallback: HomepageSpacingPreset): HomepageSpacingPreset {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function alignment(value: unknown, fallback: HomepageAlignment): HomepageAlignment {
  return value === 'left' || value === 'center' || value === 'right' ? value : fallback;
}

function heroLayout(value: unknown, fallback: HomepageHeroLayout): HomepageHeroLayout {
  return value === 'split' || value === 'centered' || value === 'stacked' ? value : fallback;
}

function mediaLayout(value: unknown, fallback: HomepageMediaLayout): HomepageMediaLayout {
  return value === 'centered' ||
    value === 'split' ||
    value === 'stacked' ||
    value === 'media-right' ||
    value === 'media-left'
    ? value
    : fallback;
}

function heroHeight(value: unknown, fallback: HomepageHeroHeightPreset): HomepageHeroHeightPreset {
  return value === 'screen' || value === 'large' || value === 'medium' ? value : fallback;
}

function overlayStrength(value: unknown, fallback: HomepageOverlayStrength): HomepageOverlayStrength {
  return value === 'soft' || value === 'medium' || value === 'strong' ? value : fallback;
}

function mobileContentPosition(
  value: unknown,
  fallback: HomepageMobileContentPosition
): HomepageMobileContentPosition {
  return value === 'bottom' || value === 'lower' || value === 'center' ? value : fallback;
}

function floatingCardPosition(
  value: unknown,
  fallback: HomepageFloatingCardPosition
): HomepageFloatingCardPosition {
  return value === 'bottom-right' ||
    value === 'bottom-left' ||
    value === 'top-right' ||
    value === 'top-left' ||
    value === 'hidden'
    ? value
    : fallback;
}

function footerLayout(value: unknown, fallback: HomepageFooterSection['layout']): HomepageFooterSection['layout'] {
  return value === 'grid' || value === 'stacked' ? value : fallback;
}

function footerStylePreset(
  value: unknown,
  fallback: HomepageFooterSection['stylePreset']
): HomepageFooterSection['stylePreset'] {
  return value === 'cinematic' || value === 'minimal' || value === 'light'
    ? value
    : fallback;
}

function sanitizeStats(value: unknown, fallback: HomepageStatItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `stat-${index + 1}`),
      icon: text(item.icon, fallback[index]?.icon || ''),
      value: text(item.value, fallback[index]?.value || ''),
      label: text(item.label, fallback[index]?.label || ''),
      description: text(item.description, fallback[index]?.description || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: num(item.order, fallback[index]?.order ?? index + 1),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeLinks(value: unknown, fallback: HomepageLinkItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `link-${index + 1}`),
      label: text(item.label, fallback[index]?.label || ''),
      url: text(item.url, fallback[index]?.url || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: num(item.order, fallback[index]?.order ?? index + 1),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeContacts(value: unknown, fallback: HomepageContactItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `contact-${index + 1}`),
      icon: text(item.icon, fallback[index]?.icon || ''),
      label: text(item.label, fallback[index]?.label || ''),
      value: text(item.value, fallback[index]?.value || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: num(item.order, fallback[index]?.order ?? index + 1),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

export function createDefaultHomepageBuilderConfig(
  runtimeStats: HomepageRuntimeStats = {},
  map?: SettingMap
): HomepageBuilderConfig {
  const heroBadge = parseStyledSetting(map?.hero_badge, 'Available for work').value;
  const heroTitle = parseStyledSetting(
    map?.hero_title,
    'Visual Storyteller & Creative Director'
  ).value;
  const heroSubtitle = parseStyledSetting(
    map?.hero_subtitle,
    'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।'
  ).value;
  const heroPrimary = parseStyledSetting(map?.cta_button, 'Portfolio দেখুন').value;
  const showreelEyebrow = parseStyledSetting(map?.showreel_eyebrow, 'Featured').value;
  const showreelTitle = parseStyledSetting(map?.showreel_title, 'আমার Showreel').value;
  const stat1Label = parseStyledSetting(map?.stat1_label, 'Projects').value;
  const stat2Label = parseStyledSetting(map?.stat2_label, 'Clients').value;
  const stat3Label = parseStyledSetting(map?.stat3_label, 'Years Crafting').value;
  const contactEmail = getFirstSetting(map || {}, 'contact_email') || 'hello@minhajulhoque.com';
  const contactPhone = getFirstSetting(map || {}, 'contact_phone') || '+880 1XXX-XXXXXX';
  const footerCopy = parseStyledSetting(
    map?.footer_copy,
    '© 2025 Md. Minhajul Hoque. All rights reserved.'
  ).value;
  const heroImages = map ? getHeroImages(map) : { desktop: '', mobile: '' };
  const projectValue = `${runtimeStats.projectCount ?? 120}+`;
  const clientValue = `${runtimeStats.clientCount ?? 50}+`;
  const yearsValue = `${runtimeStats.yearsCount ?? 3}+`;

  return {
    global: {
      contentWidth: 'wide',
      sectionSpacing: 'balanced',
      themeSafeMode: true,
    },
    hero: {
      enabled: true,
      order: 10,
      layout: 'split',
      alignment: 'left',
      width: 'full',
      spacing: 'balanced',
      contentMaxWidth: 540,
      heightPreset: 'screen',
      mobileContentPosition: 'bottom',
      overlayStrength: 'strong',
      showBottomOverlay: true,
      showBadge: true,
      showSubtitle: true,
      showStats: true,
      showPrimaryButton: true,
      showSecondaryButton: true,
      showShowreelButton: true,
      showFloatingCard: true,
      badge: heroBadge,
      title: heroTitle,
      subtitle: heroSubtitle,
      primaryButtonText: heroPrimary,
      primaryButtonLink: '/portfolio',
      secondaryButtonText: 'Hire Me',
      secondaryButtonLink: '#contact',
      showreelButtonText: 'Showreel',
      desktopImage: heroImages.desktop,
      mobileImage: heroImages.mobile,
      floatingCardEyebrow: 'Cinematic Editing',
      floatingCardText: 'Strong visuals, layered motion, and premium storytelling in the first frame.',
      floatingCardPosition: 'bottom-right',
      stats: [
        { id: 'hero-projects', icon: '🎬', value: projectValue, label: stat1Label, description: '', enabled: true, order: 1 },
        { id: 'hero-clients', icon: '🤝', value: clientValue, label: stat2Label, description: '', enabled: true, order: 2 },
        { id: 'hero-years', icon: '⚡', value: yearsValue, label: stat3Label, description: '', enabled: true, order: 3 },
      ],
    },
    showreel: {
      enabled: true,
      order: 40,
      layout: 'centered',
      alignment: 'center',
      width: 'normal',
      spacing: 'balanced',
      label: showreelEyebrow,
      title: showreelTitle,
      subtitle: '',
      description: '',
      videoUrl: getFirstSetting(map || {}, 'showreel_url') || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      posterImage: '',
      showInlinePreview: true,
      showLabel: true,
      showDescription: false,
      showButton: false,
      buttonText: 'Watch Showreel',
      buttonLink: '/portfolio',
    },
    stats: {
      enabled: true,
      order: 50,
      alignment: 'center',
      width: 'normal',
      spacing: 'balanced',
      columnsDesktop: 4,
      columnsMobile: 2,
      items: [
        { id: 'stats-projects', icon: '🎬', value: projectValue, label: stat1Label, description: '', enabled: true, order: 1 },
        { id: 'stats-clients', icon: '🤝', value: clientValue, label: stat2Label, description: '', enabled: true, order: 2 },
        { id: 'stats-years', icon: '⚡', value: yearsValue, label: stat3Label, description: '', enabled: true, order: 3 },
        { id: 'stats-satisfaction', icon: '⭐', value: '100%', label: 'ক্লায়েন্ট সন্তুষ্টি', description: '', enabled: true, order: 4 },
      ],
    },
    cta: {
      enabled: true,
      order: 60,
      layout: 'centered',
      alignment: 'center',
      width: 'narrow',
      spacing: 'balanced',
      icon: '🤝',
      title: 'একসাথে কাজ করি?',
      subtitle: 'Video Editing, Graphics Design বা যেকোনো Creative প্রজেক্টের জন্য যোগাযোগ করুন।',
      primaryButtonText: 'যোগাযোগ করুন',
      primaryButtonLink: '/contact',
      secondaryButtonText: '📱 WhatsApp',
      secondaryButtonLink: 'https://wa.me/8801885080118',
      showSecondaryButton: true,
      backgroundImage: '',
    },
    footer: {
      enabled: true,
      order: 70,
      layout: 'grid',
      stylePreset: 'cinematic',
      alignment: 'left',
      width: 'full',
      spacing: 'balanced',
      brandText: 'Minhajul',
      brandAccent: '.',
      description: 'Video Editor & Graphic Designer',
      showDescription: true,
      showCta: true,
      ctaText: 'Start a Project',
      ctaLink: '/contact',
      ctaCaption: 'Ready for edits, graphics, and premium content systems.',
      showQuickLinks: true,
      showContact: true,
      showSocial: true,
      quickLinksTitle: 'Quick Links',
      contactTitle: 'যোগাযোগ',
      socialTitle: 'Social',
      quickLinks: [
        { id: 'footer-link-1', label: 'Portfolio', url: '/portfolio', enabled: true, order: 1 },
        { id: 'footer-link-2', label: 'Tutorial', url: '/tutorial', enabled: true, order: 2 },
        { id: 'footer-link-3', label: 'About', url: '/about', enabled: true, order: 3 },
        { id: 'footer-link-4', label: 'Contact', url: '/contact', enabled: true, order: 4 },
      ],
      socialLinks: [
        { id: 'footer-social-1', label: '📘 Facebook', url: 'https://facebook.com', enabled: true, order: 1 },
        { id: 'footer-social-2', label: '▶️ YouTube', url: 'https://youtube.com', enabled: true, order: 2 },
        { id: 'footer-social-3', label: '📸 Instagram', url: 'https://instagram.com', enabled: true, order: 3 },
      ],
      contactItems: [
        { id: 'footer-contact-1', icon: '📧', label: 'Email', value: contactEmail, enabled: true, order: 1 },
        { id: 'footer-contact-2', icon: '📱', label: 'Phone', value: contactPhone, enabled: true, order: 2 },
        { id: 'footer-contact-3', icon: '📍', label: 'Location', value: 'Mirpur 10, Dhaka', enabled: true, order: 3 },
      ],
      copyrightText: footerCopy,
      noteText: 'Made with ❤️ in Bangladesh',
    },
  };
}

export const DEFAULT_HOMEPAGE_BUILDER_CONFIG = createDefaultHomepageBuilderConfig();

function sanitizeHero(value: unknown, fallback: HomepageHeroSection): HomepageHeroSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: heroLayout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    contentMaxWidth: clamp(value.contentMaxWidth, fallback.contentMaxWidth, 320, 760),
    heightPreset: heroHeight(value.heightPreset, fallback.heightPreset),
    mobileContentPosition: mobileContentPosition(value.mobileContentPosition, fallback.mobileContentPosition),
    overlayStrength: overlayStrength(value.overlayStrength, fallback.overlayStrength),
    showBottomOverlay: bool(value.showBottomOverlay, fallback.showBottomOverlay),
    showBadge: bool(value.showBadge, fallback.showBadge),
    showSubtitle: bool(value.showSubtitle, fallback.showSubtitle),
    showStats: bool(value.showStats, fallback.showStats),
    showPrimaryButton: bool(value.showPrimaryButton, fallback.showPrimaryButton),
    showSecondaryButton: bool(value.showSecondaryButton, fallback.showSecondaryButton),
    showShowreelButton: bool(value.showShowreelButton, fallback.showShowreelButton),
    showFloatingCard: bool(value.showFloatingCard, fallback.showFloatingCard),
    badge: text(value.badge, fallback.badge),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink),
    showreelButtonText: text(value.showreelButtonText, fallback.showreelButtonText),
    desktopImage: text(value.desktopImage, fallback.desktopImage),
    mobileImage: text(value.mobileImage, fallback.mobileImage),
    floatingCardEyebrow: text(value.floatingCardEyebrow, fallback.floatingCardEyebrow),
    floatingCardText: text(value.floatingCardText, fallback.floatingCardText),
    floatingCardPosition: floatingCardPosition(value.floatingCardPosition, fallback.floatingCardPosition),
    stats: sanitizeStats(value.stats, fallback.stats),
  };
}

function sanitizeShowreel(value: unknown, fallback: HomepageShowreelSection): HomepageShowreelSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: mediaLayout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    description: text(value.description, fallback.description),
    videoUrl: text(value.videoUrl, fallback.videoUrl),
    posterImage: text(value.posterImage, fallback.posterImage),
    showInlinePreview: bool(value.showInlinePreview, fallback.showInlinePreview),
    showLabel: bool(value.showLabel, fallback.showLabel),
    showDescription: bool(value.showDescription, fallback.showDescription),
    showButton: bool(value.showButton, fallback.showButton),
    buttonText: text(value.buttonText, fallback.buttonText),
    buttonLink: text(value.buttonLink, fallback.buttonLink),
  };
}

function sanitizeStatsSection(value: unknown, fallback: HomepageStatsSection): HomepageStatsSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    columnsDesktop: clamp(value.columnsDesktop, fallback.columnsDesktop, 1, 4),
    columnsMobile: clamp(value.columnsMobile, fallback.columnsMobile, 1, 2),
    items: sanitizeStats(value.items, fallback.items),
  };
}

function sanitizeCta(value: unknown, fallback: HomepageCtaSection): HomepageCtaSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: mediaLayout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    icon: text(value.icon, fallback.icon),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink),
    showSecondaryButton: bool(value.showSecondaryButton, fallback.showSecondaryButton),
    backgroundImage: text(value.backgroundImage, fallback.backgroundImage),
  };
}

function sanitizeFooter(value: unknown, fallback: HomepageFooterSection): HomepageFooterSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: footerLayout(value.layout, fallback.layout),
    stylePreset: footerStylePreset(value.stylePreset, fallback.stylePreset),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    brandText: text(value.brandText, fallback.brandText),
    brandAccent: text(value.brandAccent, fallback.brandAccent),
    description: text(value.description, fallback.description),
    showDescription: bool(value.showDescription, fallback.showDescription),
    showCta: bool(value.showCta, fallback.showCta),
    ctaText: text(value.ctaText, fallback.ctaText),
    ctaLink: text(value.ctaLink, fallback.ctaLink),
    ctaCaption: text(value.ctaCaption, fallback.ctaCaption),
    showQuickLinks: bool(value.showQuickLinks, fallback.showQuickLinks),
    showContact: bool(value.showContact, fallback.showContact),
    showSocial: bool(value.showSocial, fallback.showSocial),
    quickLinksTitle: text(value.quickLinksTitle, fallback.quickLinksTitle),
    contactTitle: text(value.contactTitle, fallback.contactTitle),
    socialTitle: text(value.socialTitle, fallback.socialTitle),
    quickLinks: sanitizeLinks(value.quickLinks, fallback.quickLinks),
    socialLinks: sanitizeLinks(value.socialLinks, fallback.socialLinks),
    contactItems: sanitizeContacts(value.contactItems, fallback.contactItems),
    copyrightText: text(value.copyrightText, fallback.copyrightText),
    noteText: text(value.noteText, fallback.noteText),
  };
}

export function getHomepageBuilderConfig(
  map: SettingMap,
  runtimeStats: HomepageRuntimeStats = {}
): HomepageBuilderConfig {
  const fallback = createDefaultHomepageBuilderConfig(runtimeStats, map);
  const rawValue = map[HOMEPAGE_BUILDER_SETTING_KEY];

  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) {
      return fallback;
    }

    return {
      global: {
        contentWidth: widthPreset(parsed.global && isRecord(parsed.global) ? parsed.global.contentWidth : undefined, fallback.global.contentWidth),
        sectionSpacing: spacingPreset(parsed.global && isRecord(parsed.global) ? parsed.global.sectionSpacing : undefined, fallback.global.sectionSpacing),
        themeSafeMode: bool(parsed.global && isRecord(parsed.global) ? parsed.global.themeSafeMode : undefined, fallback.global.themeSafeMode),
      },
      hero: sanitizeHero(parsed.hero, fallback.hero),
      showreel: sanitizeShowreel(parsed.showreel, fallback.showreel),
      stats: sanitizeStatsSection(parsed.stats, fallback.stats),
      cta: sanitizeCta(parsed.cta, fallback.cta),
      footer: sanitizeFooter(parsed.footer, fallback.footer),
    };
  } catch {
    return fallback;
  }
}

export function serializeHomepageBuilderConfig(config: HomepageBuilderConfig) {
  return JSON.stringify(config);
}
