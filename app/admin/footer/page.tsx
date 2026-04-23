'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  getGlobalFooterConfig,
  GLOBAL_FOOTER_SETTING_KEY,
  serializeGlobalFooterConfig,
} from '@/lib/footer-content';
import type { HomepageFooterSection } from '@/lib/homepage-content';
import { fetchPortfolioDataset } from '@/lib/portfolio-content';
import { serializeStyledSetting, toSettingMap, type SettingMap } from '@/lib/hero-settings';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function createLinkItem(prefix: string, order: number) {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: '',
    url: '',
    enabled: true,
    order,
  };
}

function createContactItem(order: number) {
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    icon: '📍',
    label: '',
    value: '',
    enabled: true,
    order,
  };
}

function getNextOrder<T extends { order: number }>(items: T[]) {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map(item => item.order)) + 1;
}

function firstMatchingContactValue(
  items: HomepageFooterSection['contactItems'],
  matcher: (item: HomepageFooterSection['contactItems'][number]) => boolean
) {
  return (
    items
      .filter(item => item.enabled)
      .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
      .find(matcher)?.value || ''
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 24,
        padding: 22,
        boxShadow: '0 22px 60px rgba(2,6,23,0.24)',
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, letterSpacing: '-0.04em' }}>{title}</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>{description}</p>
      </div>
      {children}
    </section>
  );
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

