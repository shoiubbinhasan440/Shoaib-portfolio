import type { SupabaseClient } from '@supabase/supabase-js';
import { getFirstSetting, parseStyledSetting, type SettingMap } from '@/lib/hero-settings';

export type PortfolioSourceType = 'video' | 'graphic';
export type PortfolioTabKey = 'all' | 'video' | 'graphic';
export type PortfolioAllOrder = 'video-first' | 'graphic-first';
export type HomepagePortfolioSectionAlignment = 'left' | 'center';
export type HomepagePortfolioFilterAlignment = 'left' | 'center';
export type HomepagePortfolioWidth = 'normal' | 'wide' | 'full';
export type HomepagePortfolioGap = 'small' | 'medium' | 'large';
export type HomepagePortfolioDensity = 'compact' | 'normal' | 'spacious';
export type HomepagePortfolioLayoutType =
  | 'uniform-grid'
  | 'featured-first'
  | 'compact-preview'
  | 'cinematic'
  | 'simple-preview';
export type HomepagePortfolioCardStyle =
  | 'minimal-premium'
  | 'cinematic-overlay'
  | 'glass-bordered'
  | 'dark-editorial'
  | 'light-polished';
export type HomepagePortfolioResponsivePreset = 'compact' | 'balanced' | 'showcase';
export type HomepagePortfolioClickAction = 'preview' | 'portfolio' | 'preview-with-link';
export type HomepagePortfolioChipStyle = 'soft' | 'glass' | 'editorial';

export type PortfolioVideo = {
  id: number;
  title: string;
  category: string;
  youtube_url: string;
  thumbnail: string;
  tier: string;
  description?: string | null;
  order_num: number;
  visible: boolean;
};

export type PortfolioGraphic = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description?: string | null;
  visible: boolean;
  created_at?: string;
  order_num: number;
};

export type PortfolioCategory = {
  id: number;
  name: string;
  slug: string;
  type: string;
  active: boolean;
  order_num: number;
};

export type PortfolioPreviewItem = {
  sourceType: PortfolioSourceType;
  id: string;
  title: string;
  description?: string | null;
  category: string | null;
  categorySlug: string | null;
  categoryName: string;
  categoryActive: boolean;
  categoryType: string;
  imageUrl: string;
  visible: boolean;
  order_num: number;
  tier?: string;
  youtube_url?: string;
};

export type HomepagePortfolioItemConfig = {
  showOnHomepage?: boolean;
  homepageOrder?: number;
  homepageFeatured?: boolean;
  previewEnabled?: boolean;
};

export type HomepagePortfolioCategoryConfig = {
  enabled?: boolean;
  order?: number;
  label?: string;
};

export type HomepagePortfolioConfigMap = Record<string, HomepagePortfolioItemConfig>;
export type HomepagePortfolioCategoryConfigMap = Record<string, HomepagePortfolioCategoryConfig>;

export type HomepagePortfolioSectionSettings = {
  enabled: boolean;
  order: number;
  badge: string;
  title: string;
  subtitle: string;
  showHeader: boolean;
  showButton: boolean;
  buttonText: string;
  buttonLink: string;
  showViewAllButton: boolean;
  viewAllButtonText: string;
  viewAllButtonLink: string;
  itemLimit: number;
  maxRows: number;
  showVideos: boolean;
  showGraphics: boolean;
  mixedOrder: PortfolioAllOrder;
  showTabs: boolean;
  showCategoryFilters: boolean;
  showAllChip: boolean;
  showGroupingLabels: boolean;
  filterAlignment: HomepagePortfolioFilterAlignment;
  filterChipStyle: HomepagePortfolioChipStyle;
  alignment: HomepagePortfolioSectionAlignment;
  containerWidth: HomepagePortfolioWidth;
  gap: HomepagePortfolioGap;
  cardDensity: HomepagePortfolioDensity;
  layoutType: HomepagePortfolioLayoutType;
  cardStyle: HomepagePortfolioCardStyle;
  responsivePreset: HomepagePortfolioResponsivePreset;
  desktopColumns: number;
  tabletColumns: number;
  mobileColumns: number;
  mobileCompactMode: boolean;
  mobileFilterVisibility: boolean;
  enablePreviewModal: boolean;
  clickAction: HomepagePortfolioClickAction;
  previewButtonLabel: string;
  showThumbnail: boolean;
  showTitle: boolean;
  showCategory: boolean;
  showDescription: boolean;
  showTypeBadge: boolean;
  showCardCta: boolean;
  cardCtaText: string;
  showPreviewIcon: boolean;
  showHoverOverlay: boolean;
  showFeaturedBadge: boolean;
  itemConfig: HomepagePortfolioConfigMap;
  categoryConfig: HomepagePortfolioCategoryConfigMap;
};

export type PortfolioPageSettings = {
  title: string;
  subtitle: string;
  tabs: {
    all: {
      enabled: boolean;
      label: string;
    };
    video: {
      enabled: boolean;
      label: string;
    };
    graphic: {
      enabled: boolean;
      label: string;
    };
  };
  allTab: {
    showVideos: boolean;
    showGraphics: boolean;
    order: PortfolioAllOrder;
  };
};

