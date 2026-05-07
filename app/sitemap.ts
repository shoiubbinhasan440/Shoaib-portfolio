import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildSitemap } from '@/lib/site-metadata';
import {
  fetchPortfolioDataset,
  getHomepageAllowedSourceTypes,
  getPortfolioItemDetailPath,
  getPortfolioItemMeta,
  parsePortfolioItemMetaConfig,
  PORTFOLIO_ITEM_META_SETTING_KEY,
  toPortfolioPreviewItems,
  type PortfolioSourceType,
} from '@/lib/portfolio-content';
import { absoluteAssetUrl, getCanonicalUrl, SITE_CONFIG } from '@/lib/site-config';
import { toSettingMap } from '@/lib/hero-settings';

async function buildPortfolioSitemapEntries(
  canonicalUrl: string
): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!canonicalUrl || !supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [{ data: settingsRows }, { videos, graphics, categories }] = await Promise.all([
    supabase.from('site_settings').select('key, value'),
    fetchPortfolioDataset(supabase),
  ]);
  const map = toSettingMap(settingsRows || []);
  const metaConfig = parsePortfolioItemMetaConfig(map[PORTFOLIO_ITEM_META_SETTING_KEY]);
  const items = toPortfolioPreviewItems(videos, graphics, categories);
  const keys = new Set<string>();

  items.forEach(item => {
    if (!item.visible || !item.categoryActive || !item.categorySlug) {
      return;
    }

    if (!item.categoryShowOnPortfolio) {
      return;
    }

    keys.add(`${item.sourceType}:${item.categorySlug}`);
  });

  const orderedTypes = getHomepageAllowedSourceTypes({
    showVideos: true,
    showGraphics: true,
    mixedOrder: 'video-first',
  });

  const categoryEntries = [...keys]
    .sort((left, right) => {
      const [leftType, leftSlug] = left.split(':') as [PortfolioSourceType, string];
      const [rightType, rightSlug] = right.split(':') as [PortfolioSourceType, string];
      const leftTypeIndex = orderedTypes.indexOf(leftType);
      const rightTypeIndex = orderedTypes.indexOf(rightType);

      if (leftTypeIndex !== rightTypeIndex) {
        return leftTypeIndex - rightTypeIndex;
      }

      return leftSlug.localeCompare(rightSlug);
    })
    .map(key => {
      const [sourceType, slug] = key.split(':') as [PortfolioSourceType, string];

      return {
        url: getCanonicalUrl(
          `/portfolio/category/${sourceType === 'graphic' ? 'graphics' : sourceType}/${slug}`
        ),
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      };
    });

  const itemEntries = items
    .filter(item => {
      const meta = getPortfolioItemMeta(item, metaConfig);
      return (
        item.visible &&
        item.categoryActive &&
        item.categoryShowOnPortfolio &&
        meta.status !== 'draft' &&
        meta.status !== 'hidden' &&
        meta.robots !== 'noindex-nofollow'
      );
    })
    .map(item => {
      const meta = getPortfolioItemMeta(item, metaConfig);
      const image = meta.ogImage || meta.socialImage || meta.coverImage || item.imageUrl;

      return {
        url: getCanonicalUrl(getPortfolioItemDetailPath(item, meta)),
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: item.sourceType === 'graphic' ? 0.68 : 0.66,
        images: image ? [absoluteAssetUrl(image)] : undefined,
      };
    });

  return [...categoryEntries, ...itemEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getServerGlobalSettings();
  const portfolioEntries = await buildPortfolioSitemapEntries(
    settings.seo.canonicalUrl || SITE_CONFIG.url
  );

  return buildSitemap(settings, portfolioEntries);
}
