import {
  getFirstSetting,
  parseStyledSetting,
  type SettingMap,
} from '@/lib/hero-settings';
import {
  createDefaultBuilderSectionStyles,
  sanitizeBuilderSectionStyles,
  type BuilderSectionStyles,
} from '@/lib/page-builder-styles';
import type {
  PortfolioCategory,
  PortfolioLayoutMode,
  PortfolioPreviewItem,
} from '@/lib/portfolio-content';

export const PORTFOLIO_PAGE_BUILDER_SETTING_KEY = 'portfolio_page_builder_config';

export type PortfolioPageWidth = 'normal' | 'wide' | 'full';
export type PortfolioPageSpacing = 'compact' | 'balanced' | 'spacious';
export type PortfolioPageAlignment = 'left' | 'center';
export type PortfolioPageHeroLayout = 'centered' | 'split' | 'stacked';
export type PortfolioPageLayoutType = 'editorial' | 'cinematic' | 'compact';
export type PortfolioPageCardStyle = 'cinematic' | 'glass' | 'editorial' | 'light';
export type PortfolioPageDensity = 'compact' | 'balanced' | 'spacious';
export type PortfolioPageGap = 'small' | 'medium' | 'large';

export type PortfolioPageHeroConfig = {
  enabled: boolean;
  order: number;
  badge: string;
  title: string;
  subtitle: string;
  introText: string;
  showIntro: boolean;
  showBannerImage: boolean;
  bannerImage: string;
  showButton: boolean;
  buttonText: string;
  buttonLink: string;
  alignment: PortfolioPageAlignment;
  layout: PortfolioPageHeroLayout;
  width: PortfolioPageWidth;
  spacing: PortfolioPageSpacing;
  styles: BuilderSectionStyles;
};

export type PortfolioPageShowcaseConfig = {
  enabled: boolean;
  order: number;
  showTabs: boolean;
  showCategoryFilters: boolean;
  alignment: PortfolioPageAlignment;
  width: PortfolioPageWidth;
  spacing: PortfolioPageSpacing;
  layoutType: PortfolioPageLayoutType;
  layoutMode: PortfolioLayoutMode;
  cardStyle: PortfolioPageCardStyle;
  density: PortfolioPageDensity;
  gap: PortfolioPageGap;
  desktopColumns: number;
  tabletColumns: number;
  mobileColumns: number;
  styles: BuilderSectionStyles;
};

export type PortfolioPageCtaConfig = {
  enabled: boolean;
  order: number;
  label: string;
  title: string;
  description: string;
  showPrimaryButton: boolean;
  primaryButtonText: string;
  primaryButtonLink: string;
  showSecondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  alignment: PortfolioPageAlignment;
  width: PortfolioPageWidth;
  spacing: PortfolioPageSpacing;
  styles: BuilderSectionStyles;
};

export type PortfolioPageCategoryConfig = {
  enabled?: boolean;
  order?: number;
  label?: string;
};

export type PortfolioPageItemConfig = {
  previewEnabled?: boolean;
};