export const HOMEPAGE_PORTFOLIO_SYSTEM_SETTING_KEY = 'homepage_portfolio_system_config';

export const HOMEPAGE_PORTFOLIO_SETTING_KEYS = {
  enabled: 'homepagePortfolioEnabled',
  badge: 'homepagePortfolioBadge',
  title: 'homepagePortfolioTitle',
  subtitle: 'homepagePortfolioSubtitle',
  itemLimit: 'homepagePortfolioItemLimit',
  buttonText: 'homepagePortfolioButtonText',
  buttonLink: 'homepagePortfolioButtonLink',
  itemConfig: 'homepagePortfolioItems',
  legacyBadge: 'portfolio_eyebrow',
  legacyTitle: 'portfolio_recent',
} as const;

export const PORTFOLIO_PAGE_SETTING_KEYS = {
  title: 'portfolio_page_title',
  subtitle: 'portfolio_page_subtitle',
  tabAllLabel: 'portfolio_tab_all',
  tabVideoLabel: 'portfolio_tab_video',
  tabGraphicLabel: 'portfolio_tab_graphics',
  tabAllEnabled: 'portfolioTabAllEnabled',
  tabVideoEnabled: 'portfolioTabVideoEnabled',
  tabGraphicEnabled: 'portfolioTabGraphicEnabled',
  allShowVideos: 'portfolioAllShowVideos',
  allShowGraphics: 'portfolioAllShowGraphics',
  allOrder: 'portfolioAllOrder',
} as const;

export const DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS: HomepagePortfolioSectionSettings = {
  enabled: true,
  order: 20,
  badge: 'Featured Work',
  title: 'সাম্প্রতিক কাজ',
  subtitle: 'Main portfolio archive থেকে homepage-এর জন্য বাছাই করা কিছু কাজ।',
  showHeader: true,
  showButton: true,
  buttonText: 'সব Portfolio দেখুন',
  buttonLink: '/portfolio',
  showViewAllButton: true,
  viewAllButtonText: 'View All Portfolio',
  viewAllButtonLink: '/portfolio',
  itemLimit: 6,
  maxRows: 0,
  showVideos: true,
  showGraphics: true,
  mixedOrder: 'video-first',
  showTabs: true,
  showCategoryFilters: true,
  showAllChip: true,
  showGroupingLabels: true,
  filterAlignment: 'left',
  filterChipStyle: 'glass',
  alignment: 'left',
  containerWidth: 'wide',
  gap: 'medium',
  cardDensity: 'normal',
  layoutType: 'uniform-grid',
  cardStyle: 'cinematic-overlay',
  responsivePreset: 'balanced',
  desktopColumns: 3,
  tabletColumns: 2,
  mobileColumns: 1,
  mobileCompactMode: true,
  mobileFilterVisibility: true,
  enablePreviewModal: true,
  clickAction: 'preview-with-link',
  previewButtonLabel: 'Preview',
  showThumbnail: true,
  showTitle: true,
  showCategory: true,
  showDescription: false,
  showTypeBadge: true,
  showCardCta: true,
  cardCtaText: 'Open Preview',
  showPreviewIcon: true,
  showHoverOverlay: true,
  showFeaturedBadge: true,
  itemConfig: {},
  categoryConfig: {},
};

export const DEFAULT_PORTFOLIO_PAGE_SETTINGS: PortfolioPageSettings = {
  title: 'আমার কাজের সংগ্রহ',
  subtitle: 'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের নির্বাচিত কাজগুলো এক জায়গায় দেখুন।',
  tabs: {
    all: {
      enabled: true,
      label: 'সব',
    },
    video: {
      enabled: true,
      label: 'ভিডিও এডিটিং',
    },
    graphic: {
      enabled: true,
      label: 'গ্রাফিক্স ডিজাইন',
    },
  },
  allTab: {
    showVideos: true,
    showGraphics: true,
    order: 'video-first',
  },
};

function parseBooleanSetting(rawValue: string | undefined, fallbackValue: boolean) {
  if (rawValue === undefined) {
    return fallbackValue;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  return fallbackValue;
}

function parseNumberSetting(rawValue: string | undefined, fallbackValue: number) {
  const parsed = parseInt(rawValue || '', 10);
  if (Number.isNaN(parsed)) {
    return fallbackValue;
  }

  return parsed;
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase();
}

function slugifyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function sortObjectEntries<T>(
  record: Record<string, T>,
  compare?: (left: [string, T], right: [string, T]) => number
) {
  return Object.fromEntries(
    Object.entries(record).sort(
      compare ||
        ((leftEntry, rightEntry) => leftEntry[0].localeCompare(rightEntry[0]))
    )
  );
}

export function getHomepagePortfolioItemKey(sourceType: PortfolioSourceType, itemId: string | number) {
  return `${sourceType}:${itemId}`;
}

export function getHomepagePortfolioCategoryKey(
  categoryType: string,
  categorySlug: string
) {
  return `${categoryType}:${categorySlug}`;
}

function getLegacyHomepagePortfolioItemKeys(sourceType: PortfolioSourceType, itemId: string) {
  if (sourceType === 'video') {
    return [itemId];
  }

  return [];
}

function sanitizeHomepagePortfolioItemConfigValue(
  value: unknown,
  fallback: HomepagePortfolioItemConfig = {}
) {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    showOnHomepage:
      typeof value.showOnHomepage === 'boolean'
        ? value.showOnHomepage
        : fallback.showOnHomepage,
    homepageOrder:
      typeof value.homepageOrder === 'number' && Number.isFinite(value.homepageOrder)
        ? value.homepageOrder
        : fallback.homepageOrder,
    homepageFeatured:
      typeof value.homepageFeatured === 'boolean'
        ? value.homepageFeatured
        : fallback.homepageFeatured,
    previewEnabled:
      typeof value.previewEnabled === 'boolean'
        ? value.previewEnabled
        : fallback.previewEnabled,
  } satisfies HomepagePortfolioItemConfig;
}

