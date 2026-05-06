import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildSitemap } from '@/lib/site-metadata';
import {
  fetchPortfolioDataset,
  getHomepageAllowedSourceTypes,
  toPortfolioPreviewItems,
  type PortfolioSourceType,
} from '@/lib/portfolio-content';
import { SITE_CONFIG } from '@/lib/site-config';

async function buildPortfolioCategorySitemapEntries(
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
  const { videos, graphics, categories } = await fetchPortfolioDataset(supabase);
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

  return [...keys]
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
        url: `${canonicalUrl}/portfolio/category/${sourceType}/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      };
    });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getServerGlobalSettings();
  const categoryEntries = await buildPortfolioCategorySitemapEntries(
    settings.seo.canonicalUrl || SITE_CONFIG.url
  );

  return buildSitemap(settings, categoryEntries);
}
