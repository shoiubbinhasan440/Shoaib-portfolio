'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';
import GlobalFooter from '@/components/shared/GlobalFooter';
import PortfolioShowcase from '@/components/portfolio/PortfolioShowcase';
import { getGlobalFooterConfig } from '@/lib/footer-content';
import { toSettingMap } from '@/lib/hero-settings';
import { createDefaultHomepageBuilderConfig } from '@/lib/homepage-content';
import {
  getPortfolioPageBuilderConfig,
  type PortfolioPageBuilderConfig,
} from '@/lib/portfolio-page-content';
import {
  DEFAULT_PORTFOLIO_PAGE_SETTINGS,
  fetchPortfolioDataset,
  getPortfolioCategoryName,
  getPortfolioPageSettings,
  parsePortfolioItemMetaConfig,
  PORTFOLIO_ITEM_META_SETTING_KEY,
  toPortfolioPreviewItems,
  type PortfolioCategory,
  type PortfolioItemMetaConfigMap,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
  type PortfolioSourceType,
} from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function isPortfolioSourceType(value: string): value is PortfolioSourceType {
  return value === 'video' || value === 'graphic';
}

export default function PortfolioCategoryPage() {
  const params = useParams();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const typeParam = normalizeParam(params.type);
  const slugParam = decodeURIComponent(normalizeParam(params.slug));
  const sourceType = isPortfolioSourceType(typeParam) ? typeParam : null;

  const [items, setItems] = useState<PortfolioPreviewItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [pageSettings, setPageSettings] = useState<PortfolioPageSettings>(
    DEFAULT_PORTFOLIO_PAGE_SETTINGS
  );
  const [pageBuilder, setPageBuilder] = useState<PortfolioPageBuilderConfig>(() =>
    getPortfolioPageBuilderConfig({})
  );
  const [itemMetaConfig, setItemMetaConfig] = useState<PortfolioItemMetaConfigMap>({});
  const [footerConfig, setFooterConfig] = useState(() => createDefaultHomepageBuilderConfig().footer);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: settingsRows }, { videos, graphics, categories: categoryRows }] =
        await Promise.all([
          supabase.from('site_settings').select('*'),
          fetchPortfolioDataset(supabase),
        ]);

      if (settingsRows) {
        const map = toSettingMap(settingsRows);
        setPageSettings(getPortfolioPageSettings(map));
        setPageBuilder(getPortfolioPageBuilderConfig(map));
        setItemMetaConfig(parsePortfolioItemMetaConfig(map[PORTFOLIO_ITEM_META_SETTING_KEY]));
        setFooterConfig(
          getGlobalFooterConfig(map, {
            projectCount: videos.length + graphics.length,
          })
        );
      }

      setCategories(categoryRows || []);
      setItems(toPortfolioPreviewItems(videos, graphics, categoryRows || []));
      setLoading(false);
    }

    void load();

    const syncMobile = () => setIsMobile(window.innerWidth < 768);
    syncMobile();
    window.addEventListener('resize', syncMobile);
    return () => window.removeEventListener('resize', syncMobile);
  }, []);

  const categoryItems = useMemo(
    () =>
      sourceType
        ? items.filter(
            item =>
              item.visible &&
              item.categoryActive &&
              item.categoryShowOnPortfolio &&
              item.sourceType === sourceType &&
              item.categorySlug === slugParam
          )
        : [],
    [items, slugParam, sourceType]
  );

  const categoryTitle =
    categoryItems[0]?.categoryName || getPortfolioCategoryName(categories, slugParam);
  const typeLabel = sourceType === 'video' ? 'Video Editing' : 'Graphics Design';
  const scopedPageSettings: PortfolioPageSettings = {
    ...pageSettings,
    title: categoryTitle,
    subtitle: `${typeLabel} category থেকে ${categoryItems.length}টি selected work দেখুন।`,
    tabs: {
      all: {
        ...pageSettings.tabs.all,
        enabled: false,
      },
      video: {
        ...pageSettings.tabs.video,
        enabled: sourceType === 'video',
        label: typeLabel,
      },
      graphic: {
        ...pageSettings.tabs.graphic,
        enabled: sourceType === 'graphic',
        label: typeLabel,
      },
    },
    allTab: {
      ...pageSettings.allTab,
      showVideos: sourceType === 'video',
      showGraphics: sourceType === 'graphic',
    },
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: dark ? '#080808' : '#f8fbff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {sourceType ? (
        <PortfolioShowcase
          variant="page"
          items={categoryItems}
          categories={categories.filter(category => category.slug === slugParam)}
          pageSettings={scopedPageSettings}
          pageBuilder={{
            ...pageBuilder,
            hero: {
              ...pageBuilder.hero,
              title: categoryTitle,
              subtitle: scopedPageSettings.subtitle,
              badge: typeLabel,
            },
          }}
          itemMetaConfig={itemMetaConfig}
          loading={loading}
        />
      ) : (
        <section
          style={{
            minHeight: '70vh',
            display: 'grid',
            placeItems: 'center',
            color: dark ? '#f8fafc' : '#0f172a',
            padding: '120px 24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 34 }}>Category not found</h1>
            <p style={{ margin: 0, color: dark ? '#94a3b8' : '#475569' }}>
              This portfolio category route needs a valid video or graphic type.
            </p>
          </div>
        </section>
      )}
      <GlobalFooter config={footerConfig} isMobile={isMobile} />
    </main>
  );
}