function sanitizeHomepagePortfolioCategoryConfigValue(
  value: unknown,
  fallback: HomepagePortfolioCategoryConfig = {}
) {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled:
      typeof value.enabled === 'boolean'
        ? value.enabled
        : fallback.enabled,
    order:
      typeof value.order === 'number' && Number.isFinite(value.order)
        ? value.order
        : fallback.order,
    label:
      typeof value.label === 'string'
        ? value.label
        : fallback.label,
  } satisfies HomepagePortfolioCategoryConfig;
}

function getConfigEntryForItem(
  sourceType: PortfolioSourceType,
  itemId: string,
  configMap: HomepagePortfolioConfigMap
) {
  const directKey = getHomepagePortfolioItemKey(sourceType, itemId);
  if (configMap[directKey]) {
    return configMap[directKey];
  }

  for (const legacyKey of getLegacyHomepagePortfolioItemKeys(sourceType, itemId)) {
    if (configMap[legacyKey]) {
      return configMap[legacyKey];
    }
  }

  return undefined;
}

function getConfigEntryForCategory(
  categorySlug: string | null | undefined,
  categoryType: string | null | undefined,
  configMap: HomepagePortfolioCategoryConfigMap
) {
  if (!categorySlug) {
    return undefined;
  }

  const normalizedType = categoryType || 'both';
  const directKey = getHomepagePortfolioCategoryKey(normalizedType, categorySlug);
  if (configMap[directKey]) {
    return configMap[directKey];
  }

  if (normalizedType !== 'both') {
    const bothKey = getHomepagePortfolioCategoryKey('both', categorySlug);
    if (configMap[bothKey]) {
      return configMap[bothKey];
    }
  }

  return undefined;
}

export function parseHomepagePortfolioItemConfig(rawValue: string | undefined) {
  if (!rawValue) {
    return {} as HomepagePortfolioConfigMap;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) {
      return {} as HomepagePortfolioConfigMap;
    }

    return sortObjectEntries(
      Object.fromEntries(
        Object.entries(parsed).map(([itemKey, item]) => [
          itemKey,
          sanitizeHomepagePortfolioItemConfigValue(item),
        ])
      ),
      ([leftKey, leftValue], [rightKey, rightValue]) => {
        const leftOrder =
          typeof leftValue.homepageOrder === 'number'
            ? leftValue.homepageOrder
            : Number.MAX_SAFE_INTEGER;
        const rightOrder =
          typeof rightValue.homepageOrder === 'number'
            ? rightValue.homepageOrder
            : Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return leftKey.localeCompare(rightKey);
      }
    ) as HomepagePortfolioConfigMap;
  } catch {
    return {} as HomepagePortfolioConfigMap;
  }
}

export function serializeHomepagePortfolioItemConfig(config: HomepagePortfolioConfigMap) {
  const orderedEntries = Object.entries(config).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const leftOrder =
      typeof leftValue.homepageOrder === 'number'
        ? leftValue.homepageOrder
        : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof rightValue.homepageOrder === 'number'
        ? rightValue.homepageOrder
        : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return leftKey.localeCompare(rightKey);
  });

  return JSON.stringify(
    Object.fromEntries(
      orderedEntries.map(([itemKey, item]) => [
        itemKey,
        {
          showOnHomepage: item.showOnHomepage ?? true,
          homepageOrder:
            typeof item.homepageOrder === 'number' && Number.isFinite(item.homepageOrder)
              ? item.homepageOrder
              : undefined,
          homepageFeatured: item.homepageFeatured ?? false,
          previewEnabled: item.previewEnabled ?? true,
        } satisfies HomepagePortfolioItemConfig,
      ])
    )
  );
}

export function parseHomepagePortfolioCategoryConfig(rawValue: string | undefined) {
  if (!rawValue) {
    return {} as HomepagePortfolioCategoryConfigMap;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) {
      return {} as HomepagePortfolioCategoryConfigMap;
    }

    return sortObjectEntries(
      Object.fromEntries(
        Object.entries(parsed).map(([categoryKey, category]) => [
          categoryKey,
          sanitizeHomepagePortfolioCategoryConfigValue(category),
        ])
      ),
      ([leftKey, leftValue], [rightKey, rightValue]) => {
        const leftOrder =
          typeof leftValue.order === 'number' ? leftValue.order : Number.MAX_SAFE_INTEGER;
        const rightOrder =
          typeof rightValue.order === 'number' ? rightValue.order : Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return leftKey.localeCompare(rightKey);
      }
    ) as HomepagePortfolioCategoryConfigMap;
  } catch {
    return {} as HomepagePortfolioCategoryConfigMap;
  }
}

