import { parseStyledSetting, type SettingMap } from '@/lib/hero-settings';
import {
  createDefaultBuilderSectionStyles,
  sanitizeBuilderSectionStyles,
  type BuilderSectionStyles,
} from '@/lib/page-builder-styles';

export const TUTORIAL_PAGE_SETTING_KEY = 'tutorial_page_config';

export type TutorialPageAlignment = 'left' | 'center';
export type TutorialPageWidth = 'normal' | 'wide' | 'full';
export type TutorialPageSpacing = 'compact' | 'balanced' | 'spacious';
export type TutorialPageLayoutType = 'showcase' | 'editorial' | 'compact';
export type TutorialPageCardStyle = 'cinematic' | 'glass' | 'minimal' | 'light';
export type TutorialPageDensity = 'compact' | 'balanced' | 'spacious';
export type TutorialPageGap = 'small' | 'medium' | 'large';

export type TutorialStatItem = {
  id: string;
  value: string;
  label: string;
  enabled: boolean;
  order: number;
};

export type TutorialCategoryConfig = {
  enabled?: boolean;
  order?: number;
  label?: string;
};

export type TutorialPageHeroConfig = {
  enabled: boolean;
  order: number;
  alignment: TutorialPageAlignment;
  width: TutorialPageWidth;
  spacing: TutorialPageSpacing;
  label: string;
  title: string;
  subtitle: string;
  introText: string;
  showStats: boolean;
  showPrimaryButton: boolean;
  primaryButtonText: string;
  primaryButtonLink: string;
  stats: TutorialStatItem[];
  styles: BuilderSectionStyles;
};

export type TutorialPageShowcaseConfig = {
  enabled: boolean;
  order: number;
  alignment: TutorialPageAlignment;
  width: TutorialPageWidth;
  spacing: TutorialPageSpacing;
  layoutType: TutorialPageLayoutType;
  cardStyle: TutorialPageCardStyle;
  density: TutorialPageDensity;
  gap: TutorialPageGap;
  desktopColumns: number;
  tabletColumns: number;
  mobileColumns: number;
  showCategoryFilters: boolean;
  showLevelFilters: boolean;
  showAllCategory: boolean;
  showAllLevel: boolean;
  allCategoryLabel: string;
  allLevelLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  styles: BuilderSectionStyles;
};

export type TutorialPageCtaConfig = {
  enabled: boolean;
  order: number;
  alignment: TutorialPageAlignment;
  width: TutorialPageWidth;
  spacing: TutorialPageSpacing;
  label: string;
  title: string;
  description: string;
  showButton: boolean;
  buttonText: string;
  buttonLink: string;
  styles: BuilderSectionStyles;
};