export default function FooterAdminPage() {
  const router = useRouter();
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [footerConfig, setFooterConfig] = useState<HomepageFooterSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadFooter() {
    const [{ data: settingsRows }, dataset] = await Promise.all([
      supabase.from('site_settings').select('*'),
      fetchPortfolioDataset(supabase, { includeHidden: true }),
    ]);

    const map = toSettingMap(settingsRows || []);
    setRawSettings(map);
    setFooterConfig(
      getGlobalFooterConfig(map, {
        projectCount: dataset.videos.length + dataset.graphics.length,
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
        await loadFooter();
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

  function updateFooter<K extends keyof HomepageFooterSection>(
    key: K,
    value: HomepageFooterSection[K]
  ) {
    setFooterConfig(current => (current ? { ...current, [key]: value } : current));
  }

  async function saveFooter() {
    if (!footerConfig) {
      return;
    }

    setSaving(true);
    try {
      const emailValue = firstMatchingContactValue(
        footerConfig.contactItems,
        item => item.value.includes('@') || item.label.toLowerCase().includes('mail')
      );
      const phoneValue = firstMatchingContactValue(
        footerConfig.contactItems,
        item =>
          item.label.toLowerCase().includes('phone') ||
          item.label.toLowerCase().includes('whatsapp') ||
          /[+0-9]/.test(item.value)
      );

      await Promise.all([
        writeSiteSetting(
          supabase,
          GLOBAL_FOOTER_SETTING_KEY,
          serializeGlobalFooterConfig(footerConfig)
        ),
        writeSiteSetting(
          supabase,
          'footer_copy',
          serializeStyledSetting(rawSettings.footer_copy, footerConfig.copyrightText)
        ),
        writeSiteSetting(
          supabase,
          'contact_email',
          emailValue
        ),
        writeSiteSetting(
          supabase,
          'contact_phone',
          phoneValue
        ),
      ]);

      await loadFooter();
      setMsg('✅ Global footer saved successfully.');
      setTimeout(() => setMsg(''), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Footer save failed.';
      setMsg(`❌ ${message}`);
      setTimeout(() => setMsg(''), 4500);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !footerConfig) {
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
        Global footer loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#fff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6 }}>
            Global Footer System
          </div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.05em' }}>
            One footer source for all pages
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
            Homepage, portfolio, about, contact এবং tutorial page একই shared footer config consume করবে।
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{
              background: '#111827',
              color: '#cbd5e1',
              border: '1px solid rgba(148,163,184,0.16)',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            ← Dashboard
          </button>
          <Link
            href="/admin/homepage-portfolio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#111827',
              color: '#cbd5e1',
              border: '1px solid rgba(148,163,184,0.16)',
              padding: '10px 16px',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            Homepage Builder →
          </Link>
          <button
            onClick={saveFooter}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            {saving ? 'Saving...' : 'Save Global Footer'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 22px 56px', display: 'grid', gap: 18 }}>
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

        <Panel
          title="Global footer settings"
          description="Visibility, layout, style preset, brand text, description and shared CTA এখান থেকে control করুন।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={footerConfig.enabled}
                onChange={event => updateFooter('enabled', event.target.checked)}
              />
              <span>Enable footer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={footerConfig.showDescription}
                onChange={event => updateFooter('showDescription', event.target.checked)}
              />
              <span>Show brand description</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={footerConfig.showCta}
                onChange={event => updateFooter('showCta', event.target.checked)}
              />
              <span>Show footer CTA</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={footerConfig.showQuickLinks}
                onChange={event => updateFooter('showQuickLinks', event.target.checked)}
              />
              <span>Show quick links</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={footerConfig.showContact}
                onChange={event => updateFooter('showContact', event.target.checked)}
              />
              <span>Show contact info</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={footerConfig.showSocial}
                onChange={event => updateFooter('showSocial', event.target.checked)}
              />
              <span>Show social links</span>
            </label>
            <Field label="Footer order">
              <input
                type="number"
                value={footerConfig.order}
                onChange={event => updateFooter('order', Number(event.target.value) || 70)}
                style={inputStyle}
              />
            </Field>
            <Field label="Layout preset">
              <select
                value={footerConfig.layout}
                onChange={event => updateFooter('layout', event.target.value as HomepageFooterSection['layout'])}
                style={inputStyle}
              >
                <option value="grid">Grid</option>
                <option value="stacked">Stacked</option>
              </select>
            </Field>
            <Field label="Style preset">
              <select
                value={footerConfig.stylePreset}
                onChange={event => updateFooter('stylePreset', event.target.value as HomepageFooterSection['stylePreset'])}
                style={inputStyle}
              >
                <option value="cinematic">Cinematic</option>
                <option value="minimal">Minimal</option>
                <option value="light">Light polished</option>
              </select>
            </Field>
            <Field label="Alignment">
              <select
                value={footerConfig.alignment}
                onChange={event => updateFooter('alignment', event.target.value as HomepageFooterSection['alignment'])}
                style={inputStyle}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </Field>
            <Field label="Width">
              <select
                value={footerConfig.width}
                onChange={event => updateFooter('width', event.target.value as HomepageFooterSection['width'])}
                style={inputStyle}
              >
                <option value="narrow">Narrow</option>
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
                <option value="full">Full</option>
              </select>
            </Field>
            <Field label="Spacing">
              <select
                value={footerConfig.spacing}
                onChange={event => updateFooter('spacing', event.target.value as HomepageFooterSection['spacing'])}
                style={inputStyle}
              >
                <option value="compact">Compact</option>
                <option value="balanced">Balanced</option>
                <option value="spacious">Spacious</option>
              </select>
            </Field>
            <Field label="Brand text">
              <input value={footerConfig.brandText} onChange={event => updateFooter('brandText', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Brand accent">
              <input value={footerConfig.brandAccent} onChange={event => updateFooter('brandAccent', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Description" full>
              <textarea value={footerConfig.description} onChange={event => updateFooter('description', event.target.value)} style={textareaStyle} />
            </Field>
            <Field label="Footer CTA text">
              <input value={footerConfig.ctaText} onChange={event => updateFooter('ctaText', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Footer CTA link">
              <input value={footerConfig.ctaLink} onChange={event => updateFooter('ctaLink', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Footer CTA caption" full>
              <input value={footerConfig.ctaCaption} onChange={event => updateFooter('ctaCaption', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Copyright text" full>
              <input value={footerConfig.copyrightText} onChange={event => updateFooter('copyrightText', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Bottom note" full>
              <input value={footerConfig.noteText} onChange={event => updateFooter('noteText', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Quick links title">
              <input value={footerConfig.quickLinksTitle} onChange={event => updateFooter('quickLinksTitle', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Contact title">
              <input value={footerConfig.contactTitle} onChange={event => updateFooter('contactTitle', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Social title">
              <input value={footerConfig.socialTitle} onChange={event => updateFooter('socialTitle', event.target.value)} style={inputStyle} />
            </Field>
          </div>
        </Panel>

        <Panel title="Quick links" description="Footer quick links group edit করুন।">
          <div style={{ display: 'grid', gap: 10 }}>
            {footerConfig.quickLinks
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) minmax(0, 1fr) 90px 120px', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={event =>
                        updateFooter(
                          'quickLinks',
                          footerConfig.quickLinks.map(entry =>
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
                        footerConfig.quickLinks.map(entry =>
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
                        footerConfig.quickLinks.map(entry =>
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
                        footerConfig.quickLinks.map(entry =>
                          entry.id === item.id ? { ...entry, order: Number(event.target.value) || item.order } : entry
                        )
                      )
                    }
                    style={inputStyle}
                  />
                  <button
                    onClick={() =>
                      updateFooter(
                        'quickLinks',
                        footerConfig.quickLinks.filter(entry => entry.id !== item.id)
                      )
                    }
                    style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            <button
              onClick={() =>
                updateFooter('quickLinks', [
                  ...footerConfig.quickLinks,
                  createLinkItem('footer-link', getNextOrder(footerConfig.quickLinks)),
                ])
              }
              style={{ justifySelf: 'start', background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}
            >
              + Add quick link
            </button>
          </div>
        </Panel>

        <Panel title="Social links" description="Footer social links group edit করুন।">
          <div style={{ display: 'grid', gap: 10 }}>
            {footerConfig.socialLinks
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) minmax(0, 1fr) 90px 120px', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={event =>
                        updateFooter(
                          'socialLinks',
                          footerConfig.socialLinks.map(entry =>
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
                        footerConfig.socialLinks.map(entry =>
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
                        footerConfig.socialLinks.map(entry =>
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
                        footerConfig.socialLinks.map(entry =>
                          entry.id === item.id ? { ...entry, order: Number(event.target.value) || item.order } : entry
                        )
                      )
                    }
                    style={inputStyle}
                  />
                  <button
                    onClick={() =>
                      updateFooter(
                        'socialLinks',
                        footerConfig.socialLinks.filter(entry => entry.id !== item.id)
                      )
                    }
                    style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            <button
              onClick={() =>
                updateFooter('socialLinks', [
                  ...footerConfig.socialLinks,
                  createLinkItem('footer-social', getNextOrder(footerConfig.socialLinks)),
                ])
              }
              style={{ justifySelf: 'start', background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}
            >
              + Add social link
            </button>
          </div>
        </Panel>

        <Panel title="Contact items" description="Footer contact info globally edit করুন। এগুলো contact page fallback-এর সাথেও sync হবে।">
          <div style={{ display: 'grid', gap: 10 }}>
            {footerConfig.contactItems
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '110px 90px minmax(0, 1fr) minmax(0, 1fr) 90px 120px', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={event =>
                        updateFooter(
                          'contactItems',
                          footerConfig.contactItems.map(entry =>
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
                        footerConfig.contactItems.map(entry =>
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
                        footerConfig.contactItems.map(entry =>
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
                        footerConfig.contactItems.map(entry =>
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
                        footerConfig.contactItems.map(entry =>
                          entry.id === item.id ? { ...entry, order: Number(event.target.value) || item.order } : entry
                        )
                      )
                    }
                    style={inputStyle}
                  />
                  <button
                    onClick={() =>
                      updateFooter(
                        'contactItems',
                        footerConfig.contactItems.filter(entry => entry.id !== item.id)
                      )
                    }
                    style={{ background: '#3f0d12', color: '#fecaca', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            <button
              onClick={() =>
                updateFooter('contactItems', [
                  ...footerConfig.contactItems,
                  createContactItem(getNextOrder(footerConfig.contactItems)),
                ])
              }
              style={{ justifySelf: 'start', background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}
            >
              + Add contact item
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