export function serializeHomepagePortfolioCategoryConfig(
  config: HomepagePortfolioCategoryConfigMap
) {
  return JSON.stringify(
    sortObjectEntries(config, ([leftKey, leftValue], [rightKey, rightValue]) => {
      const leftOrder =
        typeof leftValue.order === 'number' ? leftValue.order : Number.MAX_SAFE_INTEGER;
      const rightOrder =
        typeof rightValue.order === 'number' ? rightValue.order : Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return leftKey.localeCompare(rightKey);
    })
  );
}

function sanitizeHomepagePortfolioSettings(
  value: unknown,
  fallback: HomepagePortfolioSectionSettings,
  legacyItemConfig: HomepagePortfolioConfigMap
): HomepagePortfolioSectionSettings {
  if (!isRecord(value)) {
    return {
      ...fallback,
      itemConfig:
        Object.keys(legacyItemConfig).length > 0
          ? legacyItemConfig
          : fallback.itemConfig,
    };
  }

  const parsedItemConfig = isRecord(value.itemConfig)
    ? (Object.fromEntries(
        Object.entries(value.itemConfig).map(([itemKey, itemValue]) => [
          itemKey,
          sanitizeHomepagePortfolioItemConfigValue(itemValue),
        ])
      ) as HomepagePortfolioConfigMap)
    : fallback.itemConfig;

  const parsedCategoryConfig = isRecord(value.categoryConfig)
    ? (Object.fromEntries(
        Object.entries(value.categoryConfig).map(([categoryKey, categoryValue]) => [
          categoryKey,
          sanitizeHomepagePortfolioCategoryConfigValue(categoryValue),
        ])
      ) as HomepagePortfolioCategoryConfigMap)
    : fallback.categoryConfig;

  return {
    enabled: boolValue(value.enabled, fallback.enabled),
    order: clampNumber(value.order, fallback.order, 1, 100),
    badge: textValue(value.badge, fallback.badge),
    title: textValue(value.title, fallback.title),
    subtitle: textValue(value.subtitle, fallback.subtitle),
    showHeader: boolValue(value.showHeader, fallback.showHeader),
    showButton: boolValue(value.showButton, fallback.showButton),
    buttonText: textValue(value.buttonText, fallback.buttonText),
    buttonLink: textValue(value.buttonLink, fallback.buttonLink),
    showViewAllButton: boolValue(value.showViewAllButton, fallback.showViewAllButton),
    viewAllButtonText: textValue(value.viewAllButtonText, fallback.viewAllButtonText),
    viewAllButtonLink: textValue(value.viewAllButtonLink, fallback.viewAllButtonLink),
    itemLimit: clampNumber(value.itemLimit, fallback.itemLimit, 1, 24),
    maxRows: clampNumber(value.maxRows, fallback.maxRows, 0, 6),
    showVideos: boolValue(value.showVideos, fallback.showVideos),
    showGraphics: boolValue(value.showGraphics, fallback.showGraphics),
    mixedOrder: pickEnum(value.mixedOrder, ['video-first', 'graphic-first'], fallback.mixedOrder),
    showTabs: boolValue(value.showTabs, fallback.showTabs),
    showCategoryFilters: boolValue(value.showCategoryFilters, fallback.showCategoryFilters),
    showAllChip: boolValue(value.showAllChip, fallback.showAllChip),
    showGroupingLabels: boolValue(value.showGroupingLabels, fallback.showGroupingLabels),
    filterAlignment: pickEnum(value.filterAlignment, ['left', 'center'], fallback.filterAlignment),
    filterChipStyle: pickEnum(value.filterChipStyle, ['soft', 'glass', 'editorial'], fallback.filterChipStyle),
    alignment: pickEnum(value.alignment, ['left', 'center'], fallback.alignment),
    containerWidth: pickEnum(value.containerWidth, ['normal', 'wide', 'full'], fallback.containerWidth),
    gap: pickEnum(value.gap, ['small', 'medium', 'large'], fallback.gap),
    cardDensity: pickEnum(value.cardDensity, ['compact', 'normal', 'spacious'], fallback.cardDensity),
    layoutType: pickEnum(
      value.layoutType,
      ['uniform-grid', 'featured-first', 'compact-preview', 'cinematic', 'simple-preview'],
      fallback.layoutType
    ),
    cardStyle: pickEnum(
      value.cardStyle,
      ['minimal-premium', 'cinematic-overlay', 'glass-bordered', 'dark-editorial', 'light-polished'],
      fallback.cardStyle
    ),
    responsivePreset: pickEnum(
      value.responsivePreset,
      ['compact', 'balanced', 'showcase'],
      fallback.responsivePreset
    ),
    desktopColumns: clampNumber(value.desktopColumns, fallback.desktopColumns, 1, 4),
    tabletColumns: clampNumber(value.tabletColumns, fallback.tabletColumns, 1, 3),
    mobileColumns: clampNumber(value.mobileColumns, fallback.mobileColumns, 1, 2),
    mobileCompactMode: boolValue(value.mobileCompactMode, fallback.mobileCompactMode),
    mobileFilterVisibility: boolValue(value.mobileFilterVisibility, fallback.mobileFilterVisibility),
    enablePreviewModal: boolValue(value.enablePreviewModal, fallback.enablePreviewModal),
    clickAction: pickEnum(value.clickAction, ['preview', 'portfolio', 'preview-with-link'], fallback.clickAction),
    previewButtonLabel: textValue(value.previewButtonLabel, fallback.previewButtonLabel),
    showThumbnail: boolValue(value.showThumbnail, fallback.showThumbnail),
    showTitle: boolValue(value.showTitle, fallback.showTitle),
    showCategory: boolValue(value.showCategory, fallback.showCategory),
    showDescription: boolValue(value.showDescription, fallback.showDescription),
    showTypeBadge: boolValue(value.showTypeBadge, fallback.showTypeBadge),
    showCardCta: boolValue(value.showCardCta, fallback.showCardCta),
    cardCtaText: textValue(value.cardCtaText, fallback.cardCtaText),
    showPreviewIcon: boolValue(value.showPreviewIcon, fallback.showPreviewIcon),
    showHoverOverlay: boolValue(value.showHoverOverlay, fallback.showHoverOverlay),
    showFeaturedBadge: boolValue(value.showFeaturedBadge, fallback.showFeaturedBadge),
    itemConfig:
      Object.keys(legacyItemConfig).length > 0
        ? legacyItemConfig
        : parsedItemConfig,
    categoryConfig: parsedCategoryConfig,
  };
}

