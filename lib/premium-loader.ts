import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { PremiumPortfolioLoaderImage } from '@/components/PremiumPortfolioLoader';
import { getGlobalSettingsConfig, type GlobalSettingsConfig } from '@/lib/global-settings';
import { getServerSettingMap } from '@/lib/server-site-settings';
import {
  fetchPortfolioDataset,
  getHomepageConfigForItem,
  getHomepagePortfolioSettings,
  toPortfolioPreviewItems,
  type PortfolioPreviewItem,
} from '@/lib/portfolio-content';

export type PremiumLoaderResolvedConfig = {
  images: PremiumPortfolioLoaderImage[];
  settings: GlobalSettingsConfig;
};

function fallbackImages(settings: GlobalSettingsConfig): PremiumPortfolioLoaderImage[] {
  const logoUrl = settings.siteIdentity.logoUrl || settings.seo.defaultOgImage;

  if (logoUrl) {
    return [
      {
        alt: settings.siteIdentity.logoAlt || settings.siteIdentity.siteName,
        src: logoUrl,
        type: 'brand',
      },
    ];
  }

  return [
    {
      alt: 'Md Minhajul Hoque portfolio preview',
      src: '/og-image.jpg',
      type: 'brand',
    },
  ];
}

function toLoaderImage(item: PortfolioPreviewItem): PremiumPortfolioLoaderImage {
  return {
    alt: item.title,
    src: item.imageUrl,
    type: item.sourceType,
  };
}

function uniqueImages(images: PremiumPortfolioLoaderImage[]) {
  const seen = new Set<string>();
  return images.filter(image => {
    if (!image.src || seen.has(image.src)) {
      return false;
    }

    seen.add(image.src);
    return true;
  });
}

export const getPremiumLoaderConfig = cache(async (): Promise<PremiumLoaderResolvedConfig> => {
  const map = await getServerSettingMap();
  const settings = getGlobalSettingsConfig(map);
  const loader = settings.loader;

  if (!loader.enabled) {
    return { images: [], settings };
  }

  if (loader.imageSource === 'profile-fallback') {
    return { images: fallbackImages(settings), settings };
  }

  const manualImages = loader.manualImages.map((src, index) => ({
    alt: `Portfolio loader image ${index + 1}`,
    src,
    type: 'graphic' as const,
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const manualFallbackImages = uniqueImages(manualImages).slice(0, 12);

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      images:
        loader.imageSource === 'manual' && manualFallbackImages.length > 0
          ? manualFallbackImages
          : fallbackImages(settings),
      settings,
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const dataset = await fetchPortfolioDataset(supabase);
    const homepagePortfolio = getHomepagePortfolioSettings(map);
    const items = toPortfolioPreviewItems(dataset.videos, dataset.graphics, dataset.categories)
      .filter(item => item.sourceType === 'graphic' && item.imageUrl && item.visible && item.categoryActive);

    const featuredItems = items
      .filter(item => getHomepageConfigForItem(item, homepagePortfolio.itemConfig).homepageFeatured)
      .sort((left, right) => {
        const leftConfig = getHomepageConfigForItem(left, homepagePortfolio.itemConfig);
        const rightConfig = getHomepageConfigForItem(right, homepagePortfolio.itemConfig);
        return (leftConfig.homepageOrder || left.order_num) - (rightConfig.homepageOrder || right.order_num);
      });

    const latestItems = [...items].sort((left, right) => right.order_num - left.order_num);
    const selectedItems = [...featuredItems, ...latestItems];
    const graphicsImages = selectedItems.map(toLoaderImage);
    const images = uniqueImages([
      ...graphicsImages,
      ...(loader.imageSource === 'manual' ? manualImages : []),
    ]).slice(0, 12);

    return {
      images:
        images.length > 0
          ? images
          : manualFallbackImages.length > 0
            ? manualFallbackImages
            : fallbackImages(settings),
      settings,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[premium-loader-config]', error);
    }

    return { images: fallbackImages(settings), settings };
  }
});
