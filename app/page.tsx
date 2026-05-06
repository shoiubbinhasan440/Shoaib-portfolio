import { createClient } from '@supabase/supabase-js';
import { connection } from 'next/server';
import HomePageClient from '@/components/home/HomePageClient';
import { getAboutSystemConfig } from '@/lib/about-content';
import { getGlobalFooterConfig } from '@/lib/footer-content';
import { getHomepageBuilderConfig } from '@/lib/homepage-content';
import { toSettingMap, type SettingRow } from '@/lib/hero-settings';
import {
  DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS,
  DEFAULT_PORTFOLIO_PAGE_SETTINGS,
  fetchPortfolioDataset,
  getHomepagePortfolioSettings,
  getPortfolioPageSettings,
  parsePortfolioItemMetaConfig,
  PORTFOLIO_ITEM_META_SETTING_KEY,
  type PortfolioCategory,
  type PortfolioGraphic,
  type PortfolioVideo,
} from '@/lib/portfolio-content';

type HomepageInitialData = {
  settingsRows: SettingRow[];
  videos: PortfolioVideo[];
  graphics: PortfolioGraphic[];
  categories: PortfolioCategory[];
};

async function getHomepageInitialData(): Promise<HomepageInitialData> {
  await connection();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      settingsRows: [],
      videos: [],
      graphics: [],
      categories: [],
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [{ data: settingsRows }, dataset] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      fetchPortfolioDataset(supabase),
    ]);

    return {
      settingsRows: ((settingsRows || []) as SettingRow[]),
      videos: dataset.videos,
      graphics: dataset.graphics,
      categories: dataset.categories,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[homepage-initial-data]', error);
    }

    return {
      settingsRows: [],
      videos: [],
      graphics: [],
      categories: [],
    };
  }
}

export default async function HomePage() {
  const { settingsRows, videos, graphics, categories } = await getHomepageInitialData();
  const map = toSettingMap(settingsRows);
  const projectCount = videos.length + graphics.length;
  const runtimeStats = {
    projectCount,
    clientCount: parseInt(map.stat_clients || '50', 10) || 50,
    yearsCount: parseInt(map.stat_years || '3', 10) || 3,
  };
  const homepageBuilder = getHomepageBuilderConfig(map, runtimeStats);
  const homepageBuilderWithFooter = {
    ...homepageBuilder,
    footer: getGlobalFooterConfig(map, runtimeStats),
  };

  return (
    <HomePageClient
      aboutSystem={getAboutSystemConfig(map, {
        projectsValue:
          homepageBuilder.stats.items.find(item => item.id === 'stats-projects')?.value ||
          `${projectCount}+`,
        projectsLabel:
          homepageBuilder.stats.items.find(item => item.id === 'stats-projects')?.label ||
          'Projects',
        clientsValue:
          homepageBuilder.stats.items.find(item => item.id === 'stats-clients')?.value || '50+',
        clientsLabel:
          homepageBuilder.stats.items.find(item => item.id === 'stats-clients')?.label ||
          'Clients',
        yearsValue:
          homepageBuilder.stats.items.find(item => item.id === 'stats-years')?.value || '3+',
        yearsLabel:
          homepageBuilder.stats.items.find(item => item.id === 'stats-years')?.label ||
          'Years Crafting',
      })}
      homepageBuilder={homepageBuilderWithFooter}
      portfolioVideos={videos}
      portfolioGraphics={graphics}
      portfolioCategories={categories}
      homepagePortfolioSettings={
        settingsRows.length > 0 ? getHomepagePortfolioSettings(map) : DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS
      }
      portfolioPageSettings={
        settingsRows.length > 0 ? getPortfolioPageSettings(map) : DEFAULT_PORTFOLIO_PAGE_SETTINGS
      }
      portfolioItemMetaConfig={parsePortfolioItemMetaConfig(
        map[PORTFOLIO_ITEM_META_SETTING_KEY]
      )}
    />
  );
}
