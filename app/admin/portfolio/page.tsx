'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminShell from '@/components/admin/AdminShell';
import PageStyleEditor from '@/components/admin/PageStyleEditor';
import { AdminBuilderSection } from '@/components/admin/admin-ui';
import {
  getHomepageConfigForItem,
  getHomepagePortfolioItemKey,
  getHomepagePortfolioSettings,
  HOMEPAGE_PORTFOLIO_SETTING_KEYS,
  HOMEPAGE_PORTFOLIO_SYSTEM_SETTING_KEY,
  PORTFOLIO_PAGE_SETTING_KEYS,
  fetchPortfolioDataset,
  getPortfolioPageSettings,
  serializeHomepagePortfolioItemConfig,
  serializeHomepagePortfolioSettings,
  toPortfolioPreviewItems,
  type HomepagePortfolioSectionSettings,
  type PortfolioAllOrder,
  type PortfolioCategory,
  type PortfolioPreviewItem,
  type PortfolioSourceType,
} from '@/lib/portfolio-content';
import {
  getPortfolioPageBuilderConfig,
  getPortfolioPageCategoryKey,
  getPortfolioPageItemKey,
  PORTFOLIO_PAGE_BUILDER_SETTING_KEY,
  serializePortfolioPageBuilderConfig,
  type PortfolioPageAlignment,
  type PortfolioPageBuilderConfig,
  type PortfolioPageCardStyle,
  type PortfolioPageDensity,
  type PortfolioPageGap,
  type PortfolioPageHeroLayout,
  type PortfolioPageLayoutType,
  type PortfolioPageSpacing,
  type PortfolioPageWidth,
} from '@/lib/portfolio-page-content';
import { serializeStyledSetting, toSettingMap, type SettingMap } from '@/lib/hero-settings';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdminPortfolioItem = Pick<
  PortfolioPreviewItem,
  | 'id'
  | 'title'
  | 'description'
  | 'sourceType'
  | 'category'
  | 'categorySlug'
  | 'order_num'
  | 'visible'
  | 'youtube_url'
  | 'imageUrl'
> & {
  homepageVisible: boolean;
  homepageOrder: number;
  homepageFeatured: boolean;
  previewEnabled: boolean;
};

const heroLayoutOptions: Array<{ value: PortfolioPageHeroLayout; label: string }> = [
  { value: 'centered', label: 'Centered hero' },
  { value: 'split', label: 'Split hero' },
  { value: 'stacked', label: 'Stacked hero' },
];

const alignmentOptions: Array<{ value: PortfolioPageAlignment; label: string }> = [
  { value: 'left', label: 'Left aligned' },
  { value: 'center', label: 'Center aligned' },
];

const widthOptions: Array<{ value: PortfolioPageWidth; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full width' },
];

const spacingOptions: Array<{ value: PortfolioPageSpacing; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'spacious', label: 'Spacious' },
];

const layoutTypeOptions: Array<{ value: PortfolioPageLayoutType; label: string }> = [
  { value: 'cinematic', label: 'Cinematic grid' },
  { value: 'editorial', label: 'Editorial showcase' },
  { value: 'compact', label: 'Compact archive' },
];

const cardStyleOptions: Array<{ value: PortfolioPageCardStyle; label: string }> = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'glass', label: 'Glass' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'light', label: 'Light polished' },
];

const densityOptions: Array<{ value: PortfolioPageDensity; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'spacious', label: 'Spacious' },
];

const gapOptions: Array<{ value: PortfolioPageGap; label: string }> = [
  { value: 'small', label: 'Small gap' },
  { value: 'medium', label: 'Medium gap' },
  { value: 'large', label: 'Large gap' },
];

function itemKey(item: Pick<AdminPortfolioItem, 'sourceType' | 'id'>) {
  return `${item.sourceType}:${item.id}`;
}

function nextHomepageOrder(items: AdminPortfolioItem[]) {
  const used = new Set(
    items.filter(item => item.homepageVisible).map(item => item.homepageOrder)
  );

  let order = 1;
  while (used.has(order)) {
    order += 1;
  }

  return order;
}

