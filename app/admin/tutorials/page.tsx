'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminShell from '@/components/admin/AdminShell';
import PageStyleEditor from '@/components/admin/PageStyleEditor';
import { AdminBuilderSection } from '@/components/admin/admin-ui';
import {
  getTutorialCategoryConfig,
  getTutorialCategoryKey,
  getTutorialPageConfig,
  serializeTutorialPageConfig,
  TUTORIAL_PAGE_SETTING_KEY,
  type TutorialPageAlignment,
  type TutorialPageCardStyle,
  type TutorialPageConfig,
  type TutorialPageDensity,
  type TutorialPageGap,
  type TutorialPageLayoutType,
  type TutorialPageSpacing,
  type TutorialPageWidth,
} from '@/lib/tutorial-content';
import { serializeStyledSetting, toSettingMap, type SettingMap } from '@/lib/hero-settings';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TutorialRecord = {
  id: number | string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail: string;
  category: string;
  duration: string;
  level: string;
  order_num: number;
  visible: boolean;
  isNew?: boolean;
};

const alignmentOptions: Array<{ value: TutorialPageAlignment; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
];

const widthOptions: Array<{ value: TutorialPageWidth; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' },
];

const spacingOptions: Array<{ value: TutorialPageSpacing; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'spacious', label: 'Spacious' },
];

const layoutOptions: Array<{ value: TutorialPageLayoutType; label: string }> = [
  { value: 'showcase', label: 'Showcase grid' },
  { value: 'editorial', label: 'Editorial cards' },
  { value: 'compact', label: 'Compact archive' },
];

const cardStyleOptions: Array<{ value: TutorialPageCardStyle; label: string }> = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'glass', label: 'Glass' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'light', label: 'Light polished' },
];

const densityOptions: Array<{ value: TutorialPageDensity; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'spacious', label: 'Spacious' },
];

const gapOptions: Array<{ value: TutorialPageGap; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const levelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

function nextOrder<T extends { order_num: number }>(items: T[]) {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map(item => item.order_num || 0)) + 1;
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
            'All content, media, layout, and styling controls for this tutorial area stay together here.',
          content: children,
        },
      ]}
    />
  );
}

