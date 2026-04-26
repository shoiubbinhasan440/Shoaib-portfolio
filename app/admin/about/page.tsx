'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminShell from '@/components/admin/AdminShell';
import {
  AdminBuilderSection,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import PageStyleEditor from '@/components/admin/PageStyleEditor';
import {
  ABOUT_SYSTEM_SETTING_KEY,
  createDefaultAboutSystemConfig,
  getAboutContent,
  getAboutSystemConfig,
  serializeAboutSystemConfig,
  type AboutAlignment,
  type AboutCardItem,
  type AboutLayoutMode,
  type AboutPageSectionConfig,
  type AboutSystemConfig,
  type AboutStatItem,
} from '@/lib/about-content';
import {
  HERO_SETTING_KEYS,
  getFirstSetting,
  parseStyledSetting,
  toSettingMap,
  type SettingMap,
} from '@/lib/hero-settings';
import { fetchPortfolioDataset } from '@/lib/portfolio-content';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const layoutOptions: Array<{ value: AboutLayoutMode; label: string }> = [
  { value: 'image-left', label: 'Image Left / Content Right' },
  { value: 'image-right', label: 'Image Right / Content Left' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'centered', label: 'Centered' },
  { value: 'card-left', label: 'Card Left / Content Right' },
  { value: 'card-right', label: 'Card Right / Content Left' },
  { value: 'grid', label: 'Grid' },
];

const alignmentOptions: Array<{ value: AboutAlignment; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

function createStat(): AboutStatItem {
  return {
    id: `stat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    icon: '✨',
    value: '',
    label: '',
  };
}

function createCard(): AboutCardItem {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    icon: '🎬',
    title: '',
    subtitle: '',
    description: '',
    image: '',
  };
}

export default function AdminAboutPage() {
  const router = useRouter();
  const tokens = useAdminThemeTokens();
  const [aboutSystem, setAboutSystem] = useState<AboutSystemConfig | null>(null);
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [msg, setMsg] = useState('');

  async function loadSystem() {
    const [{ data: settings }, { videos, graphics }] = await Promise.all([
      supabase.from('site_settings').select('*'),
      fetchPortfolioDataset(supabase),
    ]);

    const map = toSettingMap(settings || []);
    const statProjects = parseStyledSetting(map.stat1_label, 'Projects');
    const statClientsText = parseStyledSetting(map.stat2_label, 'Clients');
    const statYearsText = parseStyledSetting(map.stat3_label, 'Years Crafting');
    const savedClients = getFirstSetting(map, HERO_SETTING_KEYS.statClients);
    const savedYears = getFirstSetting(map, HERO_SETTING_KEYS.statYears);
    const clientCount = savedClients ? parseInt(savedClients, 10) || 50 : 50;
    const yearsCount = savedYears ? parseInt(savedYears, 10) || 3 : 3;
    const projectCount = videos.length + graphics.length;

    setRawSettings(map);
    setAboutSystem(
      getAboutSystemConfig(map, {
        projectsValue: `${projectCount}+`,
        projectsLabel: statProjects.value,
        clientsValue: `${clientCount}+`,
        clientsLabel: statClientsText.value,
        yearsValue: `${yearsCount}+`,
        yearsLabel: statYearsText.value,
      })
    );
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

  const sortedSections = useMemo(
    () => [...(aboutSystem?.pageSections || [])].sort((a, b) => a.order - b.order),
    [aboutSystem]
  );

  function updateHomepage<K extends keyof AboutSystemConfig['homepage']>(
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

  function updateSection(sectionId: string, patch: Partial<AboutPageSectionConfig>) {
    setAboutSystem(current =>
      current
        ? {
            ...current,
            pageSections: current.pageSections.map(section =>
              section.id === sectionId ? { ...section, ...patch } : section
            ),
          }
        : current
    );
  }

  function updateSectionStats(sectionId: string, stats: AboutStatItem[]) {
    updateSection(sectionId, { stats });
  }

  function updateSectionCards(sectionId: string, cards: AboutCardItem[]) {
    updateSection(sectionId, { cards });
  }

  async function uploadImage(
    fieldKey: string,
    file: File,
    onUploaded: (url: string) => void
  ) {
    const ext = file.name.split('.').pop() || 'png';
    const path = `about/${fieldKey}-${Date.now()}.${ext}`;
    setUploadingField(fieldKey);

    try {
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'About image upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField('');
    }
  }

  async function saveSystem() {
    if (!aboutSystem) {
      return;
    }

    setSaving(true);
    try {
      await writeSiteSetting(
        supabase,
        ABOUT_SYSTEM_SETTING_KEY,
        serializeAboutSystemConfig(aboutSystem)
      );
      await loadSystem();
      setMsg('✅ About system saved successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'About system save failed.';
      setMsg(`❌ ${message}`);
      setTimeout(() => setMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  }

  function resetFromFallback() {
    const fallback = createDefaultAboutSystemConfig(getAboutContent(rawSettings), {
      projectsValue: aboutSystem?.pageSections.find(section => section.type === 'stats')?.stats?.find(item => item.id === 'projects')?.value || '120+',
      projectsLabel: aboutSystem?.pageSections.find(section => section.type === 'stats')?.stats?.find(item => item.id === 'projects')?.label || 'Projects',
      clientsValue: aboutSystem?.pageSections.find(section => section.type === 'stats')?.stats?.find(item => item.id === 'clients')?.value || '50+',
      clientsLabel: aboutSystem?.pageSections.find(section => section.type === 'stats')?.stats?.find(item => item.id === 'clients')?.label || 'Clients',
      yearsValue: aboutSystem?.pageSections.find(section => section.type === 'stats')?.stats?.find(item => item.id === 'years')?.value || '3+',
      yearsLabel: aboutSystem?.pageSections.find(section => section.type === 'stats')?.stats?.find(item => item.id === 'years')?.label || 'Years Crafting',
    });
    setAboutSystem(fallback);
  }

  const panelStyle: React.CSSProperties = {
    background: tokens.panel,
    border: `1px solid ${tokens.line}`,
    borderRadius: 22,
    padding: 20,
    boxShadow: tokens.softShadow,
  };

  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens);

  if (loading || !aboutSystem) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: tokens.dark ? '#020617' : '#f8fbff',
          color: tokens.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading About system...
      </div>
    );
  }

  return (
    <AdminShell
      eyebrow="About Control Panel"
      title="Manage the homepage About block and full About page as one system"
      description="Control visibility, order, layout, alignment, stats, cards, and CTA blocks from one structured config without losing the broader admin navigation."
      actions={
        <>
          <button
            onClick={resetFromFallback}
            type="button"
            style={{ background: '#111827', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.16)', padding: '11px 16px', borderRadius: 14, cursor: 'pointer', fontWeight: 700 }}
          >
            Reset Layout
          </button>
          <button
            onClick={saveSystem}
            disabled={saving}
            type="button"
            style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 14, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800 }}
          >
            {saving ? 'Saving...' : 'Save About System'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? (
          <div style={{ ...panelStyle, borderColor: msg.startsWith('✅') ? 'rgba(34,197,94,0.24)' : 'rgba(239,68,68,0.24)', color: msg.startsWith('✅') ? '#86efac' : '#fca5a5' }}>
            {msg}
          </div>
        ) : null}

        <AdminBuilderSection
          title="Homepage About Preview"
          description="This single container controls the homepage About section including layout, copy, media, stats, highlight cards, and styling."
          badge="Homepage"
          status={aboutSystem.homepage.enabled ? 'Visible' : 'Hidden'}
          statusTone={aboutSystem.homepage.enabled ? 'success' : 'neutral'}
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={aboutSystem.homepage.order}
                  onChange={event => updateHomepage('order', Number(event.target.value))}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={aboutSystem.homepage.enabled}
                  onChange={event => updateHomepage('enabled', event.target.checked)}
                />
                <span>{aboutSystem.homepage.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Text, buttons, stats, and highlight cards for the homepage About preview live together here.',
              content: (
                <div style={{ display: 'grid', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    {[
                      ['label', 'Small Label'],
                      ['title', 'Main Title'],
                      ['role', 'Role / Subheading'],
                      ['description', 'Short Intro'],
                      ['primaryButtonText', 'Primary Button Text'],
                      ['primaryButtonLink', 'Primary Button Link'],
                      ['secondaryButtonText', 'Secondary Button Text'],
                      ['secondaryButtonLink', 'Secondary Button Link'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>{label}</div>
                        {key === 'description' ? (
                          <textarea
                            value={aboutSystem.homepage[key as keyof typeof aboutSystem.homepage] as string}
                            onChange={event =>
                              updateHomepage(
                                key as keyof typeof aboutSystem.homepage,
                                event.target.value as never
                              )
                            }
                            rows={4}
                            style={textareaStyle}
                          />
                        ) : (
                          <input
                            value={aboutSystem.homepage[key as keyof typeof aboutSystem.homepage] as string}
                            onChange={event =>
                              updateHomepage(
                                key as keyof typeof aboutSystem.homepage,
                                event.target.value as never
                              )
                            }
                            style={inputStyle}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={aboutSystem.homepage.showStats}
                        onChange={event => updateHomepage('showStats', event.target.checked)}
                      />
                      Show Stats
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={aboutSystem.homepage.showCards}
                        onChange={event => updateHomepage('showCards', event.target.checked)}
                      />
                      Show Highlight Cards
                    </label>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18 }}>Homepage Stats</h3>
                      <button
                        onClick={() =>
                          updateHomepage('stats', [...aboutSystem.homepage.stats, createStat()])
                        }
                        style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}
                      >
                        + Add Stat
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {aboutSystem.homepage.stats.map(stat => (
                        <div key={stat.id} style={{ display: 'grid', gridTemplateColumns: '96px 120px minmax(0,1fr) 40px', gap: 10 }}>
                          <input value={stat.icon || ''} onChange={event => updateHomepage('stats', aboutSystem.homepage.stats.map(item => item.id === stat.id ? { ...item, icon: event.target.value } : item))} style={inputStyle} placeholder="Icon" />
                          <input value={stat.value} onChange={event => updateHomepage('stats', aboutSystem.homepage.stats.map(item => item.id === stat.id ? { ...item, value: event.target.value } : item))} style={inputStyle} placeholder="Value" />
                          <input value={stat.label} onChange={event => updateHomepage('stats', aboutSystem.homepage.stats.map(item => item.id === stat.id ? { ...item, label: event.target.value } : item))} style={inputStyle} placeholder="Label" />
                          <button onClick={() => updateHomepage('stats', aboutSystem.homepage.stats.filter(item => item.id !== stat.id))} style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.24)', borderRadius: 10, cursor: 'pointer' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18 }}>Homepage Highlight Cards</h3>
                      <button
                        onClick={() =>
                          updateHomepage('cards', [...aboutSystem.homepage.cards, createCard()])
                        }
                        style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}
                      >
                        + Add Card
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {aboutSystem.homepage.cards.map(card => (
                        <div key={card.id} style={{ border: `1px solid ${tokens.line}`, borderRadius: 18, padding: 14, background: tokens.fieldSoft }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 40px', gap: 10, marginBottom: 10 }}>
                            <input value={card.icon || ''} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, icon: event.target.value } : item))} style={inputStyle} placeholder="Icon" />
                            <input value={card.title} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, title: event.target.value } : item))} style={inputStyle} placeholder="Title" />
                            <input value={card.subtitle || ''} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, subtitle: event.target.value } : item))} style={inputStyle} placeholder="Subtitle" />
                            <button onClick={() => updateHomepage('cards', aboutSystem.homepage.cards.filter(item => item.id !== card.id))} style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.24)', borderRadius: 10, cursor: 'pointer' }}>✕</button>
                          </div>
                          <textarea value={card.description} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, description: event.target.value } : item))} rows={3} style={{ ...textareaStyle, marginBottom: 10 }} placeholder="Description" />
                          <AdminImageField
                            label="Card image"
                            value={card.image || ''}
                            onChange={value =>
                              updateHomepage(
                                'cards',
                                aboutSystem.homepage.cards.map(item =>
                                  item.id === card.id ? { ...item, image: value } : item
                                )
                              )
                            }
                            onFileSelected={file =>
                              void uploadImage(`homepage-card-${card.id}`, file, url =>
                                updateHomepage(
                                  'cards',
                                  aboutSystem.homepage.cards.map(item =>
                                    item.id === card.id ? { ...item, image: url } : item
                                  )
                                )
                              )
                            }
                            uploading={uploadingField === `homepage-card-${card.id}`}
                            onError={message => setMsg(message)}
                            hint="Optional visual used inside this homepage highlight card."
                            previewHeight={140}
                            full
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: 'media',
              label: 'Media',
              description: 'The main image for the homepage About preview now stays inside this section container.',
              content: (
                <AdminImageField
                  label="Homepage about image"
                  value={aboutSystem.homepage.image}
                  onChange={value => updateHomepage('image', value)}
                  onFileSelected={file =>
                    void uploadImage('homepage-image', file, url => updateHomepage('image', url))
                  }
                  uploading={uploadingField === 'homepage-image'}
                  onError={message => setMsg(message)}
                  hint="This controls the main image shown in the homepage About preview."
                  full
                />
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Layout, alignment, and card count settings stay beside the content they affect.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>Layout</div>
                    <select value={aboutSystem.homepage.layout} onChange={event => updateHomepage('layout', event.target.value as AboutLayoutMode)} style={inputStyle}>
                      {layoutOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>Alignment</div>
                    <select value={aboutSystem.homepage.alignment} onChange={event => updateHomepage('alignment', event.target.value as AboutAlignment)} style={inputStyle}>
                      {alignmentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>Max Highlight Cards</div>
                    <input type="number" min={1} max={8} value={aboutSystem.homepage.maxCards} onChange={event => updateHomepage('maxCards', Number(event.target.value))} style={inputStyle} />
                  </div>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Typography, colors, buttons, and advanced styling stay with the homepage About section.',
              content: (
                <PageStyleEditor
                  title="Homepage About styling"
                  description="Adjust preview typography, background, button look, card feel, spacing, and image/text balance for the homepage About block."
                  value={aboutSystem.homepage.styles}
                  onChange={nextValue => updateHomepage('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>About Page Sections</div>
            <h2 style={{ margin: 0, fontSize: 24 }}>Modular full About page sections</h2>
            <p style={{ color: tokens.muted, margin: '8px 0 0', fontSize: 14 }}>Use order numbers, layout modes, alignment settings, and per-section design tabs without leaving the section you are editing.</p>
          </div>

          {sortedSections.map(section => (
            <AdminBuilderSection
              key={section.id}
              title={section.title || section.type}
              description={`Section type: ${section.type}. ID: ${section.id}`}
              badge={section.type}
              status={section.enabled ? 'Visible' : 'Hidden'}
              statusTone={section.enabled ? 'success' : 'neutral'}
              headerControls={
                <>
                  <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                    <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Order
                    </div>
                    <input
                      type="number"
                      value={section.order}
                      onChange={event => updateSection(section.id, { order: Number(event.target.value) })}
                      style={{ ...inputStyle, width: 92 }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={event => updateSection(section.id, { enabled: event.target.checked })}
                    />
                    <span>{section.enabled ? 'Visible' : 'Hidden'}</span>
                  </label>
                </>
              }
              tabs={[
                {
                  id: 'content',
                  label: 'Content',
                  description: 'Section copy, CTA labels, and descriptive text live together here.',
                  content: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                      {[
                        ['label', 'Label'],
                        ['title', 'Title'],
                        ['subtitle', 'Subtitle'],
                        ['primaryButtonText', 'Primary Button Text'],
                        ['primaryButtonLink', 'Primary Button Link'],
                        ['secondaryButtonText', 'Secondary Button Text'],
                        ['secondaryButtonLink', 'Secondary Button Link'],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>{label}</div>
                          <input value={(section[key as keyof AboutPageSectionConfig] as string) || ''} onChange={event => updateSection(section.id, { [key]: event.target.value } as Partial<AboutPageSectionConfig>)} style={inputStyle} />
                        </div>
                      ))}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>Description</div>
                        <textarea value={section.description || ''} onChange={event => updateSection(section.id, { description: event.target.value })} rows={4} style={textareaStyle} />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'media',
                  label: 'Media',
                  description: 'Supporting section imagery stays inside the same section container.',
                  content: (
                    <AdminImageField
                      label={`${section.title || section.type} image`}
                      value={section.image || ''}
                      onChange={value => updateSection(section.id, { image: value })}
                      onFileSelected={file =>
                        void uploadImage(`section-${section.id}`, file, url =>
                          updateSection(section.id, { image: url })
                        )
                      }
                      uploading={uploadingField === `section-${section.id}`}
                      onError={message => setMsg(message)}
                      hint="Use this when the section layout includes a supporting image."
                      previewHeight={180}
                      full
                    />
                  ),
                },
                {
                  id: 'layout',
                  label: 'Layout',
                  description: 'Layout and alignment controls stay beside the content they affect.',
                  content: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>Layout</div>
                        <select value={section.layout} onChange={event => updateSection(section.id, { layout: event.target.value as AboutLayoutMode })} style={inputStyle}>
                          {layoutOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>Alignment</div>
                        <select value={section.alignment} onChange={event => updateSection(section.id, { alignment: event.target.value as AboutAlignment })} style={inputStyle}>
                          {alignmentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ),
                },
                ...((section.type === 'stats' || section.type === 'skills' || section.type === 'services')
                  ? [
                      {
                        id: 'items',
                        label: 'Items',
                        description:
                          section.type === 'stats'
                            ? 'Stat values and labels stay in the same section container.'
                            : 'Cards and supporting visuals stay in the same section container.',
                        content: (
                          <div style={{ display: 'grid', gap: 12 }}>
                            {section.type === 'stats' ? (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                  <h4 style={{ margin: 0 }}>Stats</h4>
                                  <button onClick={() => updateSectionStats(section.id, [...(section.stats || []), createStat()])} style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>+ Add Stat</button>
                                </div>
                                <div style={{ display: 'grid', gap: 10 }}>
                                  {(section.stats || []).map(stat => (
                                    <div key={stat.id} style={{ display: 'grid', gridTemplateColumns: '96px 120px minmax(0,1fr) 40px', gap: 10 }}>
                                      <input value={stat.icon || ''} onChange={event => updateSectionStats(section.id, (section.stats || []).map(item => item.id === stat.id ? { ...item, icon: event.target.value } : item))} style={inputStyle} placeholder="Icon" />
                                      <input value={stat.value} onChange={event => updateSectionStats(section.id, (section.stats || []).map(item => item.id === stat.id ? { ...item, value: event.target.value } : item))} style={inputStyle} placeholder="Value" />
                                      <input value={stat.label} onChange={event => updateSectionStats(section.id, (section.stats || []).map(item => item.id === stat.id ? { ...item, label: event.target.value } : item))} style={inputStyle} placeholder="Label" />
                                      <button onClick={() => updateSectionStats(section.id, (section.stats || []).filter(item => item.id !== stat.id))} style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.24)', borderRadius: 10, cursor: 'pointer' }}>✕</button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                  <h4 style={{ margin: 0 }}>Cards / Items</h4>
                                  <button onClick={() => updateSectionCards(section.id, [...(section.cards || []), createCard()])} style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>+ Add Card</button>
                                </div>
                                <div style={{ display: 'grid', gap: 12 }}>
                                  {(section.cards || []).map(card => (
                                    <div key={card.id} style={{ border: `1px solid ${tokens.line}`, borderRadius: 18, padding: 14, background: tokens.fieldSoft }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 40px', gap: 10, marginBottom: 10 }}>
                                        <input value={card.icon || ''} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, icon: event.target.value } : item))} style={inputStyle} placeholder="Icon" />
                                        <input value={card.title} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, title: event.target.value } : item))} style={inputStyle} placeholder="Title" />
                                        <input value={card.subtitle || ''} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, subtitle: event.target.value } : item))} style={inputStyle} placeholder="Subtitle" />
                                        <button onClick={() => updateSectionCards(section.id, (section.cards || []).filter(item => item.id !== card.id))} style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.24)', borderRadius: 10, cursor: 'pointer' }}>✕</button>
                                      </div>
                                      <textarea value={card.description} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, description: event.target.value } : item))} rows={3} style={{ ...textareaStyle, marginBottom: 10 }} placeholder="Description" />
                                      <AdminImageField
                                        label="Card image"
                                        value={card.image || ''}
                                        onChange={value =>
                                          updateSectionCards(
                                            section.id,
                                            (section.cards || []).map(item =>
                                              item.id === card.id ? { ...item, image: value } : item
                                            )
                                          )
                                        }
                                        onFileSelected={file =>
                                          void uploadImage(`section-card-${section.id}-${card.id}`, file, url =>
                                            updateSectionCards(
                                              section.id,
                                              (section.cards || []).map(item =>
                                                item.id === card.id ? { ...item, image: url } : item
                                              )
                                            )
                                          )
                                        }
                                        uploading={uploadingField === `section-card-${section.id}-${card.id}`}
                                        onError={message => setMsg(message)}
                                        hint="Optional supporting visual for this card."
                                        previewHeight={140}
                                        full
                                      />
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ),
                      },
                    ]
                  : []),
                {
                  id: 'design',
                  label: 'Design',
                  description: 'Typography, colors, layout styling, and CTA polish stay inside the section they affect.',
                  content: (
                    <PageStyleEditor
                      title={`${section.title || section.type} styling`}
                      description="Customize this section’s typography, colors, layout width/alignment, CTA treatment, and card styling while keeping the content structure intact."
                      value={section.styles}
                      onChange={nextValue =>
                        updateSection(section.id, { styles: nextValue })
                      }
                    />
                  ),
                },
              ]}
            />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
