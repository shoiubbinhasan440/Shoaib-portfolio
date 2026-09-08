import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toSettingMap } from '@/lib/hero-settings';
import {
  fetchPortfolioDataset,
  getPortfolioItemDetailPath,
  getPortfolioItemMeta,
  getPortfolioItemPublicSlug,
  parsePortfolioItemMetaConfig,
  PORTFOLIO_ITEM_META_SETTING_KEY,
  sortPortfolioItemsByOrder,
  toPortfolioPreviewItems,
  type PortfolioItemMetaConfig,
  type PortfolioPreviewItem,
  type PortfolioSourceType,
} from '@/lib/portfolio-content';

export type PortfolioDetailRouteType = 'digital-marketing' | 'graphics' | 'videos';

export type PortfolioDetailData = {
  item: PortfolioPreviewItem;
  meta: Required<ReturnType<typeof getPortfolioItemMeta>>;
  nextItem: PortfolioPreviewItem | null;
  previousItem: PortfolioPreviewItem | null;
  relatedItems: PortfolioPreviewItem[];
};

export function routeTypeToSourceType(routeType: PortfolioDetailRouteType): PortfolioSourceType {
  if (routeType === 'digital-marketing') {
    return 'marketing';
  }

  return routeType === 'graphics' ? 'graphic' : 'video';
}

export function getPortfolioDetailTypeLabel(sourceType: PortfolioSourceType) {
  if (sourceType === 'graphic') {
    return 'Graphics';
  }

  if (sourceType === 'marketing') {
    return 'Digital Marketing';
  }

  return 'Video';
}

function isPublishedPortfolioItem(item: PortfolioPreviewItem, meta: PortfolioItemMetaConfig) {
  return (
    item.visible &&
    item.categoryActive &&
    item.categoryShowOnPortfolio &&
    meta.status !== 'draft' &&
    meta.status !== 'hidden'
  );
}

export const getPortfolioDetailData = cache(
  async (
    routeType: PortfolioDetailRouteType,
    slug: string
  ): Promise<PortfolioDetailData | null> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [{ data: settingsRows }, dataset] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      fetchPortfolioDataset(supabase),
    ]);
    const map = toSettingMap(settingsRows || []);
    const metaConfig = parsePortfolioItemMetaConfig(map[PORTFOLIO_ITEM_META_SETTING_KEY]);
    const sourceType = routeTypeToSourceType(routeType);
    const items = sortPortfolioItemsByOrder(
      toPortfolioPreviewItems(
        dataset.videos,
        dataset.graphics,
        dataset.categories,
        dataset.marketing
      )
        .filter(item => item.sourceType === sourceType)
        .filter(item => isPublishedPortfolioItem(item, getPortfolioItemMeta(item, metaConfig)))
    );
    const decodedSlug = decodeURIComponent(slug);
    const item =
      items.find(candidate => {
        const meta = getPortfolioItemMeta(candidate, metaConfig);
        return (
          getPortfolioItemPublicSlug(candidate, meta) === decodedSlug ||
          getPortfolioItemPublicSlug(candidate, null) === decodedSlug
        );
      }) || null;

    if (!item) {
      return null;
    }

    const meta = getPortfolioItemMeta(item, metaConfig);
    const currentIndex = items.findIndex(candidate => candidate.id === item.id);
    const previousItem = currentIndex > 0 ? items[currentIndex - 1] : items[items.length - 1] || null;
    const nextItem =
      currentIndex >= 0 && items.length > 1
        ? items[(currentIndex + 1) % items.length]
        : null;
    const relatedItems = items
      .filter(candidate => candidate.id !== item.id)
      .filter(candidate => candidate.categorySlug === item.categorySlug)
      .slice(0, 4);
    const fallbackRelated = items
      .filter(candidate => candidate.id !== item.id)
      .filter(candidate => !relatedItems.some(related => related.id === candidate.id))
      .slice(0, Math.max(0, 4 - relatedItems.length));

    return {
      item,
      meta,
      previousItem,
      nextItem,
      relatedItems: [...relatedItems, ...fallbackRelated],
    };
  }
);

export function getRelatedItemHref(item: PortfolioPreviewItem, metaConfig?: PortfolioItemMetaConfig) {
  return getPortfolioItemDetailPath(item, metaConfig);
}
