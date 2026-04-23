'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
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
  const [aboutSystem, setAboutSystem] = useState<AboutSystemConfig | null>(null);
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.14)',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 18px 46px rgba(2,6,23,0.22)',
  };

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

  if (loading || !aboutSystem) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading About system...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ borderBottom: '1px solid rgba(148,163,184,0.12)', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>About Control Panel</div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.05em' }}>Homepage + About Page System</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>
            Control visibility, order, layout, alignment, stats, cards, and CTA blocks from one structured config.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background: '#111827', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.16)', padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
            ← Dashboard
          </button>
          <button onClick={resetFromFallback} style={{ background: '#111827', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.16)', padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
            Reset Layout
          </button>
          <button onClick={saveSystem} disabled={saving} style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 800 }}>
            {saving ? 'Saving...' : 'Save About System'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 22px 56px', display: 'grid', gap: 18 }}>
        {msg ? (
          <div style={{ ...panelStyle, borderColor: msg.startsWith('✅') ? 'rgba(34,197,94,0.24)' : 'rgba(239,68,68,0.24)', color: msg.startsWith('✅') ? '#86efac' : '#fca5a5' }}>
            {msg}
          </div>
        ) : null}

        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>Homepage About</div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Short premium preview block</h2>
              <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: 14 }}>This controls the homepage About section including order, layout, image side, buttons, stats and highlight cards.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
              <input type="checkbox" checked={aboutSystem.homepage.enabled} onChange={event => updateHomepage('enabled', event.target.checked)} />
              Enabled
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Section Order</div>
              <input type="number" value={aboutSystem.homepage.order} onChange={event => updateHomepage('order', Number(event.target.value))} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Layout</div>
              <select value={aboutSystem.homepage.layout} onChange={event => updateHomepage('layout', event.target.value as AboutLayoutMode)} style={inputStyle}>
                {layoutOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Alignment</div>
              <select value={aboutSystem.homepage.alignment} onChange={event => updateHomepage('alignment', event.target.value as AboutAlignment)} style={inputStyle}>
                {alignmentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Max Highlight Cards</div>
              <input type="number" min={1} max={8} value={aboutSystem.homepage.maxCards} onChange={event => updateHomepage('maxCards', Number(event.target.value))} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {[
              ['label', 'Small Label'],
              ['title', 'Main Title'],
              ['role', 'Role / Subheading'],
              ['description', 'Short Intro'],
              ['image', 'Image URL'],
              ['primaryButtonText', 'Primary Button Text'],
              ['primaryButtonLink', 'Primary Button Link'],
              ['secondaryButtonText', 'Secondary Button Text'],
              ['secondaryButtonLink', 'Secondary Button Link'],
            ].map(([key, label]) => (
              <div key={key}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
                {key === 'description' ? (
                  <textarea value={aboutSystem.homepage[key as keyof typeof aboutSystem.homepage] as string} onChange={event => updateHomepage(key as keyof typeof aboutSystem.homepage, event.target.value as never)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                ) : (
                  <input value={aboutSystem.homepage[key as keyof typeof aboutSystem.homepage] as string} onChange={event => updateHomepage(key as keyof typeof aboutSystem.homepage, event.target.value as never)} style={inputStyle} />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={aboutSystem.homepage.showStats} onChange={event => updateHomepage('showStats', event.target.checked)} />
              Show Stats
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={aboutSystem.homepage.showCards} onChange={event => updateHomepage('showCards', event.target.checked)} />
              Show Highlight Cards
            </label>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Homepage Stats</h3>
              <button onClick={() => updateHomepage('stats', [...aboutSystem.homepage.stats, createStat()])} style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
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

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Homepage Highlight Cards</h3>
              <button onClick={() => updateHomepage('cards', [...aboutSystem.homepage.cards, createCard()])} style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
                + Add Card
              </button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {aboutSystem.homepage.cards.map(card => (
                <div key={card.id} style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 40px', gap: 10, marginBottom: 10 }}>
                    <input value={card.icon || ''} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, icon: event.target.value } : item))} style={inputStyle} placeholder="Icon" />
                    <input value={card.title} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, title: event.target.value } : item))} style={inputStyle} placeholder="Title" />
                    <input value={card.subtitle || ''} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, subtitle: event.target.value } : item))} style={inputStyle} placeholder="Subtitle" />
                    <button onClick={() => updateHomepage('cards', aboutSystem.homepage.cards.filter(item => item.id !== card.id))} style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.24)', borderRadius: 10, cursor: 'pointer' }}>✕</button>
                  </div>
                  <textarea value={card.description} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, description: event.target.value } : item))} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }} placeholder="Description" />
                  <input value={card.image || ''} onChange={event => updateHomepage('cards', aboutSystem.homepage.cards.map(item => item.id === card.id ? { ...item, image: event.target.value } : item))} style={inputStyle} placeholder="Optional image URL" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>About Page Sections</div>
            <h2 style={{ margin: 0, fontSize: 24 }}>Modular full About page sections</h2>
            <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: 14 }}>Use order numbers, layout modes and alignment settings to move sections up/down and control left/right composition while keeping the UI constrained and premium.</p>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {sortedSections.map(section => (
              <article key={section.id} style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 22, padding: 18, background: '#020617' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>{section.type}</div>
                    <h3 style={{ margin: 0, fontSize: 20 }}>{section.title}</h3>
                    <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13 }}>ID: `{section.id}`</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                    <input type="checkbox" checked={section.enabled} onChange={event => updateSection(section.id, { enabled: event.target.checked })} />
                    Visible
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Order</div>
                    <input type="number" value={section.order} onChange={event => updateSection(section.id, { order: Number(event.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Layout</div>
                    <select value={section.layout} onChange={event => updateSection(section.id, { layout: event.target.value as AboutLayoutMode })} style={inputStyle}>
                      {layoutOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Alignment</div>
                    <select value={section.alignment} onChange={event => updateSection(section.id, { alignment: event.target.value as AboutAlignment })} style={inputStyle}>
                      {alignmentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Image URL</div>
                    <input value={section.image || ''} onChange={event => updateSection(section.id, { image: event.target.value })} style={inputStyle} />
                  </div>
                </div>

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
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
                      <input value={(section[key as keyof AboutPageSectionConfig] as string) || ''} onChange={event => updateSection(section.id, { [key]: event.target.value } as Partial<AboutPageSectionConfig>)} style={inputStyle} />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Description</div>
                    <textarea value={section.description || ''} onChange={event => updateSection(section.id, { description: event.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                </div>

                {(section.type === 'stats') && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
                  </div>
                )}

                {(section.type === 'skills' || section.type === 'services') && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0 }}>Cards / Items</h4>
                      <button onClick={() => updateSectionCards(section.id, [...(section.cards || []), createCard()])} style={{ background: '#111827', color: '#fff', border: '1px solid rgba(148,163,184,0.16)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>+ Add Card</button>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {(section.cards || []).map(card => (
                        <div key={card.id} style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 40px', gap: 10, marginBottom: 10 }}>
                            <input value={card.icon || ''} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, icon: event.target.value } : item))} style={inputStyle} placeholder="Icon" />
                            <input value={card.title} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, title: event.target.value } : item))} style={inputStyle} placeholder="Title" />
                            <input value={card.subtitle || ''} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, subtitle: event.target.value } : item))} style={inputStyle} placeholder="Subtitle" />
                            <button onClick={() => updateSectionCards(section.id, (section.cards || []).filter(item => item.id !== card.id))} style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.24)', borderRadius: 10, cursor: 'pointer' }}>✕</button>
                          </div>
                          <textarea value={card.description} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, description: event.target.value } : item))} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }} placeholder="Description" />
                          <input value={card.image || ''} onChange={event => updateSectionCards(section.id, (section.cards || []).map(item => item.id === card.id ? { ...item, image: event.target.value } : item))} style={inputStyle} placeholder="Optional image URL" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