export function serializeHomepagePortfolioSettings(
  settings: HomepagePortfolioSectionSettings
) {
  return JSON.stringify({
    ...settings,
    itemConfig: JSON.parse(serializeHomepagePortfolioItemConfig(settings.itemConfig)),
    categoryConfig: JSON.parse(serializeHomepagePortfolioCategoryConfig(settings.categoryConfig)),
  });
}

export function getHomepagePortfolioSettings(map: SettingMap) {
  const badge = parseStyledSetting(
    getFirstSetting(
      map,
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.badge,
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyBadge
    ),
    DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.badge
  );
  const title = parseStyledSetting(
    getFirstSetting(
      map,
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.title,
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyTitle
    ),
    DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.title
  );
  const subtitle = parseStyledSetting(
    map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.subtitle],
    DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.subtitle
  );
  const buttonText = parseStyledSetting(
    map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.buttonText],
    DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.buttonText
  );
  const legacyItemConfig = parseHomepagePortfolioItemConfig(map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig]);
  const fallback: HomepagePortfolioSectionSettings = {
    ...DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS,
    enabled: parseBooleanSetting(
      map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.enabled],
      DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.enabled
    ),
    badge: badge.value,
    title: title.value,
    subtitle: subtitle.value,
    itemLimit: Math.max(
      1,
      parseNumberSetting(
        map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemLimit],
        DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.itemLimit
      )
    ),
    buttonText: buttonText.value,
    buttonLink:
      map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.buttonLink] ||
      DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS.buttonLink,
    itemConfig: legacyItemConfig,
  };

  const rawValue = map[HOMEPAGE_PORTFOLIO_SYSTEM_SETTING_KEY];
  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return sanitizeHomepagePortfolioSettings(parsed, fallback, legacyItemConfig);
  } catch {
    return fallback;
  }
}