export type TutorialPageConfig = {
  pageEnabled: boolean;
  hero: TutorialPageHeroConfig;
  showcase: TutorialPageShowcaseConfig;
  cta: TutorialPageCtaConfig;
  categoryConfig: Record<string, TutorialCategoryConfig>;
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

function width(value: unknown, fallback: TutorialPageWidth): TutorialPageWidth {
  return value === 'normal' || value === 'wide' || value === 'full' ? value : fallback;
}

function spacing(value: unknown, fallback: TutorialPageSpacing): TutorialPageSpacing {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function alignment(
  value: unknown,
  fallback: TutorialPageAlignment
): TutorialPageAlignment {
  return value === 'left' || value === 'center' ? value : fallback;
}

function layoutType(
  value: unknown,
  fallback: TutorialPageLayoutType
): TutorialPageLayoutType {
  return value === 'showcase' || value === 'editorial' || value === 'compact'
    ? value
    : fallback;
}

function cardStyle(
  value: unknown,
  fallback: TutorialPageCardStyle
): TutorialPageCardStyle {
  return value === 'cinematic' ||
    value === 'glass' ||
    value === 'minimal' ||
    value === 'light'
    ? value
    : fallback;
}

function density(
  value: unknown,
  fallback: TutorialPageDensity
): TutorialPageDensity {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function gap(value: unknown, fallback: TutorialPageGap): TutorialPageGap {
  return value === 'small' || value === 'medium' || value === 'large' ? value : fallback;
}

function sanitizeStats(value: unknown, fallback: TutorialStatItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `stat-${index + 1}`),
      value: text(item.value, fallback[index]?.value || ''),
      label: text(item.label, fallback[index]?.label || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: Math.max(1, num(item.order, fallback[index]?.order ?? index + 1)),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeHero(
  value: unknown,
  fallback: TutorialPageHeroConfig
): TutorialPageHeroConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    alignment: alignment(value.alignment, fallback.alignment),
    width: width(value.width, fallback.width),
    spacing: spacing(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    introText: text(value.introText, fallback.introText),
    showStats: bool(value.showStats, fallback.showStats),
    showPrimaryButton: bool(value.showPrimaryButton, fallback.showPrimaryButton),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    stats: sanitizeStats(value.stats, fallback.stats),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeShowcase(
  value: unknown,
  fallback: TutorialPageShowcaseConfig
): TutorialPageShowcaseConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    alignment: alignment(value.alignment, fallback.alignment),
    width: width(value.width, fallback.width),
    spacing: spacing(value.spacing, fallback.spacing),
    layoutType: layoutType(value.layoutType, fallback.layoutType),
    cardStyle: cardStyle(value.cardStyle, fallback.cardStyle),
    density: density(value.density, fallback.density),
    gap: gap(value.gap, fallback.gap),
    desktopColumns: Math.min(4, Math.max(1, num(value.desktopColumns, fallback.desktopColumns))),
    tabletColumns: Math.min(3, Math.max(1, num(value.tabletColumns, fallback.tabletColumns))),
    mobileColumns: Math.min(2, Math.max(1, num(value.mobileColumns, fallback.mobileColumns))),
    showCategoryFilters: bool(value.showCategoryFilters, fallback.showCategoryFilters),
    showLevelFilters: bool(value.showLevelFilters, fallback.showLevelFilters),
    showAllCategory: bool(value.showAllCategory, fallback.showAllCategory),
    showAllLevel: bool(value.showAllLevel, fallback.showAllLevel),
    allCategoryLabel: text(value.allCategoryLabel, fallback.allCategoryLabel),
    allLevelLabel: text(value.allLevelLabel, fallback.allLevelLabel),
    emptyTitle: text(value.emptyTitle, fallback.emptyTitle),
    emptyDescription: text(value.emptyDescription, fallback.emptyDescription),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeCta(
  value: unknown,
  fallback: TutorialPageCtaConfig
): TutorialPageCtaConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    alignment: alignment(value.alignment, fallback.alignment),
    width: width(value.width, fallback.width),
    spacing: spacing(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    description: text(value.description, fallback.description),
    showButton: bool(value.showButton, fallback.showButton),
    buttonText: text(value.buttonText, fallback.buttonText),
    buttonLink: text(value.buttonLink, fallback.buttonLink),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

export function createDefaultTutorialPageConfig(tutorialCount = 0): TutorialPageConfig {
  return {
    pageEnabled: true,
    hero: {
      enabled: true,
      order: 10,
      alignment: 'center',
      width: 'wide',
      spacing: 'balanced',
      label: 'Learning Hub',
      title: 'শিখুন, refine করুন, আর level up করুন',
      subtitle:
        'Video editing, design workflow, motion clarity এবং creator-focused practical tutorials.',
      introText:
        'বাংলায় clear explanation, category-based browsing, এবং polished preview experience দিয়ে tutorials সাজানো আছে যেন learning flow clean থাকে।',
      showStats: true,
      showPrimaryButton: true,
      primaryButtonText: 'Contact Me',
      primaryButtonLink: '/contact',
      stats: [
        { id: 'tutorials', value: `${tutorialCount}+`, label: 'Tutorials', enabled: true, order: 1 },
        { id: 'free', value: '100%', label: 'Free Content', enabled: true, order: 2 },
        { id: 'language', value: 'বাংলা', label: 'Language', enabled: true, order: 3 },
      ],
      styles: createDefaultBuilderSectionStyles(),
    },
    showcase: {
      enabled: true,
      order: 20,
      alignment: 'left',
      width: 'wide',
      spacing: 'balanced',
      layoutType: 'showcase',
      cardStyle: 'cinematic',
      density: 'balanced',
      gap: 'medium',
      desktopColumns: 3,
      tabletColumns: 2,
      mobileColumns: 1,
      showCategoryFilters: true,
      showLevelFilters: true,
      showAllCategory: true,
      showAllLevel: true,
      allCategoryLabel: 'সব',
      allLevelLabel: 'সব লেভেল',
      emptyTitle: 'এখনও কোনো tutorial পাওয়া যায়নি',
      emptyDescription: 'Admin panel থেকে tutorial যোগ করুন বা filter বদলে আবার দেখুন।',
      styles: createDefaultBuilderSectionStyles(),
    },
    cta: {
      enabled: true,
      order: 30,
      alignment: 'center',
      width: 'normal',
      spacing: 'balanced',
      label: 'Want a structured creative workflow?',
      title: 'Need one-to-one creative support?',
      description:
        'Tutorial দেখে যদি project execution, system setup, বা premium delivery support চান, contact page থেকে brief পাঠান।',
      showButton: true,
      buttonText: 'Start a Project',
      buttonLink: '/contact',
      styles: createDefaultBuilderSectionStyles(),
    },
    categoryConfig: {},
  };
}

export function getTutorialCategoryKey(category: string) {
  return category.trim().toLowerCase();
}

export function getTutorialCategoryConfig(
  category: string,
  configMap: Record<string, TutorialCategoryConfig>
) {
  const key = getTutorialCategoryKey(category);
  const config = configMap[key] || {};

  return {
    enabled: config.enabled ?? true,
    order: config.order ?? 999,
    label: config.label || category,
  };
}

export function getTutorialPageConfig(
  map: SettingMap,
  tutorialCount = 0
) {
  const fallback = createDefaultTutorialPageConfig(tutorialCount);
  const rawValue = map[TUTORIAL_PAGE_SETTING_KEY];

  if (!rawValue) {
    const legacyTitle = parseStyledSetting(map.tutorial_title, fallback.hero.title).value;
    const legacySubtitle = parseStyledSetting(map.tutorial_subtitle, fallback.hero.subtitle).value;
    const legacyEmpty = parseStyledSetting(map.tutorial_coming, fallback.showcase.emptyTitle).value;

    return {
      ...fallback,
      hero: {
        ...fallback.hero,
        title: legacyTitle,
        subtitle: legacySubtitle,
      },
      showcase: {
        ...fallback.showcase,
        emptyTitle: legacyEmpty,
      },
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;

    return {
      pageEnabled: bool(parsed.pageEnabled, fallback.pageEnabled),
      hero: sanitizeHero(parsed.hero, fallback.hero),
      showcase: sanitizeShowcase(parsed.showcase, fallback.showcase),
      cta: sanitizeCta(parsed.cta, fallback.cta),
      categoryConfig: isRecord(parsed.categoryConfig)
        ? Object.fromEntries(
            Object.entries(parsed.categoryConfig).map(([key, value]) => [
              key,
              {
                enabled: isRecord(value) ? bool(value.enabled, true) : true,
                order: isRecord(value) ? Math.max(1, num(value.order, 999)) : 999,
                label: isRecord(value) ? text(value.label, '') : '',
              } satisfies TutorialCategoryConfig,
            ])
          )
        : fallback.categoryConfig,
    };
  } catch {
    return fallback;
  }
}

export function serializeTutorialPageConfig(config: TutorialPageConfig) {
  return JSON.stringify(config);
}
