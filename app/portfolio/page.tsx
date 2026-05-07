'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';
import GlobalFooter from '@/components/shared/GlobalFooter';
import PortfolioShowcase from '@/components/portfolio/PortfolioShowcase';
import { getGlobalFooterConfig } from '@/lib/footer-content';
import { toSettingMap } from '@/lib/hero-settings';
import {
  createDefaultHomepageBuilderConfig,
} from '@/lib/homepage-content';
import {
  getPortfolioPageBuilderConfig,
  type PortfolioPageBuilderConfig,
} from '@/lib/portfolio-page-content';
import {
  DEFAULT_PORTFOLIO_PAGE_SETTINGS,
  fetchPortfolioDataset,
  getPortfolioPageSettings,
  parsePortfolioItemMetaConfig,
  PORTFOLIO_ITEM_META_SETTING_KEY,
  toPortfolioPreviewItems,
  type PortfolioCategory,
  type PortfolioItemMetaConfigMap,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
} from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PortfolioPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
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
      const [{ data: settingsRows }, { videos, graphics, categories: categoryRows }] = await Promise.all([
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

  if (!pageBuilder.pageEnabled) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: dark ? '#080808' : '#f8fbff',
          color: dark ? '#f8fafc' : '#0f172a',
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'grid',
          placeItems: 'center',
          padding: '120px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 620,
            textAlign: 'center',
            borderRadius: 28,
            padding: '38px 28px',
            border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'}`,
            background: dark
              ? 'linear-gradient(180deg, rgba(15,23,42,0.74), rgba(2,6,23,0.88))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(239,246,255,0.88))',
          }}
        >
          <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            Portfolio Hidden
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 34, fontWeight: 800, letterSpacing: '-0.05em' }}>
            Portfolio page is currently disabled.
          </h1>
          <p style={{ margin: 0, color: dark ? '#94a3b8' : '#475569', lineHeight: 1.75 }}>
            Admin থেকে Portfolio Page Builder ব্যবহার করে visibility চালু করুন।
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
        background: dark ? '#080808' : '#f8fbff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <PortfolioShowcase
        variant="page"
        items={items}
        categories={categories}
        pageSettings={pageSettings}
        pageBuilder={pageBuilder}
        itemMetaConfig={itemMetaConfig}
        loading={loading}
      />
      <GlobalFooter config={footerConfig} isMobile={isMobile} />
    </main>
  );
}