export function getPortfolioPageSettings(map: SettingMap) {
  const title = parseStyledSetting(
    map[PORTFOLIO_PAGE_SETTING_KEYS.title],
    DEFAULT_PORTFOLIO_PAGE_SETTINGS.title
  );
  const subtitle = parseStyledSetting(
    map[PORTFOLIO_PAGE_SETTING_KEYS.subtitle],
    DEFAULT_PORTFOLIO_PAGE_SETTINGS.subtitle
  );
  const allLabel = parseStyledSetting(
    map[PORTFOLIO_PAGE_SETTING_KEYS.tabAllLabel],
    DEFAULT_PORTFOLIO_PAGE_SETTINGS.tabs.all.label
  );
  const videoLabel = parseStyledSetting(
    map[PORTFOLIO_PAGE_SETTING_KEYS.tabVideoLabel],
    DEFAULT_PORTFOLIO_PAGE_SETTINGS.tabs.video.label
  );
  const graphicLabel = parseStyledSetting(
    map[PORTFOLIO_PAGE_SETTING_KEYS.tabGraphicLabel],
    DEFAULT_PORTFOLIO_PAGE_SETTINGS.tabs.graphic.label
  );
  const requestedOrder = map[PORTFOLIO_PAGE_SETTING_KEYS.allOrder];
  const allOrder: PortfolioAllOrder =
    requestedOrder === 'graphic-first' || requestedOrder === 'video-first'
      ? requestedOrder
      : DEFAULT_PORTFOLIO_PAGE_SETTINGS.allTab.order;

  return {
    title: title.value,
    subtitle: subtitle.value,
    tabs: {
      all: {
        enabled: parseBooleanSetting(
          map[PORTFOLIO_PAGE_SETTING_KEYS.tabAllEnabled],
          DEFAULT_PORTFOLIO_PAGE_SETTINGS.tabs.all.enabled
        ),
        label: allLabel.value,
      },
      video: {
        enabled: parseBooleanSetting(
          map[PORTFOLIO_PAGE_SETTING_KEYS.tabVideoEnabled],
          DEFAULT_PORTFOLIO_PAGE_SETTINGS.tabs.video.enabled
        ),
        label: videoLabel.value,
      },
      graphic: {
        enabled: parseBooleanSetting(
          map[PORTFOLIO_PAGE_SETTING_KEYS.tabGraphicEnabled],
          DEFAULT_PORTFOLIO_PAGE_SETTINGS.tabs.graphic.enabled
        ),
        label: graphicLabel.value,
      },
    },
    allTab: {
      showVideos: parseBooleanSetting(
        map[PORTFOLIO_PAGE_SETTING_KEYS.allShowVideos],
        DEFAULT_PORTFOLIO_PAGE_SETTINGS.allTab.showVideos
      ),
      showGraphics: parseBooleanSetting(
        map[PORTFOLIO_PAGE_SETTING_KEYS.allShowGraphics],
        DEFAULT_PORTFOLIO_PAGE_SETTINGS.allTab.showGraphics
      ),
      order: allOrder,
    },
  } satisfies PortfolioPageSettings;
}

export function findPortfolioCategory(
  categories: PortfolioCategory[],
  categoryValue: string | null | undefined
) {
  if (!categoryValue) {
    return null;
  }

  const normalizedValue = normalizeLookupValue(categoryValue);
  const normalizedSlug = slugifyValue(categoryValue);

  return (
    categories.find(category => normalizeLookupValue(category.slug) === normalizedValue) ||
    categories.find(category => normalizeLookupValue(category.name) === normalizedValue) ||
    categories.find(category => normalizeLookupValue(category.slug) === normalizedSlug) ||
    null
  );
}

export function normalizePortfolioCategoryValue(
  categoryValue: string | null | undefined,
  categories: PortfolioCategory[]
) {
  const matchedCategory = findPortfolioCategory(categories, categoryValue);
  if (matchedCategory) {
    return matchedCategory.slug;
  }

  if (!categoryValue) {
    return '';
  }

  return slugifyValue(categoryValue);
}

export function getPortfolioCategoryName(
  categories: PortfolioCategory[],
  categoryValue: string | null | undefined
) {
  const matchedCategory = findPortfolioCategory(categories, categoryValue);
  if (matchedCategory) {
    return matchedCategory.name;
  }

  return categoryValue || 'Portfolio';
}

function toPortfolioCategoryDetails(
  sourceType: PortfolioSourceType,
  categoryValue: string | null | undefined,
  categories: PortfolioCategory[]
) {
  const matchedCategory = findPortfolioCategory(categories, categoryValue);
  const fallbackType = sourceType === 'video' ? 'video' : 'graphic';

  return {
    category: categoryValue || null,
    categorySlug: matchedCategory?.slug || (categoryValue ? slugifyValue(categoryValue) : null),
    categoryName: matchedCategory?.name || categoryValue || 'Portfolio',
    categoryActive: matchedCategory?.active ?? true,
    categoryType: matchedCategory?.type || fallbackType,
  };
}

export function getHomepageConfigForItem(
  item: Pick<PortfolioPreviewItem, 'sourceType' | 'id' | 'order_num'>,
  configMap: HomepagePortfolioConfigMap
) {
  const rawConfig = getConfigEntryForItem(item.sourceType, item.id, configMap) || {};

  return {
    showOnHomepage: rawConfig.showOnHomepage ?? true,
    homepageOrder: rawConfig.homepageOrder ?? item.order_num,
    homepageFeatured: rawConfig.homepageFeatured ?? false,
    previewEnabled: rawConfig.previewEnabled ?? true,
  } satisfies Required<HomepagePortfolioItemConfig>;
}

export function getHomepageConfigForVideo(
  video: Pick<PortfolioVideo, 'id' | 'order_num'>,
  configMap: HomepagePortfolioConfigMap
) {
  return getHomepageConfigForItem(
    {
      sourceType: 'video',
      id: String(video.id),
      order_num: video.order_num,
    },
    configMap
  );
}

export function getHomepageConfigForGraphic(
  graphic: Pick<PortfolioGraphic, 'id' | 'order_num'>,
  configMap: HomepagePortfolioConfigMap
) {
  return getHomepageConfigForItem(
    {
      sourceType: 'graphic',
      id: String(graphic.id),
      order_num: graphic.order_num,
    },
    configMap
  );
}

