'use client';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminShell from '@/components/admin/AdminShell';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import PageStyleEditor from '@/components/admin/PageStyleEditor';
import { AdminBuilderSection } from '@/components/admin/admin-ui';
import PortfolioShowcase from '@/components/portfolio/PortfolioShowcase';
import {
  ABOUT_SYSTEM_SETTING_KEY,
  getAboutSystemConfig,
  serializeAboutSystemConfig,
  type AboutAlignment,
  type AboutCardItem,
  type AboutLayoutMode,
  type AboutSpacingPreset,
  type AboutStatItem,
  type AboutSystemConfig,
  type AboutWidthPreset,
} from '@/lib/about-content';
import {
  GLOBAL_FOOTER_SETTING_KEY,
  getGlobalFooterConfig,
  serializeGlobalFooterConfig,
} from '@/lib/footer-content';
import {
  DEFAULT_HOMEPAGE_BUILDER_CONFIG,
  HOMEPAGE_BUILDER_SETTING_KEY,
  getHomepageBuilderConfig,
  serializeHomepageBuilderConfig,
  type HomepageAlignment,
  type HomepageBuilderConfig,
  type HomepageContactItem,
  type HomepageFloatingCardPosition,
  type HomepageHeroHeightPreset,
  type HomepageHeroLayout,
  type HomepageLinkItem,
  type HomepageMediaLayout,
  type HomepageMobileContentPosition,
  type HomepageOverlayStrength,
  type HomepageSpacingPreset,
  type HomepageStatItem,
  type HomepageWidthPreset,
} from '@/lib/homepage-content';
import {
  HERO_SETTING_KEYS,
  getHeroImageUpdates,
  serializeStyledSetting,
  toSettingMap,
  type SettingMap,
} from '@/lib/hero-settings';
import {
  DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS,
  DEFAULT_PORTFOLIO_PAGE_SETTINGS,
  HOMEPAGE_PORTFOLIO_SETTING_KEYS,
  HOMEPAGE_PORTFOLIO_SYSTEM_SETTING_KEY,
  fetchPortfolioDataset,
  getHomepageCategoryConfig,
  getHomepageConfigForItem,
  getHomepagePortfolioCategoryKey,
  getHomepagePortfolioItemKey,
  getHomepagePortfolioPreviewItems,
  getHomepagePortfolioSettings,
  getPortfolioPageSettings,
  isHomepageItemAllowed,
  serializeHomepagePortfolioItemConfig,
  serializeHomepagePortfolioSettings,
  toPortfolioPreviewItems,
  type HomepagePortfolioCardStyle,
  type HomepagePortfolioCategoryConfigMap,
  type HomepagePortfolioChipStyle,
  type HomepagePortfolioClickAction,
  type HomepagePortfolioConfigMap,
  type HomepagePortfolioDensity,
  type HomepagePortfolioDisplayMode,
  type HomepagePortfolioFilterAlignment,
  type HomepagePortfolioGap,
  type HomepagePortfolioLayoutType,
  type HomepagePortfolioResponsivePreset,
  type HomepagePortfolioSectionAlignment,
  type HomepagePortfolioSectionSettings,
  type HomepagePortfolioWidth,
  type PortfolioCategory,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
} from '@/lib/portfolio-content';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Option<T extends string> = {
  value: T;
  label: string;
};

const heroLayoutOptions: Option<HomepageHeroLayout>[] = [
  { value: 'split', label: 'Split Layout' },
  { value: 'centered', label: 'Centered Content' },
  { value: 'stacked', label: 'Stacked / Full Focus' },
];

const mediaLayoutOptions: Option<HomepageMediaLayout>[] = [
  { value: 'centered', label: 'Centered' },
  { value: 'split', label: 'Split Layout' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'media-left', label: 'Media Left / Content Right' },
  { value: 'media-right', label: 'Content Left / Media Right' },
];

const alignmentOptions: Option<HomepageAlignment>[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const widthOptions: Option<HomepageWidthPreset | AboutWidthPreset>[] = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' },
];

const aboutWidthOptions: Option<AboutWidthPreset>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' },
];

const spacingOptions: Option<HomepageSpacingPreset | AboutSpacingPreset>[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'spacious', label: 'Spacious' },
];

const aboutLayoutOptions: Option<AboutLayoutMode>[] = [
  { value: 'image-left', label: 'Image Left / Text Right' },
  { value: 'image-right', label: 'Image Right / Text Left' },
  { value: 'centered', label: 'Centered' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'card-left', label: 'Visual Card Left' },
  { value: 'card-right', label: 'Visual Card Right' },
  { value: 'grid', label: 'Grid' },
];

const aboutAlignmentOptions: Option<AboutAlignment>[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const heroHeightOptions: Option<HomepageHeroHeightPreset>[] = [
  { value: 'screen', label: 'First Screen' },
  { value: 'large', label: 'Large' },
  { value: 'medium', label: 'Medium' },
];

const heroOverlayOptions: Option<HomepageOverlayStrength>[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

const mobileContentOptions: Option<HomepageMobileContentPosition>[] = [
  { value: 'bottom', label: 'Bottom Anchored' },
  { value: 'lower', label: 'Lower Third' },
  { value: 'center', label: 'Centered' },
];

const floatingCardOptions: Option<HomepageFloatingCardPosition>[] = [
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'hidden', label: 'Hidden' },
];

const layoutOptions: Array<{ value: HomepagePortfolioLayoutType; label: string }> = [
  { value: 'uniform-grid', label: 'Uniform Grid' },
  { value: 'featured-first', label: 'Featured First' },
  { value: 'compact-preview', label: 'Compact Preview' },
  { value: 'cinematic', label: 'Cinematic Showcase' },
  { value: 'simple-preview', label: 'Simple Preview' },
];

const cardStyleOptions: Array<{ value: HomepagePortfolioCardStyle; label: string }> = [
  { value: 'minimal-premium', label: 'Minimal Premium' },
  { value: 'cinematic-overlay', label: 'Cinematic Overlay' },
  { value: 'glass-bordered', label: 'Bordered Glass' },
  { value: 'dark-editorial', label: 'Dark Editorial' },
  { value: 'light-polished', label: 'Light Polished' },
];

const portfolioAlignmentOptions: Array<{ value: HomepagePortfolioSectionAlignment; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
];

const filterAlignmentOptions: Array<{ value: HomepagePortfolioFilterAlignment; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
];

const containerWidthOptions: Array<{ value: HomepagePortfolioWidth; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' },
];

const densityOptions: Array<{ value: HomepagePortfolioDensity; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'spacious', label: 'Spacious' },
];

const gapOptions: Array<{ value: HomepagePortfolioGap; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const responsiveOptions: Array<{ value: HomepagePortfolioResponsivePreset; label: string }> = [
  { value: 'compact', label: 'Responsive Compact' },
  { value: 'balanced', label: 'Responsive Balanced' },
  { value: 'showcase', label: 'Responsive Showcase' },
];

const clickActionOptions: Array<{ value: HomepagePortfolioClickAction; label: string }> = [
  { value: 'preview', label: 'Open Preview Modal' },
  { value: 'portfolio', label: 'Go to Portfolio Page' },
  { value: 'preview-with-link', label: 'Preview + Portfolio Link' },
];

const chipStyleOptions: Array<{ value: HomepagePortfolioChipStyle; label: string }> = [
  { value: 'soft', label: 'Soft' },
  { value: 'glass', label: 'Glass' },
  { value: 'editorial', label: 'Editorial' },
];

const displayModeOptions: Array<{ value: HomepagePortfolioDisplayMode; label: string }> = [
  { value: 'item-grid', label: 'Item Grid' },
  { value: 'category-preview', label: 'Category Preview' },
];

const footerLayoutOptions: Option<HomepageBuilderConfig['footer']['layout']>[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'stacked', label: 'Stacked' },
];

const panelStyle: CSSProperties = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.14)',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 18px 46px rgba(2,6,23,0.22)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  background: '#020617',
  border: '1px solid rgba(148,163,184,0.16)',
  borderRadius: 12,
  color: '#fff',
  padding: '10px 12px',
  fontSize: 14,
  boxSizing: 'border-box',
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 100,
  fontFamily: 'inherit',
};

const fileStyle: CSSProperties = {
  width: '100%',
  color: '#cbd5e1',
  fontSize: 13,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  marginBottom: 6,
  fontWeight: 600,
};

const helperStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createStatItem(prefix: string, icon = '✨'): HomepageStatItem {
  return {
    id: makeId(prefix),
    icon,
    value: '',
    label: '',
    description: '',
    enabled: true,
    order: 1,
  };
}

function createLinkItem(prefix: string): HomepageLinkItem {
  return {
    id: makeId(prefix),
    label: '',
    url: '',
    enabled: true,
    order: 1,
  };
}

function createContactItem(): HomepageContactItem {
  return {
    id: makeId('contact'),
    icon: '📍',
    label: '',
    value: '',
    enabled: true,
    order: 1,
  };
}

function createAboutStat(): AboutStatItem {
  return {
    id: makeId('about-stat'),
    icon: '✨',
    value: '',
    label: '',
  };
}

