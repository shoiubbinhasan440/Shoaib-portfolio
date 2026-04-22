'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import PortfolioShowcase from '@/components/portfolio/PortfolioShowcase';
import { toSettingMap } from '@/lib/hero-settings';
import {
  DEFAULT_PORTFOLIO_PAGE_SETTINGS,
  fetchPortfolioDataset,
  getPortfolioPageSettings,
  toPortfolioPreviewItems,
  type PortfolioCategory,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
} from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioPreviewItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [pageSettings, setPageSettings] = useState<PortfolioPageSettings>(
    DEFAULT_PORTFOLIO_PAGE_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: settingsRows }, { videos, graphics, categories: categoryRows }] = await Promise.all([
        supabase.from('site_settings').select('*'),
        fetchPortfolioDataset(supabase),
      ]);

      if (settingsRows) {
        setPageSettings(getPortfolioPageSettings(toSettingMap(settingsRows)));
      }

      setCategories(categoryRows || []);
      setItems(toPortfolioPreviewItems(videos, graphics, categoryRows || []));
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <PortfolioShowcase
      variant="page"
      items={items}
      categories={categories}
      pageSettings={pageSettings}
      loading={loading}
    />
  );
}