export function getHomepageCategoryConfig(
  category:
    | Pick<PortfolioCategory, 'slug' | 'type' | 'name' | 'order_num'>
    | Pick<PortfolioPreviewItem, 'categorySlug' | 'categoryType' | 'categoryName' | 'order_num'>,
  configMap: HomepagePortfolioCategoryConfigMap
) {
  const categorySlug = 'slug' in category ? category.slug : category.categorySlug;
  const categoryType = 'type' in category ? category.type : category.categoryType;
  const categoryName = 'name' in category ? category.name : category.categoryName;
  const orderNum = typeof category.order_num === 'number' ? category.order_num : 9999;
  const rawConfig = getConfigEntryForCategory(categorySlug, categoryType, configMap) || {};

  return {
    enabled: rawConfig.enabled ?? true,
    order: rawConfig.order ?? orderNum,
    label: rawConfig.label || categoryName,
  };
}

export function getHomepageAllowedSourceTypes(
  settings: Pick<HomepagePortfolioSectionSettings, 'showVideos' | 'showGraphics' | 'mixedOrder'>
) {
  const orderedTypes =
    settings.mixedOrder === 'graphic-first'
      ? (['graphic', 'video'] as PortfolioSourceType[])
      : (['video', 'graphic'] as PortfolioSourceType[]);

  return orderedTypes.filter(sourceType =>
    sourceType === 'video' ? settings.showVideos : settings.showGraphics
  );
}

export function isHomepageItemAllowed(
  item: PortfolioPreviewItem,
  settings: Pick<
    HomepagePortfolioSectionSettings,
    'showVideos' | 'showGraphics' | 'itemConfig' | 'categoryConfig'
  >
) {
  if (!item.visible || !item.categoryActive) {
    return false;
  }

  if (item.sourceType === 'video' && !settings.showVideos) {
    return false;
  }

  if (item.sourceType === 'graphic' && !settings.showGraphics) {
    return false;
  }

  if (!getHomepageConfigForItem(item, settings.itemConfig).showOnHomepage) {
    return false;
  }

  if (item.categorySlug) {
    const categoryConfig = getHomepageCategoryConfig(item, settings.categoryConfig);
    if (!categoryConfig.enabled) {
      return false;
    }
  }

  return true;
}

export function toPortfolioPreviewItems(
  videos: PortfolioVideo[],
  graphics: PortfolioGraphic[],
  categories: PortfolioCategory[] = []
) {
  const videoItems: PortfolioPreviewItem[] = videos.map(video => ({
    sourceType: 'video',
    id: String(video.id),
    title: video.title,
    description: video.description || null,
    imageUrl: video.thumbnail,
    visible: video.visible,
    order_num: video.order_num,
    tier: video.tier,
    youtube_url: video.youtube_url,
    ...toPortfolioCategoryDetails('video', video.category, categories),
  }));

  const graphicItems: PortfolioPreviewItem[] = graphics.map(graphic => ({
    sourceType: 'graphic',
    id: String(graphic.id),
    title: graphic.title,
    description: graphic.description || null,
    imageUrl: graphic.image_url,
    visible: graphic.visible,
    order_num: graphic.order_num,
    ...toPortfolioCategoryDetails('graphic', graphic.category, categories),
  }));

  return [...videoItems, ...graphicItems];
}

export function getAllowedPortfolioSourceTypes(
  activeTab: PortfolioTabKey,
  settings: PortfolioPageSettings
) {
  if (activeTab === 'video') {
    return ['video'] as PortfolioSourceType[];
  }

  if (activeTab === 'graphic') {
    return ['graphic'] as PortfolioSourceType[];
  }

  const allowedSourceTypes: PortfolioSourceType[] = [];

  if (settings.allTab.showVideos) {
    allowedSourceTypes.push('video');
  }

  if (settings.allTab.showGraphics) {
    allowedSourceTypes.push('graphic');
  }

  return allowedSourceTypes;
}

export function getPortfolioTabs(
  items: PortfolioPreviewItem[],
  settings: PortfolioPageSettings
) {
  const visibleItems = items.filter(item => item.visible && item.categoryActive);
  const videoCount = visibleItems.filter(item => item.sourceType === 'video').length;
  const graphicCount = visibleItems.filter(item => item.sourceType === 'graphic').length;
  const allCount = visibleItems.filter(item =>
    getAllowedPortfolioSourceTypes('all', settings).includes(item.sourceType)
  ).length;

  const tabs: Array<{ key: PortfolioTabKey; label: string; count: number }> = [];

  if (
    settings.tabs.all.enabled &&
    getAllowedPortfolioSourceTypes('all', settings).length > 0 &&
    allCount > 0
  ) {
    tabs.push({
      key: 'all',
      label: settings.tabs.all.label,
      count: allCount,
    });
  }

  if (settings.tabs.video.enabled && videoCount > 0) {
    tabs.push({
      key: 'video',
      label: settings.tabs.video.label,
      count: videoCount,
    });
  }

  if (settings.tabs.graphic.enabled && graphicCount > 0) {
    tabs.push({
      key: 'graphic',
      label: settings.tabs.graphic.label,
      count: graphicCount,
    });
  }

  return tabs;
}