function MediaField({
  value,
  onChange,
  onFileSelected,
  uploading,
}: {
  value: string;
  onChange: (value: string) => void;
  onFileSelected: (file: File) => void;
  uploading: boolean;
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
      {value ? (
        <img
          src={value}
          alt="Tutorial thumbnail"
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
          No thumbnail selected
        </div>
      )}

      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="https://..."
        style={{
          width: '100%',
          background: '#020617',
          border: '1px solid rgba(148,163,184,0.16)',
          borderRadius: 12,
          color: '#fff',
          padding: '10px 12px',
          fontSize: 14,
          boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          background: '#111827',
          color: '#e2e8f0',
          border: '1px solid rgba(148,163,184,0.16)',
          borderRadius: 12,
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Thumbnail'}
      </button>
    </div>
  );
}

export default function AdminTutorialPage() {
  const router = useRouter();
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [pageConfig, setPageConfig] = useState<TutorialPageConfig | null>(null);
  const [tutorials, setTutorials] = useState<TutorialRecord[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'visible' | 'hidden'>('all');
  const [msg, setMsg] = useState('');

  async function loadSystem() {
    const [settingsResult, tutorialsResult] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('tutorials').select('*').order('order_num', { ascending: true }),
    ]);

    const items = (tutorialsResult.data || []) as TutorialRecord[];
    const map = toSettingMap(settingsResult.data || []);
    setRawSettings(map);
    setPageConfig(getTutorialPageConfig(map, items.filter(item => item.visible).length));
    setTutorials(items);
    setDeletedIds([]);
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    async function load() {
      try {
        await loadSystem();
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

  const categoryList = useMemo(
    () =>
      Array.from(new Set(tutorials.map(item => item.category.trim()).filter(Boolean)))
        .map(category => ({
          key: getTutorialCategoryKey(category),
          original: category,
          config: pageConfig ? getTutorialCategoryConfig(category, pageConfig.categoryConfig) : { enabled: true, order: 999, label: category },
        }))
        .sort((leftItem, rightItem) => leftItem.config.order - rightItem.config.order || leftItem.original.localeCompare(rightItem.original)),
    [pageConfig, tutorials]
  );

  const duplicateVisibleOrders = useMemo(() => {
    const counts = new Map<number, number>();
    tutorials
      .filter(item => item.visible)
      .forEach(item => {
        counts.set(item.order_num, (counts.get(item.order_num) || 0) + 1);
      });

    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([order]) => order)
    );
  }, [tutorials]);

  const filteredTutorials = useMemo(
    () =>
      tutorials.filter(item => {
        const searchText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        const matchesSearch = searchText.includes(search.toLowerCase());
        const matchesType =
          activeType === 'all' ||
          (activeType === 'visible' && item.visible) ||
          (activeType === 'hidden' && !item.visible);
        return matchesSearch && matchesType;
      }),
    [activeType, search, tutorials]
  );

  function updateHero<K extends keyof TutorialPageConfig['hero']>(
    key: K,
    value: TutorialPageConfig['hero'][K]
  ) {
    setPageConfig(current => (current ? { ...current, hero: { ...current.hero, [key]: value } } : current));
  }

  function updateShowcase<K extends keyof TutorialPageConfig['showcase']>(
    key: K,
    value: TutorialPageConfig['showcase'][K]
  ) {
    setPageConfig(current =>
      current ? { ...current, showcase: { ...current.showcase, [key]: value } } : current
    );
  }

  function updateCta<K extends keyof TutorialPageConfig['cta']>(
    key: K,
    value: TutorialPageConfig['cta'][K]
  ) {
    setPageConfig(current => (current ? { ...current, cta: { ...current.cta, [key]: value } } : current));
  }

  function updateTutorial(targetId: number | string, patch: Partial<TutorialRecord>) {
    setTutorials(current =>
      current.map(item => (item.id === targetId ? { ...item, ...patch } : item))
    );
  }

  function addTutorial() {
    setTutorials(current => [
      {
        id: `new-${Date.now()}`,
        title: 'নতুন Tutorial',
        description: '',
        youtube_url: '',
        thumbnail: '',
        category: 'General',
        duration: '',
        level: 'beginner',
        order_num: nextOrder(current),
        visible: true,
        isNew: true,
      },
      ...current,
    ]);
  }

  function removeTutorial(item: TutorialRecord) {
    const existingId = typeof item.id === 'number' ? item.id : null;
    if (!item.isNew && existingId !== null) {
      setDeletedIds(current => [...current, existingId]);
    }
    setTutorials(current => current.filter(tutorial => tutorial.id !== item.id));
  }

  async function handleThumbnailUpload(item: TutorialRecord, file: File) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `tutorials/${Date.now()}-${item.id}.${ext}`;
    setUploadingId(String(item.id));

    try {
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(path);
      updateTutorial(item.id, { thumbnail: data.publicUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Thumbnail upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingId('');
    }
  }

  async function saveTutorialSystem() {
    if (!pageConfig) {
      return;
    }

    if (duplicateVisibleOrders.size > 0) {
      setMsg('❌ Visible tutorial order must stay unique.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        writeSiteSetting(
          supabase,
          TUTORIAL_PAGE_SETTING_KEY,
          serializeTutorialPageConfig(pageConfig)
        ),
        writeSiteSetting(
          supabase,
          'tutorial_title',
          serializeStyledSetting(rawSettings.tutorial_title, pageConfig.hero.title)
        ),
        writeSiteSetting(
          supabase,
          'tutorial_subtitle',
          serializeStyledSetting(rawSettings.tutorial_subtitle, pageConfig.hero.subtitle)
        ),
        writeSiteSetting(
          supabase,
          'tutorial_coming',
          serializeStyledSetting(rawSettings.tutorial_coming, pageConfig.showcase.emptyTitle)
        ),
      ]);

      if (deletedIds.length > 0) {
        const { error } = await supabase.from('tutorials').delete().in('id', deletedIds);
        if (error) {
          throw error;
        }
      }

      for (const tutorial of tutorials) {
        const payload = {
          title: tutorial.title,
          description: tutorial.description,
          youtube_url: tutorial.youtube_url,
          thumbnail: tutorial.thumbnail,
          category: tutorial.category,
          duration: tutorial.duration,
          level: tutorial.level,
          order_num: tutorial.order_num,
          visible: tutorial.visible,
        };

        if (tutorial.isNew) {
          const { error } = await supabase.from('tutorials').insert(payload);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase.from('tutorials').update(payload).eq('id', tutorial.id);
          if (error) {
            throw error;
          }
        }
      }

      await loadSystem();
      setMsg('✅ Tutorial system saved successfully.');
      setTimeout(() => setMsg(''), 3200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tutorial save failed.';
      setMsg(`❌ ${message}`);
      setTimeout(() => setMsg(''), 4200);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !pageConfig) {
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
        Tutorial system loading...
      </div>
    );
  }

  return (
    <AdminShell
      eyebrow="Tutorial System"
      title="Manage the tutorial page builder and lesson inventory together"
      description="Hero, filters, CTA, tutorial cards, category controls, visibility, ordering, and thumbnails now stay inside the shared admin shell for cleaner mobile access."
      actions={
        <button
          onClick={saveTutorialSystem}
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
          {saving ? 'Saving...' : 'Save Tutorial System'}
        </button>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? (
          <div
            style={{
              background: '#0f172a',
              border: `1px solid ${msg.startsWith('✅') ? 'rgba(34,197,94,0.24)' : 'rgba(239,68,68,0.24)'}`,
              borderRadius: 18,
              padding: '14px 16px',
              color: msg.startsWith('✅') ? '#86efac' : '#fca5a5',
            }}
          >
            {msg}
          </div>
        ) : null}

        <Panel title="Global Tutorial Visibility" description="Whole page visibility and top-level section order.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Page Enabled">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.pageEnabled} onChange={event => setPageConfig({ ...pageConfig, pageEnabled: event.target.checked })} />
                <span>{pageConfig.pageEnabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Hero Order">
              <input type="number" value={pageConfig.hero.order} onChange={event => updateHero('order', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="Showcase Order">
              <input type="number" value={pageConfig.showcase.order} onChange={event => updateShowcase('order', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="CTA Order">
              <input type="number" value={pageConfig.cta.order} onChange={event => updateCta('order', Number(event.target.value))} style={inputStyle} />
            </Field>
          </div>
        </Panel>

        <Panel title="Hero Section" description="Page label, title, intro, hero stats and CTA.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Show Hero">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.hero.enabled} onChange={event => updateHero('enabled', event.target.checked)} />
                <span>{pageConfig.hero.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Alignment">
              <select value={pageConfig.hero.alignment} onChange={event => updateHero('alignment', event.target.value as TutorialPageAlignment)} style={inputStyle}>
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select value={pageConfig.hero.width} onChange={event => updateHero('width', event.target.value as TutorialPageWidth)} style={inputStyle}>
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select value={pageConfig.hero.spacing} onChange={event => updateHero('spacing', event.target.value as TutorialPageSpacing)} style={inputStyle}>
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label">
              <input value={pageConfig.hero.label} onChange={event => updateHero('label', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Title" full>
              <input value={pageConfig.hero.title} onChange={event => updateHero('title', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Subtitle" full>
              <input value={pageConfig.hero.subtitle} onChange={event => updateHero('subtitle', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Intro Text" full>
              <textarea value={pageConfig.hero.introText} onChange={event => updateHero('introText', event.target.value)} style={textareaStyle} />
            </Field>
            <Field label="Show Stats">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.hero.showStats} onChange={event => updateHero('showStats', event.target.checked)} />
                <span>{pageConfig.hero.showStats ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Show Hero CTA">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.hero.showPrimaryButton} onChange={event => updateHero('showPrimaryButton', event.target.checked)} />
                <span>{pageConfig.hero.showPrimaryButton ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Hero CTA Text">
              <input value={pageConfig.hero.primaryButtonText} onChange={event => updateHero('primaryButtonText', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Hero CTA Link">
              <input value={pageConfig.hero.primaryButtonLink} onChange={event => updateHero('primaryButtonLink', event.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Hero Stats</h3>
            {pageConfig.hero.stats
              .slice()
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(stat => (
                <div key={stat.id} style={{ background: '#020617', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <Field label="Value">
                      <input
                        value={stat.value}
                        onChange={event =>
                          updateHero(
                            'stats',
                            pageConfig.hero.stats.map(item =>
                              item.id === stat.id ? { ...item, value: event.target.value } : item
                            )
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Label">
                      <input
                        value={stat.label}
                        onChange={event =>
                          updateHero(
                            'stats',
                            pageConfig.hero.stats.map(item =>
                              item.id === stat.id ? { ...item, label: event.target.value } : item
                            )
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Order">
                      <input
                        type="number"
                        value={stat.order}
                        onChange={event =>
                          updateHero(
                            'stats',
                            pageConfig.hero.stats.map(item =>
                              item.id === stat.id ? { ...item, order: Number(event.target.value) } : item
                            )
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Visible">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={stat.enabled}
                          onChange={event =>
                            updateHero(
                              'stats',
                              pageConfig.hero.stats.map(item =>
                                item.id === stat.id ? { ...item, enabled: event.target.checked } : item
                              )
                            )
                          }
                        />
                        <span>{stat.enabled ? 'Visible' : 'Hidden'}</span>
                      </label>
                    </Field>
                  </div>
                </div>
              ))}
          </div>

          <PageStyleEditor
            title="Hero styling"
            description="Adjust tutorial page heading scale, highlight colors, stat card feel, and primary CTA presentation."
            value={pageConfig.hero.styles}
            onChange={nextValue => updateHero('styles', nextValue)}
          />
        </Panel>

        <Panel title="Showcase Layout + Filters" description="Tutorial filters, card presets, grid density and category visibility.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Show Showcase">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.showcase.enabled} onChange={event => updateShowcase('enabled', event.target.checked)} />
                <span>{pageConfig.showcase.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Alignment">
              <select value={pageConfig.showcase.alignment} onChange={event => updateShowcase('alignment', event.target.value as TutorialPageAlignment)} style={inputStyle}>
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select value={pageConfig.showcase.width} onChange={event => updateShowcase('width', event.target.value as TutorialPageWidth)} style={inputStyle}>
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select value={pageConfig.showcase.spacing} onChange={event => updateShowcase('spacing', event.target.value as TutorialPageSpacing)} style={inputStyle}>
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Layout Type">
              <select value={pageConfig.showcase.layoutType} onChange={event => updateShowcase('layoutType', event.target.value as TutorialPageLayoutType)} style={inputStyle}>
                {layoutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Card Style">
              <select value={pageConfig.showcase.cardStyle} onChange={event => updateShowcase('cardStyle', event.target.value as TutorialPageCardStyle)} style={inputStyle}>
                {cardStyleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Density">
              <select value={pageConfig.showcase.density} onChange={event => updateShowcase('density', event.target.value as TutorialPageDensity)} style={inputStyle}>
                {densityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Gap">
              <select value={pageConfig.showcase.gap} onChange={event => updateShowcase('gap', event.target.value as TutorialPageGap)} style={inputStyle}>
                {gapOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Desktop Columns">
              <input type="number" value={pageConfig.showcase.desktopColumns} onChange={event => updateShowcase('desktopColumns', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="Tablet Columns">
              <input type="number" value={pageConfig.showcase.tabletColumns} onChange={event => updateShowcase('tabletColumns', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="Mobile Columns">
              <input type="number" value={pageConfig.showcase.mobileColumns} onChange={event => updateShowcase('mobileColumns', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="Show Category Filters">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.showcase.showCategoryFilters} onChange={event => updateShowcase('showCategoryFilters', event.target.checked)} />
                <span>{pageConfig.showcase.showCategoryFilters ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Show Level Filters">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.showcase.showLevelFilters} onChange={event => updateShowcase('showLevelFilters', event.target.checked)} />
                <span>{pageConfig.showcase.showLevelFilters ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="All Category Label">
              <input value={pageConfig.showcase.allCategoryLabel} onChange={event => updateShowcase('allCategoryLabel', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="All Level Label">
              <input value={pageConfig.showcase.allLevelLabel} onChange={event => updateShowcase('allLevelLabel', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Empty Title" full>
              <input value={pageConfig.showcase.emptyTitle} onChange={event => updateShowcase('emptyTitle', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Empty Description" full>
              <textarea value={pageConfig.showcase.emptyDescription} onChange={event => updateShowcase('emptyDescription', event.target.value)} style={textareaStyle} />
            </Field>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Category Controls</h3>
            {categoryList.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>
                Tutorial items এ category যোগ করলে এখান থেকে homepage filter visibility/control পাওয়া যাবে।
              </div>
            ) : (
              categoryList.map(category => (
                <div key={category.key} style={{ background: '#020617', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <Field label="Original Category">
                      <input value={category.original} readOnly style={{ ...inputStyle, color: '#94a3b8' }} />
                    </Field>
                    <Field label="Display Label">
                      <input
                        value={category.config.label}
                        onChange={event =>
                          setPageConfig(current =>
                            current
                              ? {
                                  ...current,
                                  categoryConfig: {
                                    ...current.categoryConfig,
                                    [category.key]: {
                                      ...current.categoryConfig[category.key],
                                      label: event.target.value,
                                    },
                                  },
                                }
                              : current
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Order">
                      <input
                        type="number"
                        value={category.config.order}
                        onChange={event =>
                          setPageConfig(current =>
                            current
                              ? {
                                  ...current,
                                  categoryConfig: {
                                    ...current.categoryConfig,
                                    [category.key]: {
                                      ...current.categoryConfig[category.key],
                                      order: Number(event.target.value),
                                    },
                                  },
                                }
                              : current
                          )
                        }
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Visible">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={category.config.enabled}
                          onChange={event =>
                            setPageConfig(current =>
                              current
                                ? {
                                    ...current,
                                    categoryConfig: {
                                      ...current.categoryConfig,
                                      [category.key]: {
                                        ...current.categoryConfig[category.key],
                                        enabled: event.target.checked,
                                      },
                                    },
                                  }
                                : current
                            )
                          }
                        />
                        <span>{category.config.enabled ? 'Visible' : 'Hidden'}</span>
                      </label>
                    </Field>
                  </div>
                </div>
              ))
            )}
          </div>

          <PageStyleEditor
            title="Showcase styling"
            description="Refine category/filter visuals, tutorial card surfaces, grid rhythm, empty-state styling, and section width."
            value={pageConfig.showcase.styles}
            onChange={nextValue => updateShowcase('styles', nextValue)}
          />
        </Panel>

        <Panel title="Closing CTA" description="Bottom call-to-action block under tutorials.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Show CTA">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.cta.enabled} onChange={event => updateCta('enabled', event.target.checked)} />
                <span>{pageConfig.cta.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Alignment">
              <select value={pageConfig.cta.alignment} onChange={event => updateCta('alignment', event.target.value as TutorialPageAlignment)} style={inputStyle}>
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Width">
              <select value={pageConfig.cta.width} onChange={event => updateCta('width', event.target.value as TutorialPageWidth)} style={inputStyle}>
                {widthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Spacing">
              <select value={pageConfig.cta.spacing} onChange={event => updateCta('spacing', event.target.value as TutorialPageSpacing)} style={inputStyle}>
                {spacingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label">
              <input value={pageConfig.cta.label} onChange={event => updateCta('label', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Title" full>
              <input value={pageConfig.cta.title} onChange={event => updateCta('title', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Description" full>
              <textarea value={pageConfig.cta.description} onChange={event => updateCta('description', event.target.value)} style={textareaStyle} />
            </Field>
            <Field label="Show Button">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.cta.showButton} onChange={event => updateCta('showButton', event.target.checked)} />
                <span>{pageConfig.cta.showButton ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Button Text">
              <input value={pageConfig.cta.buttonText} onChange={event => updateCta('buttonText', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Button Link">
              <input value={pageConfig.cta.buttonLink} onChange={event => updateCta('buttonLink', event.target.value)} style={inputStyle} />
            </Field>
          </div>

          <PageStyleEditor
            title="Tutorial CTA styling"
            description="Tune CTA typography, background colors, button treatment, and surface polish."
            value={pageConfig.cta.styles}
            onChange={nextValue => updateCta('styles', nextValue)}
          />
        </Panel>

        <Panel title="Tutorial Items" description="Existing tutorials manage করুন: title, category, level, visibility, thumbnail, YouTube URL, and ordering.">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search tutorials..."
              style={{ ...inputStyle, maxWidth: 320 }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: `All (${tutorials.length})` },
                { key: 'visible', label: `Visible (${tutorials.filter(item => item.visible).length})` },
                { key: 'hidden', label: `Hidden (${tutorials.filter(item => !item.visible).length})` },
              ].map(filter => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveType(filter.key as 'all' | 'visible' | 'hidden')}
                  style={{
                    background: activeType === filter.key ? 'rgba(37,99,235,0.18)' : '#020617',
                    color: activeType === filter.key ? '#7dd3fc' : '#cbd5e1',
                    border: `1px solid ${activeType === filter.key ? 'rgba(59,130,246,0.32)' : 'rgba(148,163,184,0.16)'}`,
                    borderRadius: 999,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={addTutorial}
              style={{
                background: '#111827',
                color: '#e2e8f0',
                border: '1px solid rgba(148,163,184,0.16)',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              + Add Tutorial
            </button>
          </div>

          {duplicateVisibleOrders.size > 0 ? (
            <div
              style={{
                marginBottom: 16,
                borderRadius: 16,
                padding: '12px 14px',
                background: 'rgba(127,29,29,0.3)',
                border: '1px solid rgba(248,113,113,0.24)',
                color: '#fecaca',
                fontSize: 14,
              }}
            >
              Duplicate visible order detected: {Array.from(duplicateVisibleOrders).join(', ')}.
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 14 }}>
            {filteredTutorials.map(item => (
              <div key={item.id} style={{ background: '#020617', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 20, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                  <MediaField
                    value={item.thumbnail}
                    onChange={value => updateTutorial(item.id, { thumbnail: value })}
                    onFileSelected={file => void handleThumbnailUpload(item, file)}
                    uploading={uploadingId === String(item.id)}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <Field label="Title" full>
                      <input value={item.title} onChange={event => updateTutorial(item.id, { title: event.target.value })} style={inputStyle} />
                    </Field>
                    <Field label="Category">
                      <input value={item.category} onChange={event => updateTutorial(item.id, { category: event.target.value })} style={inputStyle} />
                    </Field>
                    <Field label="Level">
                      <select value={item.level} onChange={event => updateTutorial(item.id, { level: event.target.value })} style={inputStyle}>
                        {levelOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Order">
                      <input type="number" value={item.order_num} onChange={event => updateTutorial(item.id, { order_num: Number(event.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Duration">
                      <input value={item.duration} onChange={event => updateTutorial(item.id, { duration: event.target.value })} style={inputStyle} />
                    </Field>
                    <Field label="Visible">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="checkbox" checked={item.visible} onChange={event => updateTutorial(item.id, { visible: event.target.checked })} />
                        <span>{item.visible ? 'Visible' : 'Hidden'}</span>
                      </label>
                    </Field>
                    <Field label="Status">
                      <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{item.isNew ? '🆕 New' : '💾 Saved'}</span>
                      </div>
                    </Field>
                    <Field label="Quick Delete">
                      <button
                        type="button"
                        onClick={() => removeTutorial(item)}
                        style={{ ...inputStyle, cursor: 'pointer', color: '#fca5a5', background: '#1f172a' }}
                      >
                        Delete Item
                      </button>
                    </Field>
                    <Field label="YouTube URL" full>
                      <input value={item.youtube_url} onChange={event => updateTutorial(item.id, { youtube_url: event.target.value })} style={inputStyle} />
                    </Field>
                    <Field label="Description" full>
                      <textarea value={item.description} onChange={event => updateTutorial(item.id, { description: event.target.value })} style={textareaStyle} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