function createInitialItems(
  items: PortfolioPreviewItem[],
  homepageSettings: HomepagePortfolioSectionSettings,
  pageBuilder: PortfolioPageBuilderConfig
) {
  return items.map(item => {
    const homepageConfig = getHomepageConfigForItem(item, homepageSettings.itemConfig);
    const previewConfig = pageBuilder.itemConfig[getPortfolioPageItemKey(item.sourceType, item.id)];

    return {
      ...item,
      homepageVisible: homepageConfig.showOnHomepage,
      homepageOrder: homepageConfig.homepageOrder,
      homepageFeatured: homepageConfig.homepageFeatured,
      previewEnabled: previewConfig?.previewEnabled ?? true,
    } satisfies AdminPortfolioItem;
  });
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Panel({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminBuilderSection
      title={title}
      badge={badge}
      description={description}
      tabs={[
        {
          id: 'content',
          label: 'Content',
          description:
            'All controls related to this portfolio area stay inside one expandable section container.',
          content: children,
        },
      ]}
    />
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
  uploading: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 18,
        padding: 14,
        background: '#020617',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{label}</div>
      {value ? (
        <img
          src={value}
          alt={label}
          style={{
            width: '100%',
            height: 180,
            objectFit: 'cover',
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.14)',
            marginBottom: 12,
          }}
        />
      ) : (
        <div
          style={{
            height: 180,
            borderRadius: 14,
            border: '1px dashed rgba(148,163,184,0.18)',
            display: 'grid',
            placeItems: 'center',
            color: '#64748b',
            marginBottom: 12,
          }}
        >
          No media selected
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{
          width: '100%',
          background: '#0f172a',
          border: '1px solid rgba(148,163,184,0.16)',
          borderRadius: 12,
          color: '#fff',
          padding: '10px 12px',
          fontSize: 14,
          boxSizing: 'border-box',
          marginBottom: 10,
        }}
        placeholder="Paste image URL"
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload image'}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              background: '#3f0d12',
              color: '#fecaca',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      {hint ? <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>{hint}</div> : null}
    </div>
  );
}

export default function PortfolioAdminPage() {
  const router = useRouter();
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [pageBuilder, setPageBuilder] = useState<PortfolioPageBuilderConfig | null>(null);
  const [pageSettings, setPageSettings] = useState(getPortfolioPageSettings({}));
  const [homepagePortfolioSettings, setHomepagePortfolioSettings] = useState<HomepagePortfolioSectionSettings | null>(null);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [items, setItems] = useState<AdminPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [itemFilter, setItemFilter] = useState<'all' | PortfolioSourceType>('all');
  const [search, setSearch] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  async function loadPortfolioSystem() {
    const [{ data: settingsRows }, dataset] = await Promise.all([
      supabase.from('site_settings').select('*'),
      fetchPortfolioDataset(supabase, { includeHidden: true }),
    ]);

    const map = toSettingMap(settingsRows || []);
    const nextPageBuilder = getPortfolioPageBuilderConfig(map);
    const nextPageSettings = getPortfolioPageSettings(map);
    const nextHomepageSettings = getHomepagePortfolioSettings(map);
    const previewItems = toPortfolioPreviewItems(
      dataset.videos,
      dataset.graphics,
      dataset.categories
    );

    setRawSettings(map);
    setPageBuilder(nextPageBuilder);
    setPageSettings(nextPageSettings);
    setHomepagePortfolioSettings(nextHomepageSettings);
    setCategories(dataset.categories);
    setItems(createInitialItems(previewItems, nextHomepageSettings, nextPageBuilder));
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    async function load() {
      try {
        await loadPortfolioSystem();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Portfolio page settings load failed.';
        setMsg(`❌ ${message}`);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#020617',
    border: '1px solid rgba(148,163,184,0.16)',
    borderRadius: 12,
    color: '#fff',
    padding: '10px 12px',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: 96,
  };

  const duplicateHomepageOrders = useMemo(() => {
    const buckets = new Map<number, string[]>();

    items
      .filter(item => item.homepageVisible)
      .forEach(item => {
        const existing = buckets.get(item.homepageOrder) || [];
        existing.push(itemKey(item));
        buckets.set(item.homepageOrder, existing);
      });

    return new Map(
      [...buckets.entries()].filter(([, keys]) => keys.length > 1)
    );
  }, [items]);

  const conflictItemKeys = useMemo(
    () => new Set([...duplicateHomepageOrders.values()].flat()),
    [duplicateHomepageOrders]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...items]
      .filter(item => itemFilter === 'all' || item.sourceType === itemFilter)
      .filter(item =>
        query
          ? item.title.toLowerCase().includes(query) ||
            (item.category || '').toLowerCase().includes(query)
          : true
      )
      .sort((leftItem, rightItem) => {
        if (leftItem.sourceType !== rightItem.sourceType) {
          return leftItem.sourceType.localeCompare(rightItem.sourceType);
        }

        if (leftItem.order_num !== rightItem.order_num) {
          return leftItem.order_num - rightItem.order_num;
        }

        return leftItem.title.localeCompare(rightItem.title);
      });
  }, [itemFilter, items, search]);

  function updateHero<K extends keyof PortfolioPageBuilderConfig['hero']>(
    key: K,
    value: PortfolioPageBuilderConfig['hero'][K]
  ) {
    setPageBuilder(current =>
      current
        ? {
            ...current,
            hero: {
              ...current.hero,
              [key]: value,
            },
          }
        : current
    );

    if (key === 'title' || key === 'subtitle') {
      setPageSettings(current => ({
        ...current,
        [key]: value as string,
      }));
    }
  }

  function updateShowcase<K extends keyof PortfolioPageBuilderConfig['showcase']>(
    key: K,
    value: PortfolioPageBuilderConfig['showcase'][K]
  ) {
    setPageBuilder(current =>
      current
        ? {
            ...current,
            showcase: {
              ...current.showcase,
              [key]: value,
            },
          }
        : current
    );
  }

  function updateCta<K extends keyof PortfolioPageBuilderConfig['cta']>(
    key: K,
    value: PortfolioPageBuilderConfig['cta'][K]
  ) {
    setPageBuilder(current =>
      current
        ? {
            ...current,
            cta: {
              ...current.cta,
              [key]: value,
            },
          }
        : current
    );
  }

  function updateTab<K extends keyof typeof pageSettings.tabs>(
    tabKey: K,
    patch: Partial<(typeof pageSettings.tabs)[K]>
  ) {
    setPageSettings(current => ({
      ...current,
      tabs: {
        ...current.tabs,
        [tabKey]: {
          ...current.tabs[tabKey],
          ...patch,
        },
      },
    }));
  }

  function updateAllTab<K extends keyof typeof pageSettings.allTab>(
    key: K,
    value: (typeof pageSettings.allTab)[K]
  ) {
    setPageSettings(current => ({
      ...current,
      allTab: {
        ...current.allTab,
        [key]: value,
      },
    }));
  }

  function updateCategory(category: PortfolioCategory, patch: { enabled?: boolean; order?: number; label?: string }) {
    if (!pageBuilder) {
      return;
    }

    const categoryKey = getPortfolioPageCategoryKey(category.type, category.slug);
    setPageBuilder({
      ...pageBuilder,
      categoryConfig: {
        ...pageBuilder.categoryConfig,
        [categoryKey]: {
          ...pageBuilder.categoryConfig[categoryKey],
          ...patch,
        },
      },
    });
  }

  function updateItem(target: AdminPortfolioItem, patch: Partial<AdminPortfolioItem>) {
    setItems(current =>
      current.map(item =>
        item.sourceType === target.sourceType && item.id === target.id
          ? { ...item, ...patch }
          : item
      )
    );
  }

  async function handleBannerUpload(file: File) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `portfolio/${Date.now()}-banner.${ext}`;
    setUploadingField('banner');

    try {
      const { error } = await supabase.storage.from('media').upload(path, file, {
        upsert: true,
      });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(path);
      updateHero('bannerImage', data.publicUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Banner upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField(null);
    }
  }

  async function savePortfolioSystem() {
    if (!pageBuilder || !homepagePortfolioSettings) {
      return;
    }

    if (duplicateHomepageOrders.size > 0) {
      setMsg('❌ Homepage order must be unique among visible homepage items.');
      return;
    }

    setSaving(true);
    try {
      const nextItemConfig = Object.fromEntries(
        items.map(item => [
          getPortfolioPageItemKey(item.sourceType, item.id),
          {
            previewEnabled: item.previewEnabled,
          },
        ])
      );

      const nextPageBuilder: PortfolioPageBuilderConfig = {
        ...pageBuilder,
        itemConfig: nextItemConfig,
      };

      const nextHomepageSettings: HomepagePortfolioSectionSettings = {
        ...homepagePortfolioSettings,
        itemConfig: Object.fromEntries(
          items.map(item => [
            getHomepagePortfolioItemKey(item.sourceType, item.id),
            {
              showOnHomepage: item.homepageVisible,
              homepageOrder: item.homepageOrder,
              homepageFeatured: item.homepageFeatured,
              previewEnabled:
                homepagePortfolioSettings.itemConfig[
                  getHomepagePortfolioItemKey(item.sourceType, item.id)
                ]?.previewEnabled ?? true,
            },
          ])
        ),
      };

      const settingUpdates = [
        writeSiteSetting(
          supabase,
          PORTFOLIO_PAGE_BUILDER_SETTING_KEY,
          serializePortfolioPageBuilderConfig(nextPageBuilder)
        ),
        writeSiteSetting(
          supabase,
          PORTFOLIO_PAGE_SETTING_KEYS.title,
          serializeStyledSetting(rawSettings[PORTFOLIO_PAGE_SETTING_KEYS.title], pageSettings.title)
        ),
        writeSiteSetting(
          supabase,
          PORTFOLIO_PAGE_SETTING_KEYS.subtitle,
          serializeStyledSetting(rawSettings[PORTFOLIO_PAGE_SETTING_KEYS.subtitle], pageSettings.subtitle)
        ),
        writeSiteSetting(
          supabase,
          PORTFOLIO_PAGE_SETTING_KEYS.tabAllLabel,
          serializeStyledSetting(rawSettings[PORTFOLIO_PAGE_SETTING_KEYS.tabAllLabel], pageSettings.tabs.all.label)
        ),
        writeSiteSetting(
          supabase,
          PORTFOLIO_PAGE_SETTING_KEYS.tabVideoLabel,
          serializeStyledSetting(rawSettings[PORTFOLIO_PAGE_SETTING_KEYS.tabVideoLabel], pageSettings.tabs.video.label)
        ),
        writeSiteSetting(
          supabase,
          PORTFOLIO_PAGE_SETTING_KEYS.tabGraphicLabel,
          serializeStyledSetting(rawSettings[PORTFOLIO_PAGE_SETTING_KEYS.tabGraphicLabel], pageSettings.tabs.graphic.label)
        ),
        writeSiteSetting(supabase, PORTFOLIO_PAGE_SETTING_KEYS.tabAllEnabled, String(pageSettings.tabs.all.enabled)),
        writeSiteSetting(supabase, PORTFOLIO_PAGE_SETTING_KEYS.tabVideoEnabled, String(pageSettings.tabs.video.enabled)),
        writeSiteSetting(supabase, PORTFOLIO_PAGE_SETTING_KEYS.tabGraphicEnabled, String(pageSettings.tabs.graphic.enabled)),
        writeSiteSetting(supabase, PORTFOLIO_PAGE_SETTING_KEYS.allShowVideos, String(pageSettings.allTab.showVideos)),
        writeSiteSetting(supabase, PORTFOLIO_PAGE_SETTING_KEYS.allShowGraphics, String(pageSettings.allTab.showGraphics)),
        writeSiteSetting(supabase, PORTFOLIO_PAGE_SETTING_KEYS.allOrder, pageSettings.allTab.order),
        writeSiteSetting(
          supabase,
          HOMEPAGE_PORTFOLIO_SYSTEM_SETTING_KEY,
          serializeHomepagePortfolioSettings(nextHomepageSettings)
        ),
        writeSiteSetting(
          supabase,
          HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig,
          serializeHomepagePortfolioItemConfig(nextHomepageSettings.itemConfig)
        ),
      ];

      const tableUpdates = items.map(item => {
        const table = item.sourceType === 'video' ? 'videos' : 'graphics';
        return supabase
          .from(table)
          .update({
            visible: item.visible,
            category: item.category,
            order_num: item.order_num,
          })
          .eq('id', item.id);
      });

      await Promise.all([...settingUpdates, ...tableUpdates]);
      setPageBuilder(nextPageBuilder);
      setHomepagePortfolioSettings(nextHomepageSettings);
      await loadPortfolioSystem();
      setMsg('✅ Portfolio page system saved successfully.');
      setTimeout(() => setMsg(''), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Portfolio system save failed.';
      setMsg(`❌ ${message}`);
      setTimeout(() => setMsg(''), 4500);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !pageBuilder || !homepagePortfolioSettings) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#94a3b8',
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Portfolio builder loading...
      </div>
    );
  }

  return (
    <AdminShell
      eyebrow="Portfolio Builder"
      title="Control the portfolio archive, presentation, and page behavior"
      description="Hero, tabs, category behavior, item visibility, preview rules, CTA, and footer handoff now live inside the shared admin shell for clearer navigation across devices."
      actions={
        <>
          <Link
            href="/admin/footer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#111827',
              color: '#cbd5e1',
              border: '1px solid rgba(148,163,184,0.16)',
              padding: '11px 16px',
              borderRadius: 14,
              textDecoration: 'none',
            }}
          >
            Global Footer →
          </Link>
          <button
            onClick={savePortfolioSystem}
            disabled={saving}
            type="button"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff',
              border: 'none',
              padding: '11px 18px',
              borderRadius: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 800,
            }}
          >
            {saving ? 'Saving...' : 'Save Portfolio System'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: msg.startsWith('✅') ? 'rgba(22,163,74,0.16)' : 'rgba(127,29,29,0.2)',
              border: `1px solid ${msg.startsWith('✅') ? 'rgba(74,222,128,0.24)' : 'rgba(248,113,113,0.24)'}`,
              color: msg.startsWith('✅') ? '#86efac' : '#fecaca',
            }}
          >
            {msg}
          </div>
        ) : null}

        <AdminBuilderSection
          title="Portfolio hero / top intro"
          badge={pageBuilder.pageEnabled ? 'Live' : 'Hidden'}
          description="Page visibility, badge, title, subtitle, intro text, hero image, CTA, width, alignment and section ordering এখান থেকে control করুন।"
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageBuilder.hero.order}
                  onChange={event => updateHero('order', Number(event.target.value) || 10)}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageBuilder.hero.enabled}
                  onChange={event => updateHero('enabled', event.target.checked)}
                />
                <span>{pageBuilder.hero.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Page visibility, hero copy, intro text, and CTA content live together here.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.pageEnabled}
                      onChange={event => setPageBuilder({ ...pageBuilder, pageEnabled: event.target.checked })}
                    />
                    <span>Enable portfolio page</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.hero.showIntro}
                      onChange={event => updateHero('showIntro', event.target.checked)}
                    />
                    <span>Show intro paragraph</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.hero.showButton}
                      onChange={event => updateHero('showButton', event.target.checked)}
                    />
                    <span>Show hero CTA</span>
                  </label>
                  <Field label="Page label / badge" full>
                    <input
                      value={pageBuilder.hero.badge}
                      onChange={event => updateHero('badge', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Page title" full>
                    <textarea
                      value={pageBuilder.hero.title}
                      onChange={event => updateHero('title', event.target.value)}
                      style={textareaStyle}
                    />
                  </Field>
                  <Field label="Page subtitle" full>
                    <textarea
                      value={pageBuilder.hero.subtitle}
                      onChange={event => updateHero('subtitle', event.target.value)}
                      style={textareaStyle}
                    />
                  </Field>
                  <Field label="Intro text" full>
                    <textarea
                      value={pageBuilder.hero.introText}
                      onChange={event => updateHero('introText', event.target.value)}
                      style={textareaStyle}
                    />
                  </Field>
                  <Field label="Hero CTA text">
                    <input
                      value={pageBuilder.hero.buttonText}
                      onChange={event => updateHero('buttonText', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Hero CTA link">
                    <input
                      value={pageBuilder.hero.buttonLink}
                      onChange={event => updateHero('buttonLink', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              ),
            },
            {
              id: 'media',
              label: 'Media',
              description: 'Hero banner image upload and visibility stay in the hero card.',
              content: (
                <div style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.hero.showBannerImage}
                      onChange={event => updateHero('showBannerImage', event.target.checked)}
                    />
                    <span>Show banner image</span>
                  </label>
                  <MediaField
                    label="Hero / banner image"
                    value={pageBuilder.hero.bannerImage}
                    onChange={value => updateHero('bannerImage', value)}
                    onFileSelected={file => void handleBannerUpload(file)}
                    uploading={uploadingField === 'banner'}
                    hint="Optional cinematic banner for the portfolio hero."
                  />
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Hero layout, width, spacing, and alignment are grouped together here.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Hero layout">
                    <select
                      value={pageBuilder.hero.layout}
                      onChange={event => updateHero('layout', event.target.value as PortfolioPageHeroLayout)}
                      style={inputStyle}
                    >
                      {heroLayoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Alignment">
                    <select
                      value={pageBuilder.hero.alignment}
                      onChange={event => updateHero('alignment', event.target.value as PortfolioPageAlignment)}
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
                      value={pageBuilder.hero.width}
                      onChange={event => updateHero('width', event.target.value as PortfolioPageWidth)}
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
                      value={pageBuilder.hero.spacing}
                      onChange={event => updateHero('spacing', event.target.value as PortfolioPageSpacing)}
                      style={inputStyle}
                    >
                      {spacingOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Hero typography, colors, spacing, and CTA styling now stay inside the hero container.',
              content: (
                <PageStyleEditor
                  title="Portfolio hero styling"
                  description="Customize hero title scale, intro typography, banner color treatment, width, and CTA styling."
                  value={pageBuilder.hero.styles}
                  onChange={nextValue => updateHero('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Showcase layout + preview behavior"
          badge={pageBuilder.showcase.enabled ? 'Visible' : 'Hidden'}
          description="Grid density, card style, spacing, alignment, category filters and responsive columns configure করুন।"
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageBuilder.showcase.order}
                  onChange={event => updateShowcase('order', Number(event.target.value) || 20)}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageBuilder.showcase.enabled}
                  onChange={event => updateShowcase('enabled', event.target.checked)}
                />
                <span>{pageBuilder.showcase.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Showcase visibility, tabs, category chips, and empty-state content stay together.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.showcase.showTabs}
                      onChange={event => updateShowcase('showTabs', event.target.checked)}
                    />
                    <span>Show top tabs</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.showcase.showCategoryFilters}
                      onChange={event => updateShowcase('showCategoryFilters', event.target.checked)}
                    />
                    <span>Show category filters</span>
                  </label>
                </div>
              ),
            },
            {
              id: 'filters',
              label: 'Filters',
              description: 'Top tabs, “সব” behavior, and mixed content ordering now stay inside the showcase card.',
              content: (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {([
                      ['all', 'সব'],
                      ['video', 'ভিডিও এডিটিং'],
                      ['graphic', 'গ্রাফিক্স ডিজাইন'],
                    ] as const).map(([key, fallbackLabel]) => (
                      <div
                        key={key}
                        style={{
                          border: '1px solid rgba(148,163,184,0.14)',
                          borderRadius: 18,
                          padding: 14,
                          background: '#020617',
                          display: 'grid',
                          gap: 10,
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={pageSettings.tabs[key].enabled}
                            onChange={event => updateTab(key, { enabled: event.target.checked })}
                          />
                          <span>Show {fallbackLabel} tab</span>
                        </label>
                        <input
                          value={pageSettings.tabs[key].label}
                          onChange={event => updateTab(key, { label: event.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={pageSettings.allTab.showVideos}
                        onChange={event => updateAllTab('showVideos', event.target.checked)}
                      />
                      <span>Show videos under “সব”</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={pageSettings.allTab.showGraphics}
                        onChange={event => updateAllTab('showGraphics', event.target.checked)}
                      />
                      <span>Show graphics under “সব”</span>
                    </label>
                    <Field label="“সব” order">
                      <select
                        value={pageSettings.allTab.order}
                        onChange={event => updateAllTab('order', event.target.value as PortfolioAllOrder)}
                        style={inputStyle}
                      >
                        <option value="video-first">Videos first</option>
                        <option value="graphic-first">Graphics first</option>
                      </select>
                    </Field>
                  </div>
                </div>
              ),
            },
            {
              id: 'categories',
              label: 'Categories',
              description: 'Video and graphics category visibility, order, and custom labels now stay inside the showcase container.',
              content: (
                <div style={{ display: 'grid', gap: 10 }}>
                  {categories.map(category => {
                    const categoryKey = getPortfolioPageCategoryKey(category.type, category.slug);
                    const config = pageBuilder.categoryConfig[categoryKey] || {
                      enabled: true,
                      order: category.order_num,
                      label: category.name,
                    };

                    return (
                      <div
                        key={category.id}
                        style={{
                          padding: 14,
                          borderRadius: 18,
                          border: '1px solid rgba(148,163,184,0.14)',
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
                                padding: '4px 10px',
                                borderRadius: 999,
                                background: 'rgba(59,130,246,0.12)',
                                color: '#93c5fd',
                                textTransform: 'uppercase',
                              }}
                            >
                              {category.type}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>slug: {category.slug}</div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={config.enabled ?? true}
                            onChange={event => updateCategory(category, { enabled: event.target.checked })}
                          />
                          <span>Visible</span>
                        </label>
                        <input
                          type="number"
                          value={config.order ?? category.order_num}
                          onChange={event => updateCategory(category, { order: Number(event.target.value) || category.order_num })}
                          style={inputStyle}
                        />
                        <input
                          value={config.label || category.name}
                          onChange={event => updateCategory(category, { label: event.target.value })}
                          style={inputStyle}
                          placeholder="Custom label"
                        />
                      </div>
                    );
                  })}
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Grid density, alignment, columns, and card structure stay grouped together.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Layout preset">
                    <select
                      value={pageBuilder.showcase.layoutType}
                      onChange={event => updateShowcase('layoutType', event.target.value as PortfolioPageLayoutType)}
                      style={inputStyle}
                    >
                      {layoutTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Card style">
                    <select
                      value={pageBuilder.showcase.cardStyle}
                      onChange={event => updateShowcase('cardStyle', event.target.value as PortfolioPageCardStyle)}
                      style={inputStyle}
                    >
                      {cardStyleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Density">
                    <select
                      value={pageBuilder.showcase.density}
                      onChange={event => updateShowcase('density', event.target.value as PortfolioPageDensity)}
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
                      value={pageBuilder.showcase.gap}
                      onChange={event => updateShowcase('gap', event.target.value as PortfolioPageGap)}
                      style={inputStyle}
                    >
                      {gapOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Alignment">
                    <select
                      value={pageBuilder.showcase.alignment}
                      onChange={event => updateShowcase('alignment', event.target.value as PortfolioPageAlignment)}
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
                      value={pageBuilder.showcase.width}
                      onChange={event => updateShowcase('width', event.target.value as PortfolioPageWidth)}
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
                      value={pageBuilder.showcase.spacing}
                      onChange={event => updateShowcase('spacing', event.target.value as PortfolioPageSpacing)}
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
                      value={pageBuilder.showcase.desktopColumns}
                      onChange={event => updateShowcase('desktopColumns', Number(event.target.value) || 3)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Tablet columns">
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={pageBuilder.showcase.tabletColumns}
                      onChange={event => updateShowcase('tabletColumns', Number(event.target.value) || 2)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Mobile columns">
                    <input
                      type="number"
                      min={1}
                      max={2}
                      value={pageBuilder.showcase.mobileColumns}
                      onChange={event => updateShowcase('mobileColumns', Number(event.target.value) || 1)}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Filter chip visuals, card surfaces, and overall showcase styling stay in the showcase card.',
              content: (
                <PageStyleEditor
                  title="Showcase styling"
                  description="Adjust filter/tab visuals, category button feel, portfolio card style, modal-adjacent surfaces, and grid rhythm."
                  value={pageBuilder.showcase.styles}
                  onChange={nextValue => updateShowcase('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Bottom CTA block"
          badge={pageBuilder.cta.enabled ? 'Visible' : 'Hidden'}
          description="Portfolio page bottom CTA title, text, buttons, alignment এবং ordering এখান থেকে control হবে।"
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageBuilder.cta.order}
                  onChange={event => updateCta('order', Number(event.target.value) || 30)}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageBuilder.cta.enabled}
                  onChange={event => updateCta('enabled', event.target.checked)}
                />
                <span>{pageBuilder.cta.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'CTA copy and button labels stay inside the CTA builder.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.cta.showPrimaryButton}
                      onChange={event => updateCta('showPrimaryButton', event.target.checked)}
                    />
                    <span>Show primary button</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={pageBuilder.cta.showSecondaryButton}
                      onChange={event => updateCta('showSecondaryButton', event.target.checked)}
                    />
                    <span>Show secondary button</span>
                  </label>
                  <Field label="CTA label" full>
                    <input
                      value={pageBuilder.cta.label}
                      onChange={event => updateCta('label', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="CTA title" full>
                    <input
                      value={pageBuilder.cta.title}
                      onChange={event => updateCta('title', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="CTA description" full>
                    <textarea
                      value={pageBuilder.cta.description}
                      onChange={event => updateCta('description', event.target.value)}
                      style={textareaStyle}
                    />
                  </Field>
                  <Field label="Primary button text">
                    <input
                      value={pageBuilder.cta.primaryButtonText}
                      onChange={event => updateCta('primaryButtonText', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Primary button link">
                    <input
                      value={pageBuilder.cta.primaryButtonLink}
                      onChange={event => updateCta('primaryButtonLink', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Secondary button text">
                    <input
                      value={pageBuilder.cta.secondaryButtonText}
                      onChange={event => updateCta('secondaryButtonText', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Secondary button link">
                    <input
                      value={pageBuilder.cta.secondaryButtonLink}
                      onChange={event => updateCta('secondaryButtonLink', event.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Alignment, width, and spacing stay inside the CTA section.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Alignment">
                    <select
                      value={pageBuilder.cta.alignment}
                      onChange={event => updateCta('alignment', event.target.value as PortfolioPageAlignment)}
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
                      value={pageBuilder.cta.width}
                      onChange={event => updateCta('width', event.target.value as PortfolioPageWidth)}
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
                      value={pageBuilder.cta.spacing}
                      onChange={event => updateCta('spacing', event.target.value as PortfolioPageSpacing)}
                      style={inputStyle}
                    >
                      {spacingOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'CTA typography, background, button look, and card polish stay with the CTA block.',
              content: (
                <PageStyleEditor
                  title="Portfolio CTA styling"
                  description="Fine-tune CTA typography, background, button look, and card polish."
                  value={pageBuilder.cta.styles}
                  onChange={nextValue => updateCta('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <Panel
          title="Portfolio items"
          badge={`${items.length} items`}
          description="Each video/graphic item-এর portfolio visibility, homepage visibility, category, order, preview modal support এবং homepage order এখান থেকে control করুন।"
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setItemFilter('all')}
              style={{
                background: itemFilter === 'all' ? '#2563eb' : '#111827',
                color: '#fff',
                border: '1px solid rgba(148,163,184,0.14)',
                borderRadius: 999,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setItemFilter('video')}
              style={{
                background: itemFilter === 'video' ? '#2563eb' : '#111827',
                color: '#fff',
                border: '1px solid rgba(148,163,184,0.14)',
                borderRadius: 999,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              Videos
            </button>
            <button
              type="button"
              onClick={() => setItemFilter('graphic')}
              style={{
                background: itemFilter === 'graphic' ? '#2563eb' : '#111827',
                color: '#fff',
                border: '1px solid rgba(148,163,184,0.14)',
                borderRadius: 999,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              Graphics
            </button>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search title or category"
              style={{ ...inputStyle, maxWidth: 280 }}
            />
          </div>

          {duplicateHomepageOrders.size > 0 ? (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(127,29,29,0.18)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#fecaca',
                fontSize: 13,
              }}
            >
              Duplicate homepage order detected. Visible homepage items must keep unique `homepageOrder` values.
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 12 }}>
            {filteredItems.map(item => {
              const rowConflict = conflictItemKeys.has(itemKey(item));
              const categoryOptions = categories.filter(category =>
                category.type === 'both' || category.type === item.sourceType
              );
              const nextSuggestedOrder = nextHomepageOrder(items);

              return (
                <div
                  key={itemKey(item)}
                  style={{
                    padding: 16,
                    borderRadius: 20,
                    border: `1px solid ${rowConflict ? 'rgba(248,113,113,0.26)' : 'rgba(148,163,184,0.14)'}`,
                    background: '#020617',
                    display: 'grid',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 18 }}>{item.title}</span>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: item.sourceType === 'video' ? 'rgba(37,99,235,0.18)' : 'rgba(168,85,247,0.18)', color: item.sourceType === 'video' ? '#93c5fd' : '#d8b4fe', textTransform: 'uppercase', fontWeight: 800 }}>
                          {item.sourceType}
                        </span>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: item.visible ? 'rgba(22,163,74,0.16)' : 'rgba(71,85,105,0.22)', color: item.visible ? '#86efac' : '#cbd5e1', fontWeight: 700 }}>
                          {item.visible ? 'Portfolio Visible' : 'Portfolio Hidden'}
                        </span>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: item.homepageVisible ? 'rgba(14,165,233,0.16)' : 'rgba(71,85,105,0.22)', color: item.homepageVisible ? '#7dd3fc' : '#cbd5e1', fontWeight: 700 }}>
                          {item.homepageVisible ? 'Homepage Visible' : 'Homepage Hidden'}
                        </span>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: item.previewEnabled ? 'rgba(249,115,22,0.16)' : 'rgba(71,85,105,0.22)', color: item.previewEnabled ? '#fdba74' : '#cbd5e1', fontWeight: 700 }}>
                          {item.previewEnabled ? 'Preview On' : 'Preview Off'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        Category: {item.category || 'Uncategorized'} · Portfolio order: {item.order_num}
                      </div>
                    </div>
                    {rowConflict ? (
                      <div style={{ color: '#fca5a5', fontSize: 12, fontWeight: 700 }}>
                        Duplicate homepage order. Suggested next: {nextSuggestedOrder}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={event => updateItem(item, { visible: event.target.checked })}
                      />
                      <span>Visible on portfolio page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={item.homepageVisible}
                        onChange={event =>
                          updateItem(item, {
                            homepageVisible: event.target.checked,
                            homepageOrder:
                              event.target.checked && !item.homepageVisible
                                ? nextHomepageOrder(items)
                                : item.homepageOrder,
                          })
                        }
                      />
                      <span>Visible on homepage preview</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={item.homepageFeatured}
                        onChange={event => updateItem(item, { homepageFeatured: event.target.checked })}
                      />
                      <span>Featured on homepage</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={item.previewEnabled}
                        onChange={event => updateItem(item, { previewEnabled: event.target.checked })}
                      />
                      <span>Enable portfolio preview modal</span>
                    </label>
                    <Field label="Category">
                      <select
                        value={item.category || ''}
                        onChange={event => updateItem(item, { category: event.target.value })}
                        style={inputStyle}
                      >
                        <option value="">Uncategorized</option>
                        {categoryOptions.map(category => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Portfolio order">
                      <input
                        type="number"
                        value={item.order_num}
                        onChange={event => updateItem(item, { order_num: Number(event.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Homepage order">
                      <input
                        type="number"
                        value={item.homepageOrder}
                        onChange={event => updateItem(item, { homepageOrder: Number(event.target.value) || 1 })}
                        style={{
                          ...inputStyle,
                          borderColor: rowConflict ? 'rgba(248,113,113,0.3)' : 'rgba(148,163,184,0.16)',
                        }}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Shared footer integration"
          badge="Global Source"
          description="Portfolio page-এর footer এখন shared global footer system থেকে আসে। একবার footer update করলে homepage, about, portfolio, contact এবং tutorial সব page-এ একই footer reflect করবে।"
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/admin/footer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 46,
                padding: '12px 18px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Open Global Footer
              <span>→</span>
            </Link>
            <Link
              href="/portfolio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 46,
                padding: '12px 18px',
                borderRadius: 14,
                border: '1px solid rgba(148,163,184,0.16)',
                background: '#111827',
                color: '#e2e8f0',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Preview Portfolio Page
            </Link>
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