export function getPortfolioItemsForTab(
  items: PortfolioPreviewItem[],
  settings: PortfolioPageSettings,
  activeTab: PortfolioTabKey
) {
  const allowedSourceTypes = getAllowedPortfolioSourceTypes(activeTab, settings);

  return items.filter(
    item =>
      item.visible &&
      item.categoryActive &&
      allowedSourceTypes.includes(item.sourceType)
  );
}

export function getPortfolioCategoriesForTab(
  items: PortfolioPreviewItem[],
  categories: PortfolioCategory[],
  settings: PortfolioPageSettings,
  activeTab: PortfolioTabKey
) {
  const allowedSourceTypes = getAllowedPortfolioSourceTypes(activeTab, settings);

  return categories
    .filter(category => category.active)
    .filter(category => {
      if (category.type === 'both') {
        return true;
      }

      return allowedSourceTypes.includes(category.type as PortfolioSourceType);
    })
    .filter(category =>
      items.some(
        item =>
          item.visible &&
          item.categoryActive &&
          allowedSourceTypes.includes(item.sourceType) &&
          item.categorySlug === category.slug
      )
    )
    .sort((leftCategory, rightCategory) => leftCategory.order_num - rightCategory.order_num);
}

export function sortPortfolioItemsByOrder(items: PortfolioPreviewItem[]) {
  return [...items].sort((leftItem, rightItem) => {
    if (leftItem.order_num !== rightItem.order_num) {
      return leftItem.order_num - rightItem.order_num;
    }

    return leftItem.title.localeCompare(rightItem.title);
  });
}

export function getHomepagePortfolioPreviewItems(
  items: PortfolioPreviewItem[],
  settings: Pick<
    HomepagePortfolioSectionSettings,
    'itemConfig' | 'itemLimit' | 'showVideos' | 'showGraphics' | 'categoryConfig'
  >
) {
  return items
    .filter(item => isHomepageItemAllowed(item, settings))
    .sort((leftItem, rightItem) => {
      const leftConfig = getHomepageConfigForItem(leftItem, settings.itemConfig);
      const rightConfig = getHomepageConfigForItem(rightItem, settings.itemConfig);

      if (leftConfig.homepageFeatured !== rightConfig.homepageFeatured) {
        return leftConfig.homepageFeatured ? -1 : 1;
      }

      if (leftConfig.homepageOrder !== rightConfig.homepageOrder) {
        return leftConfig.homepageOrder - rightConfig.homepageOrder;
      }

      if (leftItem.order_num !== rightItem.order_num) {
        return leftItem.order_num - rightItem.order_num;
      }

      return leftItem.title.localeCompare(rightItem.title);
    })
    .slice(0, settings.itemLimit);
}

export function findHomepageOrderConflict(
  items: Array<Pick<PortfolioPreviewItem, 'sourceType' | 'id' | 'order_num' | 'visible' | 'title'>>,
  configMap: HomepagePortfolioConfigMap,
  target: Pick<PortfolioPreviewItem, 'sourceType' | 'id' | 'order_num'>,
  nextHomepageOrder: number,
  nextShowOnHomepage: boolean
) {
  if (!nextShowOnHomepage) {
    return null;
  }

  return (
    items.find(item => {
      if (!item.visible) {
        return false;
      }

      if (item.sourceType === target.sourceType && item.id === target.id) {
        return false;
      }

      const currentConfig = getHomepageConfigForItem(item, configMap);
      return currentConfig.showOnHomepage && currentConfig.homepageOrder === nextHomepageOrder;
    }) || null
  );
}

export async function fetchPortfolioDataset(
  supabase: SupabaseClient,
  options?: { includeHidden?: boolean }
) {
  const includeHidden = options?.includeHidden ?? false;

  const videoQuery = includeHidden
    ? supabase.from('videos').select('*').order('order_num', { ascending: true })
    : supabase.from('videos').select('*').eq('visible', true).order('order_num', { ascending: true });

  const graphicQuery = includeHidden
    ? supabase
        .from('graphics')
        .select('*')
        .order('order_num', { ascending: true })
        .order('created_at', { ascending: false })
    : supabase
        .from('graphics')
        .select('*')
        .eq('visible', true)
        .order('order_num', { ascending: true })
        .order('created_at', { ascending: false });

  const [videoResponse, categoryResponse, graphicResponse] = await Promise.all([
    videoQuery,
    supabase.from('categories').select('*').order('order_num', { ascending: true }),
    graphicQuery,
  ]);

  const graphics = ((graphicResponse.data || []) as Array<PortfolioGraphic>).map((graphic, index) => ({
    ...graphic,
    order_num:
      typeof graphic.order_num === 'number' && Number.isFinite(graphic.order_num)
        ? graphic.order_num
        : 1000 + index,
  }));

  return {
    videos: (videoResponse.data || []) as PortfolioVideo[],
    categories: (categoryResponse.data || []) as PortfolioCategory[],
    graphics,
  };
}

export async function fetchPortfolioVideoDataset(
  supabase: SupabaseClient,
  options?: { includeHidden?: boolean }
) {
  const { videos, categories } = await fetchPortfolioDataset(supabase, options);
  return { videos, categories };
}