function createAboutCard(): AboutCardItem {
  return {
    id: makeId('about-card'),
    icon: '🎬',
    title: '',
    subtitle: '',
    description: '',
    image: '',
  };
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function getNextOrder(items: Array<{ order: number }>) {
  return items.length > 0 ? Math.max(...items.map(item => item.order)) + 1 : 1;
}

function extractNumericValue(value: string, fallback: number) {
  const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function nextOrderFromConfig(items: PortfolioPreviewItem[], configMap: HomepagePortfolioConfigMap) {
  const usedOrders = items
    .map(item => getHomepageConfigForItem(item, configMap))
    .filter(config => config.showOnHomepage)
    .map(config => config.homepageOrder);

  return usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 1;
}

function BuilderPanel({
  title,
  badge,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  badge?: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <AdminBuilderSection
      title={title}
      badge={badge}
      description={description}
      defaultCollapsed={!defaultOpen}
      tabs={[
        {
          id: 'content',
          label: 'Content',
          description:
            'All controls for this homepage section stay inside one unified builder container.',
          content: children,
        },
      ]}
    />
  );
}

function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : undefined}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
      {hint ? <div style={{ ...helperStyle, marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

function MediaField({
  label,
  value,
  onChange,
  onFileSelected,
  uploading,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFileSelected: (file: File) => void;
  uploading?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      {value ? (
        <div
          style={{
            width: '100%',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(148,163,184,0.14)',
            marginBottom: 12,
          }}
        >
          <img
            src={value}
            alt={label}
            style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : null}
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
        placeholder="Paste image URL"
      />
      <div style={{ height: 10 }} />
      <input
        type="file"
        accept="image/*"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
          event.currentTarget.value = '';
        }}
        style={fileStyle}
      />
      <div style={{ ...helperStyle, marginTop: 6 }}>
        {uploading ? 'Uploading image...' : hint || 'You can paste a URL or upload a new media asset.'}
      </div>
    </div>
  );
}

export default function AdminHomepageBuilderPage() {
  const router = useRouter();
  const [homepageBuilder, setHomepageBuilder] = useState<HomepageBuilderConfig>(
    DEFAULT_HOMEPAGE_BUILDER_CONFIG
  );
  const [aboutSystem, setAboutSystem] = useState<AboutSystemConfig | null>(null);
  const [portfolioConfig, setPortfolioConfig] = useState<HomepagePortfolioSectionSettings>(
    DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS
  );
  const [items, setItems] = useState<PortfolioPreviewItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [pageSettings, setPageSettings] = useState<PortfolioPageSettings>(
    DEFAULT_PORTFOLIO_PAGE_SETTINGS
  );
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [itemFilter, setItemFilter] = useState<'all' | 'homepage' | 'video' | 'graphic'>(
    'homepage'
  );
  const [uploadingField, setUploadingField] = useState('');

  async function loadBuilder() {
    const [{ data: settingsRows }, dataset] = await Promise.all([
      supabase.from('site_settings').select('*'),
      fetchPortfolioDataset(supabase, { includeHidden: true }),
    ]);

    const map = toSettingMap(settingsRows || []);
    const previewItems = toPortfolioPreviewItems(
      dataset.videos,
      dataset.graphics,
      dataset.categories
    );
    const projectCount = dataset.videos.length + dataset.graphics.length;
    const clientCount = extractNumericValue(map[HERO_SETTING_KEYS.statClients] || '50', 50);
    const yearsCount = extractNumericValue(map[HERO_SETTING_KEYS.statYears] || '3', 3);
    const runtimeStats = {
      projectCount,
      clientCount,
      yearsCount,
    };
    const builder = getHomepageBuilderConfig(map, runtimeStats);
    const footer = getGlobalFooterConfig(map, runtimeStats);

    setRawSettings(map);
    setHomepageBuilder({
      ...builder,
      footer,
    });
    setAboutSystem(
      getAboutSystemConfig(map, {
        projectsValue:
          builder.stats.items.find(item => item.id === 'stats-projects')?.value ||
          `${projectCount}+`,
        projectsLabel:
          builder.stats.items.find(item => item.id === 'stats-projects')?.label || 'Projects',
        clientsValue:
          builder.stats.items.find(item => item.id === 'stats-clients')?.value || '50+',
        clientsLabel:
          builder.stats.items.find(item => item.id === 'stats-clients')?.label || 'Clients',
        yearsValue: builder.stats.items.find(item => item.id === 'stats-years')?.value || '3+',
        yearsLabel:
          builder.stats.items.find(item => item.id === 'stats-years')?.label ||
          'Years Crafting',
      })
    );
    setPortfolioConfig(getHomepagePortfolioSettings(map));
    setItems(previewItems);
    setCategories(dataset.categories || []);
    setPageSettings(getPortfolioPageSettings(map));
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        await loadBuilder();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Homepage builder load failed.';
        setMessage(`❌ ${msg}`);
      } finally {
        setLoading(false);
      }
    }

    async function verifyAndBoot() {
      const ok = await verifyAdminSessionClient();
      if (!active) {
        return;
      }
      if (!ok) {
        router.replace('/admin/login');
        return;
      }
      await boot();
    }

    void verifyAndBoot();

    return () => {
      active = false;
    };
  }, [router]);

  const duplicateOrders = useMemo(() => {
    const orderMap = new Map<number, string[]>();

    items.forEach(item => {
      const itemConfig = getHomepageConfigForItem(item, portfolioConfig.itemConfig);
      if (!itemConfig.showOnHomepage) {
        return;
      }

      const current = orderMap.get(itemConfig.homepageOrder) || [];
      current.push(getHomepagePortfolioItemKey(item.sourceType, item.id));
      orderMap.set(itemConfig.homepageOrder, current);
    });

    return new Map([...orderMap.entries()].filter(([, keys]) => keys.length > 1));
  }, [items, portfolioConfig.itemConfig]);

  const previewItems = useMemo(
    () =>
      getHomepagePortfolioPreviewItems(items, {
        itemConfig: portfolioConfig.itemConfig,
        itemLimit: portfolioConfig.itemLimit,
        showVideos: portfolioConfig.showVideos,
        showGraphics: portfolioConfig.showGraphics,
        categoryConfig: portfolioConfig.categoryConfig,
      }),
    [items, portfolioConfig]
  );

  const categoryPreviewItems = useMemo(
    () =>
      items.filter(item =>
        isHomepageItemAllowed(item, {
          itemConfig: portfolioConfig.itemConfig,
          showVideos: portfolioConfig.showVideos,
          showGraphics: portfolioConfig.showGraphics,
          categoryConfig: portfolioConfig.categoryConfig,
        })
      ),
    [items, portfolioConfig]
  );

  const categoryRows = useMemo(
    () =>
      categories
        .map(category => ({
          category,
          homepage: getHomepageCategoryConfig(category, portfolioConfig.categoryConfig),
        }))
        .sort((leftItem, rightItem) => {
          if (leftItem.homepage.order !== rightItem.homepage.order) {
            return leftItem.homepage.order - rightItem.homepage.order;
          }

          return leftItem.homepage.label.localeCompare(rightItem.homepage.label);
        }),
    [categories, portfolioConfig.categoryConfig]
  );

  const filteredItems = useMemo(() => {
    const sortedItems = [...items].sort((leftItem, rightItem) => {
      const leftConfig = getHomepageConfigForItem(leftItem, portfolioConfig.itemConfig);
      const rightConfig = getHomepageConfigForItem(rightItem, portfolioConfig.itemConfig);

      if (leftConfig.homepageOrder !== rightConfig.homepageOrder) {
        return leftConfig.homepageOrder - rightConfig.homepageOrder;
      }

      if (leftItem.sourceType !== rightItem.sourceType) {
        return leftItem.sourceType.localeCompare(rightItem.sourceType);
      }

      return leftItem.title.localeCompare(rightItem.title);
    });

    return sortedItems.filter(item => {
      const itemConfig = getHomepageConfigForItem(item, portfolioConfig.itemConfig);

      if (itemFilter === 'homepage') {
        return itemConfig.showOnHomepage;
      }

      if (itemFilter === 'video') {
        return item.sourceType === 'video';
      }

      if (itemFilter === 'graphic') {
        return item.sourceType === 'graphic';
      }

      return true;
    });
  }, [itemFilter, items, portfolioConfig.itemConfig]);

  const homepageVisibleCount = items.filter(item =>
    getHomepageConfigForItem(item, portfolioConfig.itemConfig).showOnHomepage
  ).length;
  const nextHomepageOrder = nextOrderFromConfig(items, portfolioConfig.itemConfig);
  const activeCategoriesCount = categoryRows.filter(entry => entry.homepage.enabled).length;
  const homepageAbout = aboutSystem?.homepage;
  const sectionEntries = useMemo(
    () =>
      homepageAbout
        ? [
            {
              key: 'hero',
              label: 'Hero',
              enabled: homepageBuilder.hero.enabled,
              order: homepageBuilder.hero.order,
            },
            {
              key: 'portfolio',
              label: 'Portfolio Preview',
              enabled: portfolioConfig.enabled,
              order: portfolioConfig.order,
            },
            {
              key: 'about',
              label: 'About Preview',
              enabled: homepageAbout.enabled,
              order: homepageAbout.order,
            },
            {
              key: 'showreel',
              label: 'Showreel',
              enabled: homepageBuilder.showreel.enabled,
              order: homepageBuilder.showreel.order,
            },
            {
              key: 'stats',
              label: 'Stats',
              enabled: homepageBuilder.stats.enabled,
              order: homepageBuilder.stats.order,
            },
            {
              key: 'cta',
              label: 'CTA',
              enabled: homepageBuilder.cta.enabled,
              order: homepageBuilder.cta.order,
            },
            {
              key: 'footer',
              label: 'Footer',
              enabled: homepageBuilder.footer.enabled,
              order: homepageBuilder.footer.order,
            },
          ]
        : [],
    [
      homepageAbout,
      homepageBuilder.cta.enabled,
      homepageBuilder.cta.order,
      homepageBuilder.footer.enabled,
      homepageBuilder.footer.order,
      homepageBuilder.hero.enabled,
      homepageBuilder.hero.order,
      homepageBuilder.showreel.enabled,
      homepageBuilder.showreel.order,
      homepageBuilder.stats.enabled,
      homepageBuilder.stats.order,
      portfolioConfig.enabled,
      portfolioConfig.order,
    ]
  );

  const sectionOrderConflicts = useMemo(() => {
    const map = new Map<number, string[]>();
    sectionEntries.forEach(section => {
      const current = map.get(section.order) || [];
      current.push(section.label);
      map.set(section.order, current);
    });
    return new Map([...map.entries()].filter(([, labels]) => labels.length > 1));
  }, [sectionEntries]);

  function updateGlobal<K extends keyof HomepageBuilderConfig['global']>(
    key: K,
    value: HomepageBuilderConfig['global'][K]
  ) {
    setHomepageBuilder(current => ({
      ...current,
      global: {
        ...current.global,
        [key]: value,
      },
    }));
  }

  function updateHero<K extends keyof HomepageBuilderConfig['hero']>(
    key: K,
    value: HomepageBuilderConfig['hero'][K]
  ) {
    setHomepageBuilder(current => ({
      ...current,
      hero: {
        ...current.hero,
        [key]: value,
      },
    }));
  }

  function updateHeroStat(index: number, patch: Partial<HomepageStatItem>) {
    setHomepageBuilder(current => ({
      ...current,
      hero: {
        ...current.hero,
        stats: current.hero.stats.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item
        ),
      },
    }));
  }

  function updateShowreel<K extends keyof HomepageBuilderConfig['showreel']>(
    key: K,
    value: HomepageBuilderConfig['showreel'][K]
  ) {
    setHomepageBuilder(current => ({
      ...current,
      showreel: {
        ...current.showreel,
        [key]: value,
      },
    }));
  }

  function updateStats<K extends keyof HomepageBuilderConfig['stats']>(
    key: K,
    value: HomepageBuilderConfig['stats'][K]
  ) {
    setHomepageBuilder(current => ({
      ...current,
      stats: {
        ...current.stats,
        [key]: value,
      },
    }));
  }

  function updateHomepageStat(index: number, patch: Partial<HomepageStatItem>) {
    setHomepageBuilder(current => ({
      ...current,
      stats: {
        ...current.stats,
        items: current.stats.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item
        ),
      },
    }));
  }

  function updateCta<K extends keyof HomepageBuilderConfig['cta']>(
    key: K,
    value: HomepageBuilderConfig['cta'][K]
  ) {
    setHomepageBuilder(current => ({
      ...current,
      cta: {
        ...current.cta,
        [key]: value,
      },
    }));
  }

  function updateFooter<K extends keyof HomepageBuilderConfig['footer']>(
    key: K,
    value: HomepageBuilderConfig['footer'][K]
  ) {
    setHomepageBuilder(current => ({
      ...current,
      footer: {
        ...current.footer,
        [key]: value,
      },
    }));
  }

  function updateHomepageAbout<K extends keyof AboutSystemConfig['homepage']>(
    key: K,
    value: AboutSystemConfig['homepage'][K]
  ) {
    setAboutSystem(current =>
      current
        ? {
            ...current,
            homepage: {
              ...current.homepage,
              [key]: value,
            },
          }
        : current
    );
  }

  function updateHomepageAboutStat(index: number, patch: Partial<AboutStatItem>) {
    setAboutSystem(current =>
      current
        ? {
            ...current,
            homepage: {
              ...current.homepage,
              stats: current.homepage.stats.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
              ),
            },
          }
        : current
    );
  }

  function updateHomepageAboutCard(index: number, patch: Partial<AboutCardItem>) {
    setAboutSystem(current =>
      current
        ? {
            ...current,
            homepage: {
              ...current.homepage,
              cards: current.homepage.cards.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
              ),
            },
          }
        : current
    );
  }

  function updatePortfolio<K extends keyof HomepagePortfolioSectionSettings>(
    key: K,
    value: HomepagePortfolioSectionSettings[K]
  ) {
    setPortfolioConfig(current => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCategory(
    category: PortfolioCategory,
    patch: Partial<HomepagePortfolioCategoryConfigMap[string]>
  ) {
    const key = getHomepagePortfolioCategoryKey(category.type, category.slug);
    const fallback = getHomepageCategoryConfig(category, portfolioConfig.categoryConfig);

    setPortfolioConfig(current => ({
      ...current,
      categoryConfig: {
        ...current.categoryConfig,
        [key]: {
          enabled: patch.enabled ?? fallback.enabled,
          order: patch.order ?? fallback.order,
          label: patch.label ?? fallback.label,
        },
      },
    }));
  }

  function updateItem(
    item: PortfolioPreviewItem,
    patch: Partial<HomepagePortfolioConfigMap[string]>
  ) {
    const key = getHomepagePortfolioItemKey(item.sourceType, item.id);
    const fallback = getHomepageConfigForItem(item, portfolioConfig.itemConfig);

    setPortfolioConfig(current => ({
      ...current,
      itemConfig: {
        ...current.itemConfig,
        [key]: {
          showOnHomepage: patch.showOnHomepage ?? fallback.showOnHomepage,
          homepageOrder: patch.homepageOrder ?? fallback.homepageOrder,
          homepageFeatured: patch.homepageFeatured ?? fallback.homepageFeatured,
          previewEnabled: patch.previewEnabled ?? fallback.previewEnabled,
        },
      },
    }));
  }

  async function uploadMedia(file: File, folder: string) {
    const ext = file.name.split('.').pop();
    const path = `homepage-builder/${folder}-${Date.now()}.${ext}`;
    const { publicUrl } = await adminUploadFile('media', path, file);
    return publicUrl;
  }

  async function handleImageUpload(
    field: string,
    folder: string,
    apply: (url: string) => void,
    file: File
  ) {
    setUploadingField(field);
    try {
      const url = await uploadMedia(file, folder);
      apply(url);
      setMessage('✅ Media uploaded. Save builder to publish it on the homepage.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Media upload failed.';
      setMessage(`❌ ${msg}`);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setUploadingField('');
    }
  }

  async function saveBuilder() {
    if (!aboutSystem) {
      return;
    }

    if (portfolioConfig.enabled && !portfolioConfig.showVideos && !portfolioConfig.showGraphics) {
      setMessage('❌ Homepage portfolio section-এর জন্য অন্তত একটি content type চালু রাখুন।');
      return;
    }

    if (duplicateOrders.size > 0) {
      const [order, keys] = duplicateOrders.entries().next().value as [number, string[]];
      setMessage(
        `❌ Homepage item order ${order} একাধিক item ব্যবহার করছে (${keys.length} items).`
      );
      return;
    }

    if (sectionOrderConflicts.size > 0) {
      const [order, labels] = sectionOrderConflicts.entries().next().value as [
        number,
        string[],
      ];
      setMessage(`❌ Homepage section order ${order} একাধিক section ব্যবহার করছে (${labels.join(', ')}).`);
      return;
    }

    const sortedStats = sortByOrder(homepageBuilder.stats.items);
    const projectsStat =
      sortedStats.find(item => item.id.includes('projects')) || sortedStats[0];
    const clientsStat =
      sortedStats.find(item => item.id.includes('clients')) || sortedStats[1];
    const yearsStat = sortedStats.find(item => item.id.includes('years')) || sortedStats[2];

    const updates = new Map<string, string>();
    const syncUpdate = (key: string, value: string) => {
      updates.set(key, value);
    };

    syncUpdate(
      HOMEPAGE_BUILDER_SETTING_KEY,
      serializeHomepageBuilderConfig(homepageBuilder)
    );
    syncUpdate(
      GLOBAL_FOOTER_SETTING_KEY,
      serializeGlobalFooterConfig(homepageBuilder.footer)
    );
    syncUpdate(ABOUT_SYSTEM_SETTING_KEY, serializeAboutSystemConfig(aboutSystem));
    syncUpdate(
      HOMEPAGE_PORTFOLIO_SYSTEM_SETTING_KEY,
      serializeHomepagePortfolioSettings(portfolioConfig)
    );
    syncUpdate(
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig,
      serializeHomepagePortfolioItemConfig(portfolioConfig.itemConfig)
    );
    syncUpdate(HOMEPAGE_PORTFOLIO_SETTING_KEYS.enabled, String(portfolioConfig.enabled));
    syncUpdate(HOMEPAGE_PORTFOLIO_SETTING_KEYS.badge, portfolioConfig.badge);
    syncUpdate(HOMEPAGE_PORTFOLIO_SETTING_KEYS.title, portfolioConfig.title);
    syncUpdate(HOMEPAGE_PORTFOLIO_SETTING_KEYS.subtitle, portfolioConfig.subtitle);
    syncUpdate(
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemLimit,
      String(portfolioConfig.itemLimit)
    );
    syncUpdate(HOMEPAGE_PORTFOLIO_SETTING_KEYS.buttonText, portfolioConfig.buttonText);
    syncUpdate(HOMEPAGE_PORTFOLIO_SETTING_KEYS.buttonLink, portfolioConfig.buttonLink);
    syncUpdate(
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyBadge,
      serializeStyledSetting(rawSettings[HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyBadge], portfolioConfig.badge)
    );
    syncUpdate(
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyTitle,
      serializeStyledSetting(rawSettings[HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyTitle], portfolioConfig.title)
    );
    syncUpdate(
      HERO_SETTING_KEYS.badge,
      serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.badge], homepageBuilder.hero.badge)
    );
    syncUpdate(
      HERO_SETTING_KEYS.title,
      serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.title], homepageBuilder.hero.title)
    );
    syncUpdate(
      HERO_SETTING_KEYS.subtitle,
      serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.subtitle], homepageBuilder.hero.subtitle)
    );
    syncUpdate(
      HERO_SETTING_KEYS.primaryCta,
      serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.primaryCta], homepageBuilder.hero.primaryButtonText)
    );
    syncUpdate(HERO_SETTING_KEYS.showreelUrl, homepageBuilder.showreel.videoUrl);
    syncUpdate(
      HERO_SETTING_KEYS.statClients,
      String(extractNumericValue(clientsStat?.value || '50', 50))
    );
    syncUpdate(
      HERO_SETTING_KEYS.statYears,
      String(extractNumericValue(yearsStat?.value || '3', 3))
    );
    syncUpdate(
      'showreel_eyebrow',
      serializeStyledSetting(rawSettings.showreel_eyebrow, homepageBuilder.showreel.label)
    );
    syncUpdate(
      'showreel_title',
      serializeStyledSetting(rawSettings.showreel_title, homepageBuilder.showreel.title)
    );
    syncUpdate(
      'footer_copy',
      serializeStyledSetting(rawSettings.footer_copy, homepageBuilder.footer.copyrightText)
    );
    syncUpdate(
      'stat1_label',
      serializeStyledSetting(rawSettings.stat1_label, projectsStat?.label || 'Projects')
    );
    syncUpdate(
      'stat2_label',
      serializeStyledSetting(rawSettings.stat2_label, clientsStat?.label || 'Clients')
    );
    syncUpdate(
      'stat3_label',
      serializeStyledSetting(rawSettings.stat3_label, yearsStat?.label || 'Years Crafting')
    );

    getHeroImageUpdates(
      homepageBuilder.hero.desktopImage,
      homepageBuilder.hero.mobileImage
    ).forEach(update => {
      syncUpdate(update.key, update.value);
    });

    setSaving(true);
    try {
      await Promise.all(
        [...updates.entries()].map(([key, value]) => writeSiteSetting(supabase, key, value))
      );
      await loadBuilder();
      setMessage('✅ Full homepage builder saved successfully.');
      setTimeout(() => setMessage(''), 3500);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Homepage builder save failed.';
      setMessage(`❌ ${msg}`);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !aboutSystem || !homepageAbout) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Homepage Builder লোড হচ্ছে...
      </div>
    );
  }

  return (
    <AdminShell
      eyebrow="Homepage Builder"
      title="Full homepage control from hero to footer"
      description="Hero, showreel, stats, CTA, homepage portfolio, about block, and footer handoff stay in one page-builder area instead of being mixed into Settings."
      actions={
        <>
          <button
            onClick={() => router.push('/')}
            type="button"
            style={{
              background: '#0b1120',
              color: '#7dd3fc',
              border: '1px solid rgba(56,189,248,0.2)',
              padding: '11px 14px',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            Open Homepage
          </button>
          <button
            onClick={() => void saveBuilder()}
            disabled={saving}
            type="button"
            style={{
              background: saving
                ? '#1e293b'
                : 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: 14,
              boxShadow: '0 18px 34px rgba(37,99,235,0.24)',
            }}
          >
            {saving ? 'Saving...' : 'Save Homepage Builder'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 20 }}>
        {message ? (
          <div
            style={{
              background: message.startsWith('✅')
                ? 'rgba(22,163,74,0.14)'
                : 'rgba(127,29,29,0.18)',
              color: message.startsWith('✅') ? '#86efac' : '#fecaca',
              border: `1px solid ${
                message.startsWith('✅')
                  ? 'rgba(34,197,94,0.24)'
                  : 'rgba(248,113,113,0.24)'
              }`,
              borderRadius: 16,
              padding: '14px 16px',
              fontSize: 14,
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {[
            {
              label: 'Enabled Sections',
              value: sectionEntries.filter(section => section.enabled).length,
              tone: '#38bdf8',
            },
            {
              label: 'Homepage Portfolio Items',
              value: homepageVisibleCount,
              tone: '#34d399',
            },
            {
              label: 'Enabled Categories',
              value: activeCategoriesCount,
              tone: '#a78bfa',
            },
            {
              label: 'Next Portfolio Order',
              value: nextHomepageOrder,
              tone: '#f59e0b',
            },
          ].map(card => (
            <div key={card.label} style={{ ...panelStyle, padding: 18 }}>
              <div
                style={{
                  color: card.tone,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <BuilderPanel
          title="Global homepage settings"
          badge="Core"
          description="Shared defaults, section spacing rhythm and the master order overview এখান থেকে manage হবে।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Default content width">
              <select
                value={homepageBuilder.global.contentWidth}
                onChange={event =>
                  updateGlobal('contentWidth', event.target.value as HomepageBuilderConfig['global']['contentWidth'])
                }
                style={inputStyle}
              >
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default section spacing">
              <select
                value={homepageBuilder.global.sectionSpacing}
                onChange={event =>
                  updateGlobal(
                    'sectionSpacing',
                    event.target.value as HomepageBuilderConfig['global']['sectionSpacing']
                  )
                }
                style={inputStyle}
              >
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'end' }}>
              <input
                type="checkbox"
                checked={homepageBuilder.global.themeSafeMode}
                onChange={event => updateGlobal('themeSafeMode', event.target.checked)}
              />
              <span>Keep dark / light theme-safe rendering active</span>
            </label>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ ...fieldLabelStyle, marginBottom: 10 }}>Current homepage section order</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {sortByOrder(sectionEntries).map(section => (
              <div
                key={section.key}
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: '#020617',
                  border: '1px solid rgba(148,163,184,0.14)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800 }}>{section.label}</div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: section.enabled
                        ? 'rgba(22,163,74,0.12)'
                        : 'rgba(148,163,184,0.12)',
                      color: section.enabled ? '#86efac' : '#cbd5e1',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {section.enabled ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Order: {section.order}</div>
              </div>
            ))}
          </div>
          {sectionOrderConflicts.size > 0 ? (
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(127,29,29,0.18)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#fecaca',
                fontSize: 13,
              }}
            >
              Duplicate section order detected. Save is blocked until every homepage section uses a unique order value.
            </div>
          ) : null}
        </BuilderPanel>

        <AdminBuilderSection
          title="Hero section"
          badge={homepageBuilder.hero.enabled ? 'Visible' : 'Hidden'}
          description="Hero content, media, overlays, CTA buttons, stats and floating cinematic card এখান থেকে fully control হবে।"
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={homepageBuilder.hero.order}
                  onChange={event => updateHero('order', Number(event.target.value) || 10)}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={homepageBuilder.hero.enabled}
                  onChange={event => updateHero('enabled', event.target.checked)}
                />
                <span>{homepageBuilder.hero.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Headings, button copy, floating-card text, and visibility toggles stay together.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showBadge} onChange={event => updateHero('showBadge', event.target.checked)} />
                    <span>Show badge / label</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showSubtitle} onChange={event => updateHero('showSubtitle', event.target.checked)} />
                    <span>Show subtitle</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showPrimaryButton} onChange={event => updateHero('showPrimaryButton', event.target.checked)} />
                    <span>Show primary CTA</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showSecondaryButton} onChange={event => updateHero('showSecondaryButton', event.target.checked)} />
                    <span>Show secondary CTA</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showShowreelButton} onChange={event => updateHero('showShowreelButton', event.target.checked)} />
                    <span>Show showreel CTA</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showFloatingCard} onChange={event => updateHero('showFloatingCard', event.target.checked)} />
                    <span>Show floating info card</span>
                  </label>
                  <Field label="Hero badge" full>
                    <input value={homepageBuilder.hero.badge} onChange={event => updateHero('badge', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Hero title" full>
                    <textarea value={homepageBuilder.hero.title} onChange={event => updateHero('title', event.target.value)} style={{ ...textareaStyle, minHeight: 92 }} />
                  </Field>
                  <Field label="Hero subtitle" full>
                    <textarea value={homepageBuilder.hero.subtitle} onChange={event => updateHero('subtitle', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Primary CTA text">
                    <input value={homepageBuilder.hero.primaryButtonText} onChange={event => updateHero('primaryButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Primary CTA link">
                    <input value={homepageBuilder.hero.primaryButtonLink} onChange={event => updateHero('primaryButtonLink', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Secondary CTA text">
                    <input value={homepageBuilder.hero.secondaryButtonText} onChange={event => updateHero('secondaryButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Secondary CTA link">
                    <input value={homepageBuilder.hero.secondaryButtonLink} onChange={event => updateHero('secondaryButtonLink', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Showreel CTA text">
                    <input value={homepageBuilder.hero.showreelButtonText} onChange={event => updateHero('showreelButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Floating card eyebrow">
                    <input value={homepageBuilder.hero.floatingCardEyebrow} onChange={event => updateHero('floatingCardEyebrow', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Floating card text" full>
                    <textarea value={homepageBuilder.hero.floatingCardText} onChange={event => updateHero('floatingCardText', event.target.value)} style={textareaStyle} />
                  </Field>
                </div>
              ),
            },
            {
              id: 'media',
              label: 'Media',
              description: 'Desktop and mobile hero image uploads stay inside the hero section.',
              content: (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <MediaField
                      label="Desktop hero image"
                      value={homepageBuilder.hero.desktopImage}
                      onChange={value => updateHero('desktopImage', value)}
                      onFileSelected={file =>
                        void handleImageUpload(
                          'hero-desktop',
                          'hero-desktop',
                          url => updateHero('desktopImage', url),
                          file
                        )
                      }
                      uploading={uploadingField === 'hero-desktop'}
                      hint="Landscape image recommended for desktop hero."
                    />
                    <MediaField
                      label="Mobile hero image"
                      value={homepageBuilder.hero.mobileImage}
                      onChange={value => updateHero('mobileImage', value)}
                      onFileSelected={file =>
                        void handleImageUpload(
                          'hero-mobile',
                          'hero-mobile',
                          url => updateHero('mobileImage', url),
                          file
                        )
                      }
                      uploading={uploadingField === 'hero-mobile'}
                      hint="Portrait / vertical image recommended for mobile hero."
                    />
                  </div>
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Layout, spacing, overlay, mobile position, and floating-card placement stay grouped.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Hero layout">
                    <select value={homepageBuilder.hero.layout} onChange={event => updateHero('layout', event.target.value as HomepageHeroLayout)} style={inputStyle}>
                      {heroLayoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Text alignment">
                    <select value={homepageBuilder.hero.alignment} onChange={event => updateHero('alignment', event.target.value as HomepageAlignment)} style={inputStyle}>
                      {alignmentOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Section width">
                    <select value={homepageBuilder.hero.width} onChange={event => updateHero('width', event.target.value as HomepageWidthPreset)} style={inputStyle}>
                      {widthOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Spacing preset">
                    <select value={homepageBuilder.hero.spacing} onChange={event => updateHero('spacing', event.target.value as HomepageSpacingPreset)} style={inputStyle}>
                      {spacingOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Content max width">
                    <input type="number" min={320} max={760} value={homepageBuilder.hero.contentMaxWidth} onChange={event => updateHero('contentMaxWidth', Number(event.target.value) || 540)} style={inputStyle} />
                  </Field>
                  <Field label="Hero height">
                    <select value={homepageBuilder.hero.heightPreset} onChange={event => updateHero('heightPreset', event.target.value as HomepageHeroHeightPreset)} style={inputStyle}>
                      {heroHeightOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Mobile content position">
                    <select value={homepageBuilder.hero.mobileContentPosition} onChange={event => updateHero('mobileContentPosition', event.target.value as HomepageMobileContentPosition)} style={inputStyle}>
                      {mobileContentOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Overlay strength">
                    <select value={homepageBuilder.hero.overlayStrength} onChange={event => updateHero('overlayStrength', event.target.value as HomepageOverlayStrength)} style={inputStyle}>
                      {heroOverlayOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Floating card position">
                    <select value={homepageBuilder.hero.floatingCardPosition} onChange={event => updateHero('floatingCardPosition', event.target.value as HomepageFloatingCardPosition)} style={inputStyle}>
                      {floatingCardOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showBottomOverlay} onChange={event => updateHero('showBottomOverlay', event.target.checked)} />
                    <span>Keep bottom cinematic overlay</span>
                  </label>
                </div>
              ),
            },
            {
              id: 'stats',
              label: 'Stats',
              description: 'Hero stats and stat visibility now stay inside the hero section itself.',
              content: (
                <div style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={homepageBuilder.hero.showStats} onChange={event => updateHero('showStats', event.target.checked)} />
                    <span>Show hero stats</span>
                  </label>
                  {homepageBuilder.hero.stats.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: '1px solid rgba(148,163,184,0.14)',
                        background: '#020617',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={item.enabled} onChange={event => updateHeroStat(index, { enabled: event.target.checked })} />
                        <span>Visible</span>
                      </label>
                      <input value={item.icon || ''} onChange={event => updateHeroStat(index, { icon: event.target.value })} style={inputStyle} placeholder="Icon" />
                      <input value={item.value} onChange={event => updateHeroStat(index, { value: event.target.value })} style={inputStyle} placeholder="Value" />
                      <input value={item.label} onChange={event => updateHeroStat(index, { label: event.target.value })} style={inputStyle} placeholder="Label" />
                      <input
                        type="number"
                        value={item.order}
                        onChange={event => updateHeroStat(index, { order: Number(event.target.value) || index + 1 })}
                        style={inputStyle}
                        placeholder="Order"
                      />
                    </div>
                  ))}
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Typography, colors, buttons, and advanced hero styling stay inside the hero card.',
              content: (
                <PageStyleEditor
                  title="Hero styling"
                  description="Customize the homepage hero typography, overlay-facing colors, CTA button treatment, and content width."
                  value={homepageBuilder.hero.styles}
                  onChange={nextValue => updateHero('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <BuilderPanel
          title="Homepage portfolio section"
          badge={portfolioConfig.enabled ? 'Visible' : 'Hidden'}
          description="Shared portfolio system-এর curated homepage preview. Main portfolio items, category logic, preview modal আর card presentation সব এখান থেকে control হবে।"
        >
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={portfolioConfig.enabled}
                  onChange={event => updatePortfolio('enabled', event.target.checked)}
                />
                <span>Enable homepage portfolio section</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={portfolioConfig.showHeader}
                  onChange={event => updatePortfolio('showHeader', event.target.checked)}
                />
                <span>Show section header</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={portfolioConfig.showButton}
                  onChange={event => updatePortfolio('showButton', event.target.checked)}
                />
                <span>Show header CTA</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={portfolioConfig.showViewAllButton}
                  onChange={event => updatePortfolio('showViewAllButton', event.target.checked)}
                />
                <span>Show “View All Portfolio” button</span>
              </label>
              <Field label="Section order">
                <input
                  type="number"
                  value={portfolioConfig.order}
                  onChange={event => updatePortfolio('order', Number(event.target.value) || 20)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Display mode">
                <select
                  value={portfolioConfig.displayMode}
                  onChange={event =>
                    updatePortfolio(
                      'displayMode',
                      event.target.value as HomepagePortfolioDisplayMode
                    )
                  }
                  style={inputStyle}
                >
                  {displayModeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Item limit" hint="Used only when Display mode is Item Grid.">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={portfolioConfig.itemLimit}
                  onChange={event =>
                    updatePortfolio('itemLimit', Number(event.target.value) || 1)
                  }
                  style={inputStyle}
                />
              </Field>
              <Field
                label="Thumbnails per category"
                hint="Used only in Category Preview mode. Recommended range: 3-6."
              >
                <input
                  type="number"
                  min={3}
                  max={6}
                  value={portfolioConfig.thumbnailsPerCategory}
                  onChange={event =>
                    updatePortfolio(
                      'thumbnailsPerCategory',
                      Number(event.target.value) || 4
                    )
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Max categories" hint="Used only in Category Preview mode.">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={portfolioConfig.maxCategories}
                  onChange={event =>
                    updatePortfolio('maxCategories', Number(event.target.value) || 8)
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Max rows (0 = unlimited)">
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={portfolioConfig.maxRows}
                  onChange={event =>
                    updatePortfolio('maxRows', Number(event.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Section badge" full>
                <input
                  value={portfolioConfig.badge}
                  onChange={event => updatePortfolio('badge', event.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Section title" full>
                <input
                  value={portfolioConfig.title}
                  onChange={event => updatePortfolio('title', event.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Section subtitle" full>
                <textarea
                  value={portfolioConfig.subtitle}
                  onChange={event => updatePortfolio('subtitle', event.target.value)}
                  style={textareaStyle}
                />
              </Field>
              <Field label="Header CTA text">
                <input
                  value={portfolioConfig.buttonText}
                  onChange={event => updatePortfolio('buttonText', event.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Header CTA link">
                <input
                  value={portfolioConfig.buttonLink}
                  onChange={event => updatePortfolio('buttonLink', event.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Bottom CTA text">
                <input
                  value={portfolioConfig.viewAllButtonText}
                  onChange={event => updatePortfolio('viewAllButtonText', event.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Bottom CTA link">
                <input
                  value={portfolioConfig.viewAllButtonLink}
                  onChange={event => updatePortfolio('viewAllButtonLink', event.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 18 }}>
              <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Content types and filter chips</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.showVideos}
                    onChange={event => updatePortfolio('showVideos', event.target.checked)}
                  />
                  <span>Show videos on homepage</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.showGraphics}
                    onChange={event => updatePortfolio('showGraphics', event.target.checked)}
                  />
                  <span>Show graphics on homepage</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.showTabs}
                    onChange={event => updatePortfolio('showTabs', event.target.checked)}
                  />
                  <span>Show top tabs</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.showCategoryFilters}
                    onChange={event =>
                      updatePortfolio('showCategoryFilters', event.target.checked)
                    }
                  />
                  <span>Show category chips</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.showAllChip}
                    onChange={event => updatePortfolio('showAllChip', event.target.checked)}
                  />
                  <span>Show “All” chip</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.showGroupingLabels}
                    onChange={event =>
                      updatePortfolio('showGroupingLabels', event.target.checked)
                    }
                  />
                  <span>Show type grouping labels</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.mobileFilterVisibility}
                    onChange={event =>
                      updatePortfolio('mobileFilterVisibility', event.target.checked)
                    }
                  />
                  <span>Show chips on mobile</span>
                </label>
                <Field label="Mixed content order">
                  <select
                    value={portfolioConfig.mixedOrder}
                    onChange={event =>
                      updatePortfolio(
                        'mixedOrder',
                        event.target.value as HomepagePortfolioSectionSettings['mixedOrder']
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="video-first">Videos first</option>
                    <option value="graphic-first">Graphics first</option>
                  </select>
                </Field>
                <Field label="Chip alignment">
                  <select
                    value={portfolioConfig.filterAlignment}
                    onChange={event =>
                      updatePortfolio(
                        'filterAlignment',
                        event.target.value as HomepagePortfolioFilterAlignment
                      )
                    }
                    style={inputStyle}
                  >
                    {filterAlignmentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Chip style">
                  <select
                    value={portfolioConfig.filterChipStyle}
                    onChange={event =>
                      updatePortfolio(
                        'filterChipStyle',
                        event.target.value as HomepagePortfolioChipStyle
                      )
                    }
                    style={inputStyle}
                  >
                    {chipStyleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 18 }}>
              <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Layout, card style and preview behavior</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <Field label="Layout type">
                  <select
                    value={portfolioConfig.layoutType}
                    onChange={event =>
                      updatePortfolio(
                        'layoutType',
                        event.target.value as HomepagePortfolioLayoutType
                      )
                    }
                    style={inputStyle}
                  >
                    {layoutOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Card style">
                  <select
                    value={portfolioConfig.cardStyle}
                    onChange={event =>
                      updatePortfolio(
                        'cardStyle',
                        event.target.value as HomepagePortfolioCardStyle
                      )
                    }
                    style={inputStyle}
                  >
                    {cardStyleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section alignment">
                  <select
                    value={portfolioConfig.alignment}
                    onChange={event =>
                      updatePortfolio(
                        'alignment',
                        event.target.value as HomepagePortfolioSectionAlignment
                      )
                    }
                    style={inputStyle}
                  >
                    {portfolioAlignmentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Container width">
                  <select
                    value={portfolioConfig.containerWidth}
                    onChange={event =>
                      updatePortfolio(
                        'containerWidth',
                        event.target.value as HomepagePortfolioWidth
                      )
                    }
                    style={inputStyle}
                  >
                    {containerWidthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Card density">
                  <select
                    value={portfolioConfig.cardDensity}
                    onChange={event =>
                      updatePortfolio(
                        'cardDensity',
                        event.target.value as HomepagePortfolioDensity
                      )
                    }
                    style={inputStyle}
                  >
                    {densityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Gap preset">
                  <select
                    value={portfolioConfig.gap}
                    onChange={event =>
                      updatePortfolio('gap', event.target.value as HomepagePortfolioGap)
                    }
                    style={inputStyle}
                  >
                    {gapOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Responsive preset">
                  <select
                    value={portfolioConfig.responsivePreset}
                    onChange={event =>
                      updatePortfolio(
                        'responsivePreset',
                        event.target.value as HomepagePortfolioResponsivePreset
                      )
                    }
                    style={inputStyle}
                  >
                    {responsiveOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Desktop columns">
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={portfolioConfig.desktopColumns}
                    onChange={event =>
                      updatePortfolio('desktopColumns', Number(event.target.value) || 3)
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Tablet columns">
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={portfolioConfig.tabletColumns}
                    onChange={event =>
                      updatePortfolio('tabletColumns', Number(event.target.value) || 2)
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Mobile columns">
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={portfolioConfig.mobileColumns}
                    onChange={event =>
                      updatePortfolio('mobileColumns', Number(event.target.value) || 1)
                    }
                    style={inputStyle}
                  />
                </Field>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.mobileCompactMode}
                    onChange={event =>
                      updatePortfolio('mobileCompactMode', event.target.checked)
                    }
                  />
                  <span>Compact mobile mode</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={portfolioConfig.enablePreviewModal}
                    onChange={event =>
                      updatePortfolio('enablePreviewModal', event.target.checked)
                    }
                  />
                  <span>Enable preview modal</span>
                </label>
                <Field label="Click action">
                  <select
                    value={portfolioConfig.clickAction}
                    onChange={event =>
                      updatePortfolio(
                        'clickAction',
                        event.target.value as HomepagePortfolioClickAction
                      )
                    }
                    style={inputStyle}
                  >
                    {clickActionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Preview label">
                  <input
                    value={portfolioConfig.previewButtonLabel}
                    onChange={event =>
                      updatePortfolio('previewButtonLabel', event.target.value)
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Card CTA text">
                  <input
                    value={portfolioConfig.cardCtaText}
                    onChange={event => updatePortfolio('cardCtaText', event.target.value)}
                    style={inputStyle}
                  />
                </Field>
                {[
                  ['showThumbnail', 'Show thumbnail'],
                  ['showTitle', 'Show title'],
                  ['showCategory', 'Show category'],
                  ['showDescription', 'Show description'],
                  ['showTypeBadge', 'Show type badge'],
                  ['showFeaturedBadge', 'Show featured badge'],
                  ['showCardCta', 'Show card CTA'],
                  ['showPreviewIcon', 'Show preview icon'],
                  ['showHoverOverlay', 'Show hover overlay'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={portfolioConfig[key as keyof HomepagePortfolioSectionSettings] as boolean}
                      onChange={event =>
                        updatePortfolio(
                          key as keyof HomepagePortfolioSectionSettings,
                          event.target.checked as never
                        )
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 18 }}>
              <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Category controls</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {categoryRows.map(({ category, homepage }) => (
                  <div
                    key={category.id}
                    style={{
                      border: '1px solid rgba(148,163,184,0.14)',
                      borderRadius: 16,
                      padding: 14,
                      background: '#020617',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700 }}>{category.name}</span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 999,
                            background: '#111827',
                            color: '#cbd5e1',
                          }}
                        >
                          {category.type}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        slug: {category.slug}
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={homepage.enabled}
                        onChange={event =>
                          updateCategory(category, { enabled: event.target.checked })
                        }
                      />
                      <span>Enabled</span>
                    </label>
                    <input
                      type="number"
                      value={homepage.order}
                      onChange={event =>
                        updateCategory(category, {
                          order: Number(event.target.value) || homepage.order,
                        })
                      }
                      style={inputStyle}
                      placeholder="Order"
                    />
                    <input
                      value={homepage.label}
                      onChange={event =>
                        updateCategory(category, { label: event.target.value })
                      }
                      style={inputStyle}
                      placeholder="Display label"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={fieldLabelStyle}>Per-item homepage controls</div>
                  <div style={helperStyle}>
                    Homepage visibility, order, featured state and preview behavior এখান থেকে set করুন।
                  </div>
                </div>
                <select
                  value={itemFilter}
                  onChange={event =>
                    setItemFilter(
                      event.target.value as 'all' | 'homepage' | 'video' | 'graphic'
                    )
                  }
                  style={{ ...inputStyle, width: 200 }}
                >
                  <option value="homepage">Homepage only</option>
                  <option value="all">All items</option>
                  <option value="video">Videos</option>
                  <option value="graphic">Graphics</option>
                </select>
              </div>

              {duplicateOrders.size > 0 ? (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(127,29,29,0.18)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    color: '#fecaca',
                    fontSize: 13,
                  }}
                >
                  Duplicate homepage order found. Save is blocked until every visible homepage item has a unique order.
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 10 }}>
                {filteredItems.map(item => {
                  const itemConfig = getHomepageConfigForItem(item, portfolioConfig.itemConfig);
                  return (
                    <div
                      key={`${item.sourceType}-${item.id}`}
                      style={{
                        border: '1px solid rgba(148,163,184,0.14)',
                        borderRadius: 16,
                        padding: 14,
                        background: '#020617',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{
                            width: 76,
                            height: 56,
                            objectFit: 'cover',
                            borderRadius: 12,
                            flexShrink: 0,
                            border: '1px solid rgba(148,163,184,0.12)',
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: item.sourceType === 'video' ? 'rgba(59,130,246,0.14)' : 'rgba(16,185,129,0.14)', color: item.sourceType === 'video' ? '#93c5fd' : '#6ee7b7' }}>
                              {item.sourceType}
                            </span>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: '#111827', color: '#cbd5e1' }}>
                              {item.categoryName}
                            </span>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: itemConfig.showOnHomepage ? 'rgba(22,163,74,0.14)' : 'rgba(148,163,184,0.12)', color: itemConfig.showOnHomepage ? '#86efac' : '#cbd5e1' }}>
                              {itemConfig.showOnHomepage ? 'Homepage Visible' : 'Hidden'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={itemConfig.showOnHomepage}
                          onChange={event =>
                            updateItem(item, { showOnHomepage: event.target.checked })
                          }
                        />
                        <span>Show</span>
                      </label>
                      <input
                        type="number"
                        value={itemConfig.homepageOrder}
                        onChange={event =>
                          updateItem(item, {
                            homepageOrder:
                              Number(event.target.value) || itemConfig.homepageOrder,
                          })
                        }
                        style={inputStyle}
                        placeholder="Order"
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={itemConfig.homepageFeatured}
                          onChange={event =>
                            updateItem(item, { homepageFeatured: event.target.checked })
                          }
                        />
                        <span>Featured</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={itemConfig.previewEnabled}
                          onChange={event =>
                            updateItem(item, { previewEnabled: event.target.checked })
                          }
                        />
                        <span>Preview</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 18 }}>
              <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Live portfolio preview</div>
              <div
                style={{
                  borderRadius: 22,
                  overflow: 'hidden',
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                }}
              >
                <PortfolioShowcase
                  variant="homepage"
                  items={
                    portfolioConfig.displayMode === 'category-preview'
                      ? categoryPreviewItems
                      : previewItems
                  }
                  categories={categories}
                  pageSettings={pageSettings}
                  badge={portfolioConfig.badge}
                  title={portfolioConfig.title}
                  subtitle={portfolioConfig.subtitle}
                  buttonText={portfolioConfig.buttonText}
                  buttonLink={portfolioConfig.buttonLink}
                  homepageSettings={portfolioConfig}
                />
              </div>
            </div>

            <PageStyleEditor
              title="Portfolio preview styling"
              description="Refine the homepage portfolio section heading, filter button mood, card surfaces, grid rhythm, and preview CTA styling."
              value={portfolioConfig.styles}
              onChange={nextValue =>
                setPortfolioConfig(current => ({
                  ...current,
                  styles: nextValue,
                }))
              }
            />
          </div>
        </BuilderPanel>

        <BuilderPanel
          title="Homepage about preview"
          badge={homepageAbout.enabled ? 'Visible' : 'Hidden'}
          description="Homepage About section shared about system-এর homepage block থেকে driven. এখানে edit করলে dedicated About system-এর homepage preview-ও sync থাকবে।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageAbout.enabled}
                onChange={event => updateHomepageAbout('enabled', event.target.checked)}
              />
              <span>Show homepage About section</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageAbout.showStats}
                onChange={event => updateHomepageAbout('showStats', event.target.checked)}
              />
              <span>Show stats overlay</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageAbout.showCards}
                onChange={event => updateHomepageAbout('showCards', event.target.checked)}
              />
              <span>Show highlight cards</span>
            </label>
            <Field label="Section order">
              <input
                type="number"
                value={homepageAbout.order}
                onChange={event => updateHomepageAbout('order', Number(event.target.value) || 30)}
                style={inputStyle}
              />
            </Field>
            <Field label="Layout">
              <select
                value={homepageAbout.layout}
                onChange={event =>
                  updateHomepageAbout('layout', event.target.value as AboutLayoutMode)
                }
                style={inputStyle}
              >
                {aboutLayoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Alignment">
              <select
                value={homepageAbout.alignment}
                onChange={event =>
                  updateHomepageAbout('alignment', event.target.value as AboutAlignment)
                }
                style={inputStyle}
              >
                {aboutAlignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select
                value={homepageAbout.width}
                onChange={event =>
                  updateHomepageAbout('width', event.target.value as AboutWidthPreset)
                }
                style={inputStyle}
              >
                {aboutWidthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select
                value={homepageAbout.spacing}
                onChange={event =>
                  updateHomepageAbout('spacing', event.target.value as AboutSpacingPreset)
                }
                style={inputStyle}
              >
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Max highlight cards">
              <input
                type="number"
                min={1}
                max={8}
                value={homepageAbout.maxCards}
                onChange={event =>
                  updateHomepageAbout('maxCards', Number(event.target.value) || 4)
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Section label" full>
              <input
                value={homepageAbout.label}
                onChange={event => updateHomepageAbout('label', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Heading" full>
              <textarea
                value={homepageAbout.title}
                onChange={event => updateHomepageAbout('title', event.target.value)}
                style={{ ...textareaStyle, minHeight: 90 }}
              />
            </Field>
            <Field label="Role / subtitle" full>
              <input
                value={homepageAbout.role}
                onChange={event => updateHomepageAbout('role', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Intro text" full>
              <textarea
                value={homepageAbout.description}
                onChange={event => updateHomepageAbout('description', event.target.value)}
                style={textareaStyle}
              />
            </Field>
            <Field label="Primary button text">
              <input
                value={homepageAbout.primaryButtonText}
                onChange={event =>
                  updateHomepageAbout('primaryButtonText', event.target.value)
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Primary button link">
              <input
                value={homepageAbout.primaryButtonLink}
                onChange={event =>
                  updateHomepageAbout('primaryButtonLink', event.target.value)
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Secondary button text">
              <input
                value={homepageAbout.secondaryButtonText}
                onChange={event =>
                  updateHomepageAbout('secondaryButtonText', event.target.value)
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Secondary button link">
              <input
                value={homepageAbout.secondaryButtonLink}
                onChange={event =>
                  updateHomepageAbout('secondaryButtonLink', event.target.value)
                }
                style={inputStyle}
              />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaField
                label="Profile / About image"
                value={homepageAbout.image}
                onChange={value => updateHomepageAbout('image', value)}
                onFileSelected={file =>
                  void handleImageUpload(
                    'about-image',
                    'about-image',
                    url => updateHomepageAbout('image', url),
                    file
                  )
                }
                uploading={uploadingField === 'about-image'}
                hint="This visual is reused inside the homepage About preview."
              />
            </div>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Homepage About stats</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {homepageAbout.stats.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <input
                  value={item.icon || ''}
                  onChange={event => updateHomepageAboutStat(index, { icon: event.target.value })}
                  style={inputStyle}
                  placeholder="Icon"
                />
                <input
                  value={item.value}
                  onChange={event => updateHomepageAboutStat(index, { value: event.target.value })}
                  style={inputStyle}
                  placeholder="Value"
                />
                <input
                  value={item.label}
                  onChange={event => updateHomepageAboutStat(index, { label: event.target.value })}
                  style={inputStyle}
                  placeholder="Label"
                />
                <button
                  onClick={() =>
                    setAboutSystem(current =>
                      current
                        ? {
                            ...current,
                            homepage: {
                              ...current.homepage,
                              stats: current.homepage.stats.filter((_, itemIndex) => itemIndex !== index),
                            },
                          }
                        : current
                    )
                  }
                  style={{
                    background: '#3f0d12',
                    color: '#fecaca',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setAboutSystem(current =>
                  current
                    ? {
                        ...current,
                        homepage: {
                          ...current.homepage,
                          stats: [...current.homepage.stats, createAboutStat()],
                        },
                      }
                    : current
                )
              }
              style={{
                background: '#111827',
                color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              + Add About stat
            </button>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Homepage About highlight cards</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {homepageAbout.cards.map((card, index) => (
              <div
                key={card.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <input
                    value={card.icon || ''}
                    onChange={event => updateHomepageAboutCard(index, { icon: event.target.value })}
                    style={inputStyle}
                    placeholder="Icon"
                  />
                  <input
                    value={card.title}
                    onChange={event => updateHomepageAboutCard(index, { title: event.target.value })}
                    style={inputStyle}
                    placeholder="Card title"
                  />
                  <input
                    value={card.subtitle || ''}
                    onChange={event => updateHomepageAboutCard(index, { subtitle: event.target.value })}
                    style={inputStyle}
                    placeholder="Subtitle"
                  />
                  <button
                    onClick={() =>
                      setAboutSystem(current =>
                        current
                          ? {
                              ...current,
                              homepage: {
                                ...current.homepage,
                                cards: current.homepage.cards.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }
                          : current
                      )
                    }
                    style={{
                      background: '#3f0d12',
                      color: '#fecaca',
                      border: '1px solid rgba(248,113,113,0.2)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={card.description}
                  onChange={event =>
                    updateHomepageAboutCard(index, { description: event.target.value })
                  }
                  style={textareaStyle}
                  placeholder="Description"
                />
                <input
                  value={card.image || ''}
                  onChange={event => updateHomepageAboutCard(index, { image: event.target.value })}
                  style={inputStyle}
                  placeholder="Optional card image URL"
                />
              </div>
            ))}
            <button
              onClick={() =>
                setAboutSystem(current =>
                  current
                    ? {
                        ...current,
                        homepage: {
                          ...current.homepage,
                          cards: [...current.homepage.cards, createAboutCard()],
                        },
                      }
                    : current
                )
              }
              style={{
                background: '#111827',
                color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              + Add highlight card
            </button>
          </div>

          <PageStyleEditor
            title="About preview styling"
            description="Control homepage About typography, image/text balance, stat-card polish, and CTA appearance."
            value={homepageAbout.styles}
            onChange={nextValue => updateHomepageAbout('styles', nextValue)}
          />
        </BuilderPanel>

        <BuilderPanel
          title="Showreel section"
          badge={homepageBuilder.showreel.enabled ? 'Visible' : 'Hidden'}
          description="Showreel label, title, embed URL, poster, CTA and layout এখান থেকে manage করুন।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.showreel.enabled}
                onChange={event => updateShowreel('enabled', event.target.checked)}
              />
              <span>Show showreel section</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.showreel.showLabel}
                onChange={event => updateShowreel('showLabel', event.target.checked)}
              />
              <span>Show label</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.showreel.showDescription}
                onChange={event => updateShowreel('showDescription', event.target.checked)}
              />
              <span>Show description</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.showreel.showButton}
                onChange={event => updateShowreel('showButton', event.target.checked)}
              />
              <span>Show CTA button</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.showreel.showInlinePreview}
                onChange={event => updateShowreel('showInlinePreview', event.target.checked)}
              />
              <span>Use inline embedded preview</span>
            </label>
            <Field label="Section order">
              <input
                type="number"
                value={homepageBuilder.showreel.order}
                onChange={event =>
                  updateShowreel('order', Number(event.target.value) || 40)
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Layout">
              <select
                value={homepageBuilder.showreel.layout}
                onChange={event =>
                  updateShowreel('layout', event.target.value as HomepageMediaLayout)
                }
                style={inputStyle}
              >
                {mediaLayoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Alignment">
              <select
                value={homepageBuilder.showreel.alignment}
                onChange={event =>
                  updateShowreel('alignment', event.target.value as HomepageAlignment)
                }
                style={inputStyle}
              >
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select
                value={homepageBuilder.showreel.width}
                onChange={event =>
                  updateShowreel('width', event.target.value as HomepageWidthPreset)
                }
                style={inputStyle}
              >
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select
                value={homepageBuilder.showreel.spacing}
                onChange={event =>
                  updateShowreel('spacing', event.target.value as HomepageSpacingPreset)
                }
                style={inputStyle}
              >
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label" full>
              <input
                value={homepageBuilder.showreel.label}
                onChange={event => updateShowreel('label', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Title" full>
              <input
                value={homepageBuilder.showreel.title}
                onChange={event => updateShowreel('title', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Subtitle" full>
              <textarea
                value={homepageBuilder.showreel.subtitle}
                onChange={event => updateShowreel('subtitle', event.target.value)}
                style={textareaStyle}
              />
            </Field>
            <Field label="Description" full>
              <textarea
                value={homepageBuilder.showreel.description}
                onChange={event => updateShowreel('description', event.target.value)}
                style={textareaStyle}
              />
            </Field>
            <Field label="Embed video URL" full>
              <input
                value={homepageBuilder.showreel.videoUrl}
                onChange={event => updateShowreel('videoUrl', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="CTA text">
              <input
                value={homepageBuilder.showreel.buttonText}
                onChange={event => updateShowreel('buttonText', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="CTA link">
              <input
                value={homepageBuilder.showreel.buttonLink}
                onChange={event => updateShowreel('buttonLink', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaField
                label="Poster image"
                value={homepageBuilder.showreel.posterImage}
                onChange={value => updateShowreel('posterImage', value)}
                onFileSelected={file =>
                  void handleImageUpload(
                    'showreel-poster',
                    'showreel-poster',
                    url => updateShowreel('posterImage', url),
                    file
                  )
                }
                uploading={uploadingField === 'showreel-poster'}
                hint="Used when inline embed is off or as a premium preview visual."
              />
            </div>
          </div>

          <PageStyleEditor
            title="Showreel styling"
            description="Adjust the showreel label, heading, description, section background, and button visuals."
            value={homepageBuilder.showreel.styles}
            onChange={nextValue => updateShowreel('styles', nextValue)}
          />
        </BuilderPanel>

        <BuilderPanel
          title="Stats / achievements section"
          badge={homepageBuilder.stats.enabled ? 'Visible' : 'Hidden'}
          description="Homepage stats values, labels, descriptions, columns and ordering এখান থেকে fully editable।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.stats.enabled}
                onChange={event => updateStats('enabled', event.target.checked)}
              />
              <span>Show stats section</span>
            </label>
            <Field label="Section order">
              <input
                type="number"
                value={homepageBuilder.stats.order}
                onChange={event => updateStats('order', Number(event.target.value) || 50)}
                style={inputStyle}
              />
            </Field>
            <Field label="Alignment">
              <select
                value={homepageBuilder.stats.alignment}
                onChange={event =>
                  updateStats('alignment', event.target.value as HomepageAlignment)
                }
                style={inputStyle}
              >
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select
                value={homepageBuilder.stats.width}
                onChange={event =>
                  updateStats('width', event.target.value as HomepageWidthPreset)
                }
                style={inputStyle}
              >
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select
                value={homepageBuilder.stats.spacing}
                onChange={event =>
                  updateStats('spacing', event.target.value as HomepageSpacingPreset)
                }
                style={inputStyle}
              >
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Desktop columns">
              <input
                type="number"
                min={1}
                max={4}
                value={homepageBuilder.stats.columnsDesktop}
                onChange={event =>
                  updateStats('columnsDesktop', Number(event.target.value) || 4)
                }
                style={inputStyle}
              />
            </Field>
            <Field label="Mobile columns">
              <input
                type="number"
                min={1}
                max={2}
                value={homepageBuilder.stats.columnsMobile}
                onChange={event =>
                  updateStats('columnsMobile', Number(event.target.value) || 2)
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ display: 'grid', gap: 12 }}>
            {homepageBuilder.stats.items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'center' }}>
                  <input
                    value={item.icon || ''}
                    onChange={event => updateHomepageStat(index, { icon: event.target.value })}
                    style={inputStyle}
                    placeholder="Icon"
                  />
                  <input
                    value={item.value}
                    onChange={event => updateHomepageStat(index, { value: event.target.value })}
                    style={inputStyle}
                    placeholder="Value"
                  />
                  <input
                    value={item.label}
                    onChange={event => updateHomepageStat(index, { label: event.target.value })}
                    style={inputStyle}
                    placeholder="Label"
                  />
                  <input
                    value={item.description || ''}
                    onChange={event =>
                      updateHomepageStat(index, { description: event.target.value })
                    }
                    style={inputStyle}
                    placeholder="Small description"
                  />
                  <input
                    type="number"
                    value={item.order}
                    onChange={event =>
                      updateHomepageStat(index, { order: Number(event.target.value) || index + 1 })
                    }
                    style={inputStyle}
                    placeholder="Order"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={event =>
                          updateHomepageStat(index, { enabled: event.target.checked })
                        }
                      />
                      <span>Visible</span>
                    </label>
                    <button
                      onClick={() =>
                        setHomepageBuilder(current => ({
                          ...current,
                          stats: {
                            ...current.stats,
                            items: current.stats.items.filter((_, itemIndex) => itemIndex !== index),
                          },
                        }))
                      }
                      style={{
                        background: '#3f0d12',
                        color: '#fecaca',
                        border: '1px solid rgba(248,113,113,0.2)',
                        borderRadius: 12,
                        padding: '9px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                setHomepageBuilder(current => ({
                  ...current,
                  stats: {
                    ...current.stats,
                    items: [
                      ...current.stats.items,
                      {
                        ...createStatItem('stats', '📈'),
                        order: getNextOrder(current.stats.items),
                      },
                    ],
                  },
                }))
              }
              style={{
                background: '#111827',
                color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              + Add stat item
            </button>
          </div>

          <PageStyleEditor
            title="Stats styling"
            description="Refine stats headings, section spacing, card backgrounds, borders, and number emphasis."
            value={homepageBuilder.stats.styles}
            onChange={nextValue => updateStats('styles', nextValue)}
          />
        </BuilderPanel>

        <BuilderPanel
          title="CTA section"
          badge={homepageBuilder.cta.enabled ? 'Visible' : 'Hidden'}
          description="Final call-to-action block-এর heading, buttons, layout and background এখান থেকে control করুন।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.cta.enabled}
                onChange={event => updateCta('enabled', event.target.checked)}
              />
              <span>Show CTA section</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.cta.showSecondaryButton}
                onChange={event => updateCta('showSecondaryButton', event.target.checked)}
              />
              <span>Show secondary button</span>
            </label>
            <Field label="Section order">
              <input
                type="number"
                value={homepageBuilder.cta.order}
                onChange={event => updateCta('order', Number(event.target.value) || 60)}
                style={inputStyle}
              />
            </Field>
            <Field label="Layout">
              <select
                value={homepageBuilder.cta.layout}
                onChange={event =>
                  updateCta('layout', event.target.value as HomepageMediaLayout)
                }
                style={inputStyle}
              >
                {mediaLayoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Alignment">
              <select
                value={homepageBuilder.cta.alignment}
                onChange={event =>
                  updateCta('alignment', event.target.value as HomepageAlignment)
                }
                style={inputStyle}
              >
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select
                value={homepageBuilder.cta.width}
                onChange={event =>
                  updateCta('width', event.target.value as HomepageWidthPreset)
                }
                style={inputStyle}
              >
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select
                value={homepageBuilder.cta.spacing}
                onChange={event =>
                  updateCta('spacing', event.target.value as HomepageSpacingPreset)
                }
                style={inputStyle}
              >
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Icon / emoji">
              <input
                value={homepageBuilder.cta.icon}
                onChange={event => updateCta('icon', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Title" full>
              <input
                value={homepageBuilder.cta.title}
                onChange={event => updateCta('title', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Subtitle" full>
              <textarea
                value={homepageBuilder.cta.subtitle}
                onChange={event => updateCta('subtitle', event.target.value)}
                style={textareaStyle}
              />
            </Field>
            <Field label="Primary button text">
              <input
                value={homepageBuilder.cta.primaryButtonText}
                onChange={event => updateCta('primaryButtonText', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Primary button link">
              <input
                value={homepageBuilder.cta.primaryButtonLink}
                onChange={event => updateCta('primaryButtonLink', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Secondary button text">
              <input
                value={homepageBuilder.cta.secondaryButtonText}
                onChange={event => updateCta('secondaryButtonText', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Secondary button link">
              <input
                value={homepageBuilder.cta.secondaryButtonLink}
                onChange={event => updateCta('secondaryButtonLink', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaField
                label="CTA background image"
                value={homepageBuilder.cta.backgroundImage}
                onChange={value => updateCta('backgroundImage', value)}
                onFileSelected={file =>
                  void handleImageUpload(
                    'cta-background',
                    'cta-background',
                    url => updateCta('backgroundImage', url),
                    file
                  )
                }
                uploading={uploadingField === 'cta-background'}
                hint="Optional cinematic background for the CTA block."
              />
            </div>
          </div>

          <PageStyleEditor
            title="CTA styling"
            description="Customize the homepage CTA section background, icon/title hierarchy, and dual-button look."
            value={homepageBuilder.cta.styles}
            onChange={nextValue => updateCta('styles', nextValue)}
          />
        </BuilderPanel>

        <BuilderPanel
          title="Footer section"
          badge={homepageBuilder.footer.enabled ? 'Visible' : 'Hidden'}
          description="Brand text, description, quick links, social links, contact info and footer note সব এখান থেকে editable।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.footer.enabled}
                onChange={event => updateFooter('enabled', event.target.checked)}
              />
              <span>Show footer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.footer.showDescription}
                onChange={event => updateFooter('showDescription', event.target.checked)}
              />
              <span>Show description</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.footer.showQuickLinks}
                onChange={event => updateFooter('showQuickLinks', event.target.checked)}
              />
              <span>Show quick links</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.footer.showContact}
                onChange={event => updateFooter('showContact', event.target.checked)}
              />
              <span>Show contact info</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={homepageBuilder.footer.showSocial}
                onChange={event => updateFooter('showSocial', event.target.checked)}
              />
              <span>Show social links</span>
            </label>
            <Field label="Section order">
              <input
                type="number"
                value={homepageBuilder.footer.order}
                onChange={event => updateFooter('order', Number(event.target.value) || 70)}
                style={inputStyle}
              />
            </Field>
            <Field label="Footer layout">
              <select
                value={homepageBuilder.footer.layout}
                onChange={event =>
                  updateFooter(
                    'layout',
                    event.target.value as HomepageBuilderConfig['footer']['layout']
                  )
                }
                style={inputStyle}
              >
                {footerLayoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Alignment">
              <select
                value={homepageBuilder.footer.alignment}
                onChange={event =>
                  updateFooter('alignment', event.target.value as HomepageAlignment)
                }
                style={inputStyle}
              >
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select
                value={homepageBuilder.footer.width}
                onChange={event =>
                  updateFooter('width', event.target.value as HomepageWidthPreset)
                }
                style={inputStyle}
              >
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select
                value={homepageBuilder.footer.spacing}
                onChange={event =>
                  updateFooter('spacing', event.target.value as HomepageSpacingPreset)
                }
                style={inputStyle}
              >
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand text">
              <input
                value={homepageBuilder.footer.brandText}
                onChange={event => updateFooter('brandText', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Brand accent">
              <input
                value={homepageBuilder.footer.brandAccent}
                onChange={event => updateFooter('brandAccent', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Quick links title">
              <input
                value={homepageBuilder.footer.quickLinksTitle}
                onChange={event => updateFooter('quickLinksTitle', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Contact title">
              <input
                value={homepageBuilder.footer.contactTitle}
                onChange={event => updateFooter('contactTitle', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Social title">
              <input
                value={homepageBuilder.footer.socialTitle}
                onChange={event => updateFooter('socialTitle', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Footer description" full>
              <textarea
                value={homepageBuilder.footer.description}
                onChange={event => updateFooter('description', event.target.value)}
                style={textareaStyle}
              />
            </Field>
            <Field label="Copyright text" full>
              <input
                value={homepageBuilder.footer.copyrightText}
                onChange={event => updateFooter('copyrightText', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Footer note" full>
              <input
                value={homepageBuilder.footer.noteText}
                onChange={event => updateFooter('noteText', event.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Quick links</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {sortByOrder(homepageBuilder.footer.quickLinks).map(item => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={event =>
                      updateFooter(
                        'quickLinks',
                        homepageBuilder.footer.quickLinks.map(entry =>
                          entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry
                        )
                      )
                    }
                  />
                  <span>Visible</span>
                </label>
                <input
                  value={item.label}
                    onChange={event =>
                      updateFooter(
                        'quickLinks',
                        homepageBuilder.footer.quickLinks.map(entry =>
                          entry.id === item.id ? { ...entry, label: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Label"
                />
                <input
                  value={item.url}
                    onChange={event =>
                      updateFooter(
                        'quickLinks',
                        homepageBuilder.footer.quickLinks.map(entry =>
                          entry.id === item.id ? { ...entry, url: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="URL"
                />
                <input
                  type="number"
                  value={item.order}
                    onChange={event =>
                      updateFooter(
                        'quickLinks',
                        homepageBuilder.footer.quickLinks.map(entry =>
                          entry.id === item.id
                            ? { ...entry, order: Number(event.target.value) || item.order }
                            : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Order"
                />
                <button
                  onClick={() =>
                    updateFooter(
                      'quickLinks',
                      homepageBuilder.footer.quickLinks.filter(entry => entry.id !== item.id)
                    )
                  }
                  style={{
                    background: '#3f0d12',
                    color: '#fecaca',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateFooter('quickLinks', [
                  ...homepageBuilder.footer.quickLinks,
                  {
                    ...createLinkItem('footer-link'),
                    order: getNextOrder(homepageBuilder.footer.quickLinks),
                  },
                ])
              }
              style={{
                background: '#111827',
                color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              + Add quick link
            </button>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Social links</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {sortByOrder(homepageBuilder.footer.socialLinks).map(item => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={event =>
                      updateFooter(
                        'socialLinks',
                        homepageBuilder.footer.socialLinks.map(entry =>
                          entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry
                        )
                      )
                    }
                  />
                  <span>Visible</span>
                </label>
                <input
                  value={item.label}
                    onChange={event =>
                      updateFooter(
                        'socialLinks',
                        homepageBuilder.footer.socialLinks.map(entry =>
                          entry.id === item.id ? { ...entry, label: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Label"
                />
                <input
                  value={item.url}
                    onChange={event =>
                      updateFooter(
                        'socialLinks',
                        homepageBuilder.footer.socialLinks.map(entry =>
                          entry.id === item.id ? { ...entry, url: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="URL"
                />
                <input
                  type="number"
                  value={item.order}
                    onChange={event =>
                      updateFooter(
                        'socialLinks',
                        homepageBuilder.footer.socialLinks.map(entry =>
                          entry.id === item.id
                            ? { ...entry, order: Number(event.target.value) || item.order }
                            : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Order"
                />
                <button
                  onClick={() =>
                    updateFooter(
                      'socialLinks',
                      homepageBuilder.footer.socialLinks.filter(entry => entry.id !== item.id)
                    )
                  }
                  style={{
                    background: '#3f0d12',
                    color: '#fecaca',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateFooter('socialLinks', [
                  ...homepageBuilder.footer.socialLinks,
                  {
                    ...createLinkItem('footer-social'),
                    order: getNextOrder(homepageBuilder.footer.socialLinks),
                  },
                ])
              }
              style={{
                background: '#111827',
                color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              + Add social link
            </button>
          </div>

          <div style={{ height: 18 }} />
          <div style={{ ...fieldLabelStyle, marginBottom: 12 }}>Contact items</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {sortByOrder(homepageBuilder.footer.contactItems).map(item => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={event =>
                      updateFooter(
                        'contactItems',
                        homepageBuilder.footer.contactItems.map(entry =>
                          entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry
                        )
                      )
                    }
                  />
                  <span>Visible</span>
                </label>
                <input
                  value={item.icon || ''}
                    onChange={event =>
                      updateFooter(
                        'contactItems',
                        homepageBuilder.footer.contactItems.map(entry =>
                          entry.id === item.id ? { ...entry, icon: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Icon"
                />
                <input
                  value={item.label}
                    onChange={event =>
                      updateFooter(
                        'contactItems',
                        homepageBuilder.footer.contactItems.map(entry =>
                          entry.id === item.id ? { ...entry, label: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Label"
                />
                <input
                  value={item.value}
                    onChange={event =>
                      updateFooter(
                        'contactItems',
                        homepageBuilder.footer.contactItems.map(entry =>
                          entry.id === item.id ? { ...entry, value: event.target.value } : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Value"
                />
                <input
                  type="number"
                  value={item.order}
                    onChange={event =>
                      updateFooter(
                        'contactItems',
                        homepageBuilder.footer.contactItems.map(entry =>
                          entry.id === item.id
                            ? { ...entry, order: Number(event.target.value) || item.order }
                            : entry
                        )
                      )
                    }
                  style={inputStyle}
                  placeholder="Order"
                />
                <button
                  onClick={() =>
                    updateFooter(
                      'contactItems',
                      homepageBuilder.footer.contactItems.filter(entry => entry.id !== item.id)
                    )
                  }
                  style={{
                    background: '#3f0d12',
                    color: '#fecaca',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateFooter('contactItems', [
                  ...homepageBuilder.footer.contactItems,
                  {
                    ...createContactItem(),
                    order: getNextOrder(homepageBuilder.footer.contactItems),
                  },
                ])
              }
              style={{
                background: '#111827',
                color: '#cbd5e1',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              + Add contact item
            </button>
          </div>
        </BuilderPanel>
      </div>
    </AdminShell>
  );
}
