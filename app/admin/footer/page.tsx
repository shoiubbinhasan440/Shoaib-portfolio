'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminShell from '@/components/admin/AdminShell';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import {
  AdminActionButton,
  AdminBuilderSection,
  AdminField,
  AdminNotice,
  AdminPreviewFrame,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import { useUnsavedChangesWarning } from '@/components/admin/useUnsavedChangesWarning';
import GlobalFooter from '@/components/shared/GlobalFooter';
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

function FooterSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminBuilderSection
      title={title}
      description={description}
      badge={badge}
      tabs={[
        {
          id: 'content',
          label: 'Content',
          description: 'All footer controls for this area stay inside one expandable section container.',
          content: children,
        },
      ]}
    />
  );
}

export default function FooterAdminPage() {
  const router = useRouter();
  const tokens = useAdminThemeTokens();
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [footerConfig, setFooterConfig] = useState<HomepageFooterSection | null>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [msg, setMsg] = useState('');

  async function loadFooter() {
    const [{ data: settingsRows }, dataset] = await Promise.all([
      supabase.from('site_settings').select('*'),
      fetchPortfolioDataset(supabase, { includeHidden: true }),
    ]);

    const map = toSettingMap(settingsRows || []);
    const totalProjects = dataset.videos.length + dataset.graphics.length;
    const nextFooter = getGlobalFooterConfig(map, { projectCount: totalProjects });

    setRawSettings(map);
    setProjectCount(totalProjects);
    setFooterConfig(nextFooter);
    setSavedSnapshot(JSON.stringify(nextFooter));
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadFooter();
      } finally {
        setLoading(false);
      }
    }

    async function verifyAndLoad() {
      const ok = await verifyAdminSessionClient();
      if (!active) {
        return;
      }
      if (!ok) {
        router.replace('/admin/login');
        return;
      }
      await load();
    }

    void verifyAndLoad();

    return () => {
      active = false;
    };
  }, [router]);

  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens);
  const hasUnsavedChanges = Boolean(
    footerConfig && JSON.stringify(footerConfig) !== savedSnapshot
  );

  useUnsavedChangesWarning(hasUnsavedChanges);

  function updateFooter<K extends keyof HomepageFooterSection>(
    key: K,
    value: HomepageFooterSection[K]
  ) {
    setFooterConfig(current => (current ? { ...current, [key]: value } : current));
  }

  async function handleLogoUpload(file: File) {
    const ext = file.name.split('.').pop() || 'png';
    const path = `footer/logo-${Date.now()}.${ext}`;
    setUploadingField('logo');

    try {
      const { publicUrl } = await adminUploadFile('media', path, file);
      updateFooter('logoUrl', publicUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Footer logo upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField('');
    }
  }

  function resetFooter() {
    const nextFooter = getGlobalFooterConfig(rawSettings, { projectCount });
    setFooterConfig(nextFooter);
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
        writeSiteSetting(supabase, 'contact_email', emailValue),
        writeSiteSetting(supabase, 'contact_phone', phoneValue),
      ]);

      await loadFooter();
      setMsg('✅ Global footer saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Footer save failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !footerConfig) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: tokens.dark ? '#020617' : '#f8fbff',
          color: tokens.muted,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        Global footer loading...
      </div>
    );
  }

  const itemCardStyle = {
    border: `1px solid ${tokens.line}`,
    borderRadius: 20,
    padding: 14,
    background: tokens.fieldSoft,
    boxShadow: tokens.softShadow,
  } as const;

  return (
    <AdminShell
      eyebrow="Global Footer System"
      title="Maintain one footer source across every public page"
      description="Homepage, portfolio, about, contact, and tutorial pages all consume this shared footer configuration. The footer builder is now clearer, theme-consistent, and easier to preview before saving."
      actions={
        <>
          <AdminActionButton onClick={resetFooter} variant="secondary">
            Reset Footer
          </AdminActionButton>
          <AdminActionButton
            onClick={() => void saveFooter()}
            disabled={saving}
            variant="primary"
          >
            {saving ? 'Saving...' : 'Save Global Footer'}
          </AdminActionButton>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? <AdminNotice message={msg} /> : null}

        <FooterSection
          title="Footer structure and brand"
          description="Set the layout, theme, logo, text, CTA, and shared footer alignment in one place."
          badge={hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
            }}
          >
            <label style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={footerConfig.enabled}
                  onChange={event => updateFooter('enabled', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Enable footer</span>
              </div>
            </label>
            <label style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={footerConfig.showDescription}
                  onChange={event => updateFooter('showDescription', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Show description</span>
              </div>
            </label>
            <label style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={footerConfig.showCta}
                  onChange={event => updateFooter('showCta', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Show footer CTA</span>
              </div>
            </label>
            <label style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={footerConfig.showQuickLinks}
                  onChange={event => updateFooter('showQuickLinks', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Show quick links</span>
              </div>
            </label>
            <label style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={footerConfig.showContact}
                  onChange={event => updateFooter('showContact', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Show contact info</span>
              </div>
            </label>
            <label style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={footerConfig.showSocial}
                  onChange={event => updateFooter('showSocial', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Show social links</span>
              </div>
            </label>
            <AdminField label="Layout preset">
              <select
                value={footerConfig.layout}
                onChange={event =>
                  updateFooter(
                    'layout',
                    event.target.value as HomepageFooterSection['layout']
                  )
                }
                style={inputStyle}
              >
                <option value="grid">Grid</option>
                <option value="stacked">Stacked</option>
              </select>
            </AdminField>
            <AdminField label="Style preset">
              <select
                value={footerConfig.stylePreset}
                onChange={event =>
                  updateFooter(
                    'stylePreset',
                    event.target.value as HomepageFooterSection['stylePreset']
                  )
                }
                style={inputStyle}
              >
                <option value="cinematic">Cinematic</option>
                <option value="minimal">Minimal</option>
                <option value="light">Light polished</option>
              </select>
            </AdminField>
            <AdminField label="Social alignment" hint="This now correctly applies to the public footer social block.">
              <select
                value={footerConfig.alignment}
                onChange={event =>
                  updateFooter(
                    'alignment',
                    event.target.value as HomepageFooterSection['alignment']
                  )
                }
                style={inputStyle}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </AdminField>
            <AdminField label="Width">
              <select
                value={footerConfig.width}
                onChange={event =>
                  updateFooter(
                    'width',
                    event.target.value as HomepageFooterSection['width']
                  )
                }
                style={inputStyle}
              >
                <option value="narrow">Narrow</option>
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
                <option value="full">Full</option>
              </select>
            </AdminField>
            <AdminField label="Spacing">
              <select
                value={footerConfig.spacing}
                onChange={event =>
                  updateFooter(
                    'spacing',
                    event.target.value as HomepageFooterSection['spacing']
                  )
                }
                style={inputStyle}
              >
                <option value="compact">Compact</option>
                <option value="balanced">Balanced</option>
                <option value="spacious">Spacious</option>
              </select>
            </AdminField>
            <AdminField label="Brand text">
              <input
                value={footerConfig.brandText}
                onChange={event => updateFooter('brandText', event.target.value)}
                style={inputStyle}
              />
            </AdminField>
            <AdminField label="Brand accent">
              <input
                value={footerConfig.brandAccent}
                onChange={event => updateFooter('brandAccent', event.target.value)}
                style={inputStyle}
              />
            </AdminField>
            <AdminField label="Description" full>
              <textarea
                value={footerConfig.description}
                onChange={event => updateFooter('description', event.target.value)}
                style={textareaStyle}
              />
            </AdminField>
            <AdminField label="CTA text">
              <input
                value={footerConfig.ctaText}
                onChange={event => updateFooter('ctaText', event.target.value)}
                style={inputStyle}
              />
            </AdminField>
            <AdminField label="CTA link">
              <input
                value={footerConfig.ctaLink}
                onChange={event => updateFooter('ctaLink', event.target.value)}
                style={inputStyle}
              />
            </AdminField>
            <AdminField label="CTA caption" full>
              <input
                value={footerConfig.ctaCaption}
                onChange={event => updateFooter('ctaCaption', event.target.value)}
                style={inputStyle}
              />
            </AdminField>
          </div>

          <div style={{ height: 18 }} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            <AdminImageField
              label="Footer logo"
              value={footerConfig.logoUrl}
              onChange={nextValue => updateFooter('logoUrl', nextValue)}
              onFileSelected={file => void handleLogoUpload(file)}
              uploading={uploadingField === 'logo'}
              onError={message => setMsg(message)}
              previewAlt={footerConfig.logoAlt || 'Footer logo'}
              hint="Optional. If added, it appears above the footer brand text."
            />
            <div style={{ display: 'grid', gap: 14 }}>
              <AdminField
                label="Footer logo alt text"
                hint="Used for accessibility if the footer logo is displayed."
              >
                <input
                  value={footerConfig.logoAlt}
                  onChange={event => updateFooter('logoAlt', event.target.value)}
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Quick links title">
                <input
                  value={footerConfig.quickLinksTitle}
                  onChange={event => updateFooter('quickLinksTitle', event.target.value)}
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Contact title">
                <input
                  value={footerConfig.contactTitle}
                  onChange={event => updateFooter('contactTitle', event.target.value)}
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Social title">
                <input
                  value={footerConfig.socialTitle}
                  onChange={event => updateFooter('socialTitle', event.target.value)}
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Copyright text">
                <input
                  value={footerConfig.copyrightText}
                  onChange={event => updateFooter('copyrightText', event.target.value)}
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Bottom note">
                <input
                  value={footerConfig.noteText}
                  onChange={event => updateFooter('noteText', event.target.value)}
                  style={inputStyle}
                />
              </AdminField>
            </div>
          </div>
        </FooterSection>

        <FooterSection
          title="Footer Preview"
          description="This preview uses the same shared footer component as the public site, so alignment and theme changes are easier to trust."
          badge="Live preview"
        >
          <AdminPreviewFrame
            title="Footer Preview"
            description="Alignment, copy, and section visibility reflect the same shared public footer component."
          >
            <div
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: `1px solid ${tokens.line}`,
              }}
            >
              <GlobalFooter config={footerConfig} />
            </div>
          </AdminPreviewFrame>
        </FooterSection>

        <FooterSection title="Quick links" description="Edit the shared links block that appears in the public footer.">
          <div style={{ display: 'grid', gap: 10 }}>
            {footerConfig.quickLinks
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(item => (
                <div key={item.id} style={itemCardStyle}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 10,
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={event =>
                          updateFooter(
                            'quickLinks',
                            footerConfig.quickLinks.map(entry =>
                              entry.id === item.id
                                ? { ...entry, enabled: event.target.checked }
                                : entry
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
                            entry.id === item.id
                              ? { ...entry, order: Number(event.target.value) || item.order }
                              : entry
                          )
                        )
                      }
                      style={inputStyle}
                    />
                    <AdminActionButton
                      onClick={() =>
                        updateFooter(
                          'quickLinks',
                          footerConfig.quickLinks.filter(entry => entry.id !== item.id)
                        )
                      }
                      variant="danger"
                    >
                      Remove
                    </AdminActionButton>
                  </div>
                </div>
              ))}
            <AdminActionButton
              onClick={() =>
                updateFooter('quickLinks', [
                  ...footerConfig.quickLinks,
                  createLinkItem('footer-link', getNextOrder(footerConfig.quickLinks)),
                ])
              }
              variant="secondary"
            >
              Add quick link
            </AdminActionButton>
          </div>
        </FooterSection>

        <FooterSection title="Social links" description="Edit the shared social block and verify its alignment in the preview above.">
          <div style={{ display: 'grid', gap: 10 }}>
            {footerConfig.socialLinks
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(item => (
                <div key={item.id} style={itemCardStyle}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 10,
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={event =>
                          updateFooter(
                            'socialLinks',
                            footerConfig.socialLinks.map(entry =>
                              entry.id === item.id
                                ? { ...entry, enabled: event.target.checked }
                                : entry
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
                            entry.id === item.id
                              ? { ...entry, order: Number(event.target.value) || item.order }
                              : entry
                          )
                        )
                      }
                      style={inputStyle}
                    />
                    <AdminActionButton
                      onClick={() =>
                        updateFooter(
                          'socialLinks',
                          footerConfig.socialLinks.filter(entry => entry.id !== item.id)
                        )
                      }
                      variant="danger"
                    >
                      Remove
                    </AdminActionButton>
                  </div>
                </div>
              ))}
            <AdminActionButton
              onClick={() =>
                updateFooter('socialLinks', [
                  ...footerConfig.socialLinks,
                  createLinkItem('footer-social', getNextOrder(footerConfig.socialLinks)),
                ])
              }
              variant="secondary"
            >
              Add social link
            </AdminActionButton>
          </div>
        </FooterSection>

        <FooterSection title="Contact items" description="Keep the footer contact info clean and in sync with your broader contact settings.">
          <div style={{ display: 'grid', gap: 10 }}>
            {footerConfig.contactItems
              .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
              .map(item => (
                <div key={item.id} style={itemCardStyle}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 10,
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={event =>
                          updateFooter(
                            'contactItems',
                            footerConfig.contactItems.map(entry =>
                              entry.id === item.id
                                ? { ...entry, enabled: event.target.checked }
                                : entry
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
                            entry.id === item.id
                              ? { ...entry, order: Number(event.target.value) || item.order }
                              : entry
                          )
                        )
                      }
                      style={inputStyle}
                    />
                    <AdminActionButton
                      onClick={() =>
                        updateFooter(
                          'contactItems',
                          footerConfig.contactItems.filter(entry => entry.id !== item.id)
                        )
                      }
                      variant="danger"
                    >
                      Remove
                    </AdminActionButton>
                  </div>
                </div>
              ))}
            <AdminActionButton
              onClick={() =>
                updateFooter('contactItems', [
                  ...footerConfig.contactItems,
                  createContactItem(getNextOrder(footerConfig.contactItems)),
                ])
              }
              variant="secondary"
            >
              Add contact item
            </AdminActionButton>
          </div>
        </FooterSection>
      </div>
    </AdminShell>
  );
}
