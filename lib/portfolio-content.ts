import type { SupabaseClient } from '@supabase/supabase-js';
import { getFirstSetting, parseStyledSetting, type SettingMap } from '@/lib/hero-settings';

export type PortfolioSourceType = 'video' | 'graphic';
export type PortfolioTabKey = 'all' | 'video' | 'graphic';
export type PortfolioAllOrder = 'video-first' | 'graphic-first';

export type PortfolioVideo = {
  id: number;
  title: string;
  category: string;
  youtube_url: string;
  thumbnail: string;
  tier: string;
  order_num: number;
  visible: boolean;
};

export type PortfolioGraphic = {
  id: string;
  title: string;
  category: string;
  image_url: string;
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
};

export type HomepagePortfolioConfigMap = Record<string, HomepagePortfolioItemConfig>;

export type HomepagePortfolioSectionSettings = {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  itemLimit: number;
  buttonText: string;
  buttonLink: string;
  itemConfig: HomepagePortfolioConfigMap;
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
  badge: 'Featured Work',
  title: 'সাম্প্রতিক কাজ',
  subtitle: 'Main portfolio archive থেকে homepage-এর জন্য বাছাই করা কিছু কাজ।',
  itemLimit: 6,
  buttonText: 'সব Portfolio দেখুন',
  buttonLink: '/portfolio',
  itemConfig: {},
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

export function getHomepagePortfolioItemKey(sourceType: PortfolioSourceType, itemId: string | number) {
  return `${sourceType}:${itemId}`;
}

function getLegacyHomepagePortfolioItemKeys(sourceType: PortfolioSourceType, itemId: string) {
  if (sourceType === 'video') {
    return [itemId];
  }

  return [];
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

export function parseHomepagePortfolioItemConfig(rawValue: string | undefined) {
  if (!rawValue) {
    return {} as HomepagePortfolioConfigMap;
  }

  try {
    const parsed = JSON.parse(rawValue) as HomepagePortfolioConfigMap;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {} as HomepagePortfolioConfigMap;
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([itemKey, item]) => [
        itemKey,
        {
          showOnHomepage: item?.showOnHomepage ?? true,
          homepageOrder:
            typeof item?.homepageOrder === 'number' && Number.isFinite(item.homepageOrder)
              ? item.homepageOrder
              : undefined,
          homepageFeatured: item?.homepageFeatured ?? false,
        } satisfies HomepagePortfolioItemConfig,
      ])
    );
  } catch {
    return {} as HomepagePortfolioConfigMap;
  }
}

export function serializeHomepagePortfolioItemConfig(config: HomepagePortfolioConfigMap) {
  const orderedEntries = Object.entries(config).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const leftOrder = typeof leftValue.homepageOrder === 'number' ? leftValue.homepageOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof rightValue.homepageOrder === 'number' ? rightValue.homepageOrder : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return leftKey.localeCompare(rightKey);
  });

  return JSON.stringify(Object.fromEntries(orderedEntries));
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

  return {
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
    itemConfig: parseHomepagePortfolioItemConfig(map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig]),
  } satisfies HomepagePortfolioSectionSettings;
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

export function toPortfolioPreviewItems(
  videos: PortfolioVideo[],
  graphics: PortfolioGraphic[],
  categories: PortfolioCategory[] = []
) {
  const videoItems: PortfolioPreviewItem[] = videos.map(video => ({
    sourceType: 'video',
    id: String(video.id),
    title: video.title,
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
  settings: Pick<HomepagePortfolioSectionSettings, 'itemConfig' | 'itemLimit'>
) {
  return items
    .filter(item => item.visible)
    .filter(item => getHomepageConfigForItem(item, settings.itemConfig).showOnHomepage)
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
    ? supabase.from('graphics').select('*').order('created_at', { ascending: false })
    : supabase.from('graphics').select('*').eq('visible', true).order('created_at', { ascending: false });

  const [videoResponse, categoryResponse, graphicResponse] = await Promise.all([
    videoQuery,
    supabase.from('categories').select('*').order('order_num', { ascending: true }),
    graphicQuery,
  ]);

  const graphics = ((graphicResponse.data || []) as Array<Omit<PortfolioGraphic, 'order_num'>>).map(
    (graphic, index) => ({
      ...graphic,
      order_num: 1000 + index,
    })
  );

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