export type PortfolioPageBuilderConfig = {
  pageEnabled: boolean;
  hero: PortfolioPageHeroConfig;
  showcase: PortfolioPageShowcaseConfig;
  cta: PortfolioPageCtaConfig;
  categoryConfig: Record<string, PortfolioPageCategoryConfig>;
  itemConfig: Record<string, PortfolioPageItemConfig>;
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

function number(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function width(value: unknown, fallback: PortfolioPageWidth): PortfolioPageWidth {
  return value === 'normal' || value === 'wide' || value === 'full' ? value : fallback;
}

function spacing(value: unknown, fallback: PortfolioPageSpacing): PortfolioPageSpacing {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function alignment(
  value: unknown,
  fallback: PortfolioPageAlignment
): PortfolioPageAlignment {
  return value === 'left' || value === 'center' ? value : fallback;
}

function heroLayout(
  value: unknown,
  fallback: PortfolioPageHeroLayout
): PortfolioPageHeroLayout {
  return value === 'centered' || value === 'split' || value === 'stacked'
    ? value
    : fallback;
}

function layoutType(
  value: unknown,
  fallback: PortfolioPageLayoutType
): PortfolioPageLayoutType {
  return value === 'editorial' || value === 'cinematic' || value === 'compact'
    ? value
    : fallback;
}

function cardStyle(
  value: unknown,
  fallback: PortfolioPageCardStyle
): PortfolioPageCardStyle {
  return value === 'cinematic' ||
    value === 'glass' ||
    value === 'editorial' ||
    value === 'light'
    ? value
    : fallback;
}

function density(
  value: unknown,
  fallback: PortfolioPageDensity
): PortfolioPageDensity {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function gap(value: unknown, fallback: PortfolioPageGap): PortfolioPageGap {
  return value === 'small' || value === 'medium' || value === 'large' ? value : fallback;
}

export function getPortfolioPageCategoryKey(categoryType: string, categorySlug: string) {
  return `${categoryType}:${categorySlug}`;
}

export function getPortfolioPageItemKey(sourceType: string, itemId: string | number) {
  return `${sourceType}:${itemId}`;
}

export function createDefaultPortfolioPageBuilderConfig(map?: SettingMap): PortfolioPageBuilderConfig {
  const title = parseStyledSetting(map?.portfolio_page_title, 'আমার কাজের সংগ্রহ').value;
  const subtitle = parseStyledSetting(
    map?.portfolio_page_subtitle,
    'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের নির্বাচিত কাজগুলো এক জায়গায় দেখুন।'
  ).value;

  return {
    pageEnabled: true,
    hero: {
      enabled: true,
      order: 10,
      badge: 'Portfolio Showcase',
      title,
      subtitle,
      introText:
        'ভিডিও এডিটিং, গ্রাফিক্স ডিজাইন এবং cinematic visual direction-এর নির্বাচিত কাজগুলো type, category এবং preview support সহ সাজানো আছে।',
      showIntro: true,
      showBannerImage: false,
      bannerImage: '',
      showButton: true,
      buttonText: 'Contact Me',
      buttonLink: '/contact',
      alignment: 'center',
      layout: 'centered',
      width: 'wide',
      spacing: 'balanced',
      styles: createDefaultBuilderSectionStyles(),
    },
    showcase: {
      enabled: true,
      order: 20,
      showTabs: true,
      showCategoryFilters: true,
      alignment: 'center',
      width: 'wide',
      spacing: 'balanced',
      layoutType: 'cinematic',
      layoutMode: 'grid',
      cardStyle: 'cinematic',
      density: 'balanced',
      gap: 'medium',
      desktopColumns: 3,
      tabletColumns: 2,
      mobileColumns: 1,
      styles: createDefaultBuilderSectionStyles(),
    },
    cta: {
      enabled: true,
      order: 30,
      label: 'Need a premium edit system?',
      title: 'আপনার next project-এর জন্য ready to collaborate.',
      description:
        'ভিডিও, গ্রাফিক্স, বা complete content system লাগলে portfolio দেখে brief পাঠান। আমি concept থেকে polished delivery পর্যন্ত clean creative direction রাখি।',
      showPrimaryButton: true,
      primaryButtonText: 'Start a Project',
      primaryButtonLink: '/contact',
      showSecondaryButton: true,
      secondaryButtonText: 'Back to Home',
      secondaryButtonLink: '/',
      alignment: 'center',
      width: 'normal',
      spacing: 'balanced',
      styles: createDefaultBuilderSectionStyles(),
    },
    categoryConfig: {},
    itemConfig: {},
  };
}

export function getPortfolioPageCategoryConfig(
  category:
    | Pick<PortfolioCategory, 'slug' | 'type' | 'name' | 'order_num'>
    | Pick<PortfolioPreviewItem, 'categorySlug' | 'categoryType' | 'categoryName' | 'order_num'>,
  configMap: Record<string, PortfolioPageCategoryConfig>
) {
  const categorySlug = 'slug' in category ? category.slug : category.categorySlug;
  const categoryType = 'type' in category ? category.type : category.categoryType;
  const categoryName = 'name' in category ? category.name : category.categoryName;
  const orderNum = typeof category.order_num === 'number' ? category.order_num : 9999;
  const key = getPortfolioPageCategoryKey(categoryType || 'both', categorySlug || categoryName);
  const config = (key ? configMap[key] : undefined) || {};

  return {
    enabled: config.enabled ?? true,
    order: config.order ?? orderNum,
    label: config.label || categoryName,
  };
}

export function getPortfolioPageItemConfig(
  item: Pick<PortfolioPreviewItem, 'sourceType' | 'id'>,
  configMap: Record<string, PortfolioPageItemConfig>
) {
  const config = configMap[getPortfolioPageItemKey(item.sourceType, item.id)] || {};

  return {
    previewEnabled: config.previewEnabled ?? true,
  };
}

function sanitizeHero(
  value: unknown,
  fallback: PortfolioPageHeroConfig
): PortfolioPageHeroConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.min(100, Math.max(1, number(value.order, fallback.order))),
    badge: text(value.badge, fallback.badge),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    introText: text(value.introText, fallback.introText),
    showIntro: bool(value.showIntro, fallback.showIntro),
    showBannerImage: bool(value.showBannerImage, fallback.showBannerImage),
    bannerImage: text(value.bannerImage, fallback.bannerImage),
    showButton: bool(value.showButton, fallback.showButton),
    buttonText: text(value.buttonText, fallback.buttonText),
    buttonLink: text(value.buttonLink, fallback.buttonLink),
    alignment: alignment(value.alignment, fallback.alignment),
    layout: heroLayout(value.layout, fallback.layout),
    width: width(value.width, fallback.width),
    spacing: spacing(value.spacing, fallback.spacing),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeShowcase(
  value: unknown,
  fallback: PortfolioPageShowcaseConfig
): PortfolioPageShowcaseConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.min(100, Math.max(1, number(value.order, fallback.order))),
    showTabs: bool(value.showTabs, fallback.showTabs),
    showCategoryFilters: bool(value.showCategoryFilters, fallback.showCategoryFilters),
    alignment: alignment(value.alignment, fallback.alignment),
    width: width(value.width, fallback.width),
    spacing: spacing(value.spacing, fallback.spacing),
    layoutType: layoutType(value.layoutType, fallback.layoutType),
    layoutMode:
      value.layoutMode === 'grid' || value.layoutMode === 'masonry'
        ? value.layoutMode
        : fallback.layoutMode,
    cardStyle: cardStyle(value.cardStyle, fallback.cardStyle),
    density: density(value.density, fallback.density),
    gap: gap(value.gap, fallback.gap),
    desktopColumns: Math.min(4, Math.max(1, number(value.desktopColumns, fallback.desktopColumns))),
    tabletColumns: Math.min(3, Math.max(1, number(value.tabletColumns, fallback.tabletColumns))),
    mobileColumns: Math.min(2, Math.max(1, number(value.mobileColumns, fallback.mobileColumns))),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeCta(
  value: unknown,
  fallback: PortfolioPageCtaConfig
): PortfolioPageCtaConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.min(100, Math.max(1, number(value.order, fallback.order))),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    description: text(value.description, fallback.description),
    showPrimaryButton: bool(value.showPrimaryButton, fallback.showPrimaryButton),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    showSecondaryButton: bool(value.showSecondaryButton, fallback.showSecondaryButton),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink),
    alignment: alignment(value.alignment, fallback.alignment),
    width: width(value.width, fallback.width),
    spacing: spacing(value.spacing, fallback.spacing),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeCategoryConfig(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      {
        enabled: isRecord(entry) ? bool(entry.enabled, true) : true,
        order: isRecord(entry) ? number(entry.order, 9999) : 9999,
        label: isRecord(entry) ? text(entry.label, '') : '',
      },
    ])
  ) as Record<string, PortfolioPageCategoryConfig>;
}

function sanitizeItemConfig(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      {
        previewEnabled: isRecord(entry) ? bool(entry.previewEnabled, true) : true,
      },
    ])
  ) as Record<string, PortfolioPageItemConfig>;
}

export function getPortfolioPageBuilderConfig(map: SettingMap) {
  const fallback = createDefaultPortfolioPageBuilderConfig(map);
  const rawValue = getFirstSetting(map, PORTFOLIO_PAGE_BUILDER_SETTING_KEY);

  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) {
      return fallback;
    }

    return {
      pageEnabled: bool(parsed.pageEnabled, fallback.pageEnabled),
      hero: sanitizeHero(parsed.hero, fallback.hero),
      showcase: sanitizeShowcase(parsed.showcase, fallback.showcase),
      cta: sanitizeCta(parsed.cta, fallback.cta),
      categoryConfig: sanitizeCategoryConfig(parsed.categoryConfig),
      itemConfig: sanitizeItemConfig(parsed.itemConfig),
    } satisfies PortfolioPageBuilderConfig;
  } catch {
    return fallback;
  }
}

export function serializePortfolioPageBuilderConfig(config: PortfolioPageBuilderConfig) {
  return JSON.stringify(config);
}
