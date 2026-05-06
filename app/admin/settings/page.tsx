'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminSeoEditor from '@/components/admin/SeoEditor';
import AdminShell from '@/components/admin/AdminShell';
import { adminUploadFile } from '@/lib/admin-storage-client';
import {
  AdminActionButton,
  AdminBuilderSection,
  AdminChip,
  AdminField,
  AdminNotice,
  AdminPanel,
  AdminSectionTabs,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import { useUnsavedChangesWarning } from '@/components/admin/useUnsavedChangesWarning';
import {
  createDefaultGlobalSettingsConfig,
  getGlobalSettingsConfig,
  GLOBAL_SYSTEM_SETTINGS_KEY,
  serializeGlobalSettingsConfig,
  type GlobalSettingsConfig,
  type GlobalSettingsTab,
  type PremiumLoaderImageSource,
  type PremiumLoaderMinimumDuration,
  type PremiumLoaderRotationSpeed,
  type PremiumLoaderStyle,
} from '@/lib/global-settings';
import { toSettingMap, type SettingMap } from '@/lib/hero-settings';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs: Array<{
  description: string;
  id: GlobalSettingsTab;
  label: string;
}> = [
  {
    id: 'site-identity',
    label: 'Site Identity',
    description: 'Brand name, tagline, and public-facing identity copy',
  },
  {
    id: 'theme',
    label: 'Theme',
    description: 'Default mode, accent, and color-mode behavior',
  },
  {
    id: 'seo',
    label: 'SEO',
    description: 'Metadata, robots, sitemap, and page-level search settings',
  },
  {
    id: 'contact',
    label: 'Contact Info',
    description: 'Email, phone, WhatsApp, and location',
  },
  {
    id: 'social',
    label: 'Social Links',
    description: 'Brand social profiles used across the portfolio',
  },
  {
    id: 'uploads',
    label: 'Uploads / Media',
    description: 'Shared assets and quick access to page-specific media controls',
  },
  {
    id: 'loader',
    label: 'Loader',
    description: 'Premium portfolio loading screen behavior and visuals',
  },
  {
    id: 'admin',
    label: 'Admin Preferences',
    description: 'Language, dashboard feel, and admin behavior',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Custom scripts and maintenance notes',
  },
];

function SettingsSection({
  title,
  description,
  status,
  statusTone = 'neutral',
  children,
}: {
  title: string;
  description?: string;
  status?: string;
  statusTone?: 'accent' | 'success' | 'danger' | 'neutral';
  children: React.ReactNode;
}) {
  return (
    <AdminBuilderSection
      title={title}
      description={description}
      status={status}
      statusTone={statusTone}
      tabs={[
        {
          id: 'content',
          label: 'Content',
          description:
            'All controls for this settings area stay together inside one expandable container.',
          content: children,
        },
      ]}
    />
  );
}

export default function AdminSettingsPage() {
  const tokens = useAdminThemeTokens();
  const [rawSettings, setRawSettings] = useState<SettingMap>({});
  const [config, setConfig] = useState<GlobalSettingsConfig | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [activeTab, setActiveTab] = useState<GlobalSettingsTab>('site-identity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string>('');
  const [msg, setMsg] = useState('');
  const [whatsAppApi, setWhatsAppApi] = useState<{
    configured: boolean;
    loading: boolean;
    provider: 'twilio' | null;
    source: 'env' | 'runtime' | null;
  }>({
    configured: false,
    loading: true,
    provider: null,
    source: null,
  });
  const [whatsAppConfigForm, setWhatsAppConfigForm] = useState({
    accountSid: '',
    authToken: '',
    from: '',
  });
  const [savingWhatsAppConfig, setSavingWhatsAppConfig] = useState(false);

  async function loadSettings() {
    const { data } = await supabase.from('site_settings').select('*');
    const map = toSettingMap(data || []);
    const nextConfig = getGlobalSettingsConfig(map);
    setRawSettings(map);
    setConfig(nextConfig);
    setSavedSnapshot(JSON.stringify(nextConfig));
  }

  async function loadWhatsAppStatus() {
    try {
      const response = await fetch('/api/admin/whatsapp');
      const result = (await response.json()) as {
        configured?: boolean;
        provider?: 'twilio' | null;
        source?: 'env' | 'runtime' | null;
      };

      setWhatsAppApi({
        configured: Boolean(result.configured),
        loading: false,
        provider: result.provider || null,
        source: result.source || null,
      });
    } catch {
      setWhatsAppApi({
        configured: false,
        loading: false,
        provider: null,
        source: null,
      });
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadSettings();
        await loadWhatsAppStatus();
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const sectionDefaults = useMemo(
    () => createDefaultGlobalSettingsConfig(rawSettings),
    [rawSettings]
  );
  const hasUnsavedChanges = Boolean(
    config && JSON.stringify(config) !== savedSnapshot
  );

  useUnsavedChangesWarning(Boolean(config?.admin.warnOnUnsavedChanges && hasUnsavedChanges));

  async function saveWhatsAppConnection() {
    setSavingWhatsAppConfig(true);
    try {
      const response = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          accountSid: whatsAppConfigForm.accountSid,
          authToken: whatsAppConfigForm.authToken,
          from: whatsAppConfigForm.from,
        }),
      });

      const result = (await response.json()) as {
        configured?: boolean;
        error?: string;
        provider?: 'twilio' | null;
        source?: 'env' | 'runtime' | null;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save WhatsApp API connection.');
      }

      setWhatsAppApi({
        configured: Boolean(result.configured),
        loading: false,
        provider: result.provider || null,
        source: result.source || null,
      });
      setWhatsAppConfigForm(current => ({ ...current, authToken: '' }));
      setMsg('✅ WhatsApp API connection saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WhatsApp connection failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setSavingWhatsAppConfig(false);
    }
  }

  async function disconnectWhatsAppConnection() {
    setSavingWhatsAppConfig(true);
    try {
      const response = await fetch('/api/admin/whatsapp', { method: 'DELETE' });
      const result = (await response.json()) as {
        configured?: boolean;
        error?: string;
        provider?: 'twilio' | null;
        source?: 'env' | 'runtime' | null;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Failed to disconnect WhatsApp API.');
      }

      setWhatsAppApi({
        configured: Boolean(result.configured),
        loading: false,
        provider: result.provider || null,
        source: result.source || null,
      });
      setWhatsAppConfigForm({
        accountSid: '',
        authToken: '',
        from: '',
      });
      setMsg('✅ WhatsApp runtime connection removed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Disconnect failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setSavingWhatsAppConfig(false);
    }
  }

  async function handleImageUpload(
    field: 'logo' | 'favicon' | 'default' | keyof GlobalSettingsConfig['seo']['pages'],
    file: File
  ) {
    const ext = file.name.split('.').pop() || 'png';
    const fileKey =
      field === 'default' ? 'seo-default-og' : field;
    const path = `settings/${fileKey}-${Date.now()}.${ext}`;
    setUploadingField(field);

    try {
      const { publicUrl } = await adminUploadFile('media', path, file, {
        uploadProfile: field === 'logo' || field === 'favicon' ? 'logo' : 'showcase',
      });
      setConfig(current => {
        if (!current) {
          return current;
        }

        if (field === 'logo') {
          return {
            ...current,
            siteIdentity: { ...current.siteIdentity, logoUrl: publicUrl },
          };
        }

        if (field === 'favicon') {
          return {
            ...current,
            siteIdentity: { ...current.siteIdentity, faviconUrl: publicUrl },
          };
        }

        if (field === 'default') {
          return {
            ...current,
            seo: { ...current.seo, defaultOgImage: publicUrl },
          };
        }

        return {
          ...current,
          seo: {
            ...current.seo,
            pages: {
              ...current.seo.pages,
              [field]: {
                ...current.seo.pages[field],
                ogImage: publicUrl,
              },
            },
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Asset upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField('');
    }
  }

  async function handleLoaderImageUpload(file: File, index?: number) {
    const ext = file.name.split('.').pop() || 'png';
    const field = typeof index === 'number' ? `loader-manual-${index}` : 'loader-manual-new';
    const path = `settings/loader-${Date.now()}.${ext}`;
    setUploadingField(field);

    try {
      const { publicUrl } = await adminUploadFile('media', path, file, {
        uploadProfile: 'thumbnail',
      });

      setConfig(current => {
        if (!current) {
          return current;
        }

        const manualImages = [...current.loader.manualImages];
        if (typeof index === 'number') {
          manualImages[index] = publicUrl;
        } else {
          manualImages.push(publicUrl);
        }

        return {
          ...current,
          loader: {
            ...current.loader,
            manualImages: manualImages.filter(Boolean).slice(0, 6),
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Loader image upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField('');
    }
  }

  function resetTab(tab: GlobalSettingsTab) {
    if (!config) {
      return;
    }

    setConfig(current => {
      if (!current) {
        return current;
      }

      switch (tab) {
        case 'site-identity':
          return { ...current, siteIdentity: sectionDefaults.siteIdentity };
        case 'theme':
          return { ...current, theme: sectionDefaults.theme };
        case 'seo':
          return { ...current, seo: sectionDefaults.seo };
        case 'contact':
          return { ...current, contact: sectionDefaults.contact };
        case 'social':
          return { ...current, social: sectionDefaults.social };
        case 'uploads':
          return {
            ...current,
            siteIdentity: {
              ...current.siteIdentity,
              logoUrl: sectionDefaults.siteIdentity.logoUrl,
              faviconUrl: sectionDefaults.siteIdentity.faviconUrl,
            },
            seo: {
              ...current.seo,
              defaultOgImage: sectionDefaults.seo.defaultOgImage,
              defaultOgImageAlt: sectionDefaults.seo.defaultOgImageAlt,
            },
          };
        case 'loader':
          return { ...current, loader: sectionDefaults.loader };
        case 'admin':
          return { ...current, admin: sectionDefaults.admin };
        case 'advanced':
          return { ...current, advanced: sectionDefaults.advanced };
        default:
          return current;
      }
    });
  }

  async function saveSettings() {
    if (!config) {
      return;
    }

    setSaving(true);
    try {
      const entries: Array<[string, string]> = [
        [GLOBAL_SYSTEM_SETTINGS_KEY, serializeGlobalSettingsConfig(config)],
        ['site_name', config.siteIdentity.siteName],
        ['site_logo', config.siteIdentity.logoUrl],
        ['site_logo_alt', config.siteIdentity.logoAlt],
        ['site_favicon', config.siteIdentity.faviconUrl],
        ['site_tagline', config.siteIdentity.tagline],
        ['default_theme', config.theme.defaultTheme],
        ['accent_color', config.theme.accentColor],
        ['theme_mode_behavior', config.theme.colorModeBehavior],
        ['seo_meta_title', config.seo.siteTitle],
        ['seo_meta_description', config.seo.metaDescription],
        ['seo_social_preview_image', config.seo.defaultOgImage],
        ['seo_default_og_alt', config.seo.defaultOgImageAlt],
        ['site_canonical_url', config.seo.canonicalUrl],
        ['seo_keywords', config.seo.keywords],
        ['seo_robots_index', String(config.seo.robotsIndex)],
        ['seo_robots_follow', String(config.seo.robotsFollow)],
        ['seo_robots_noarchive', String(config.seo.robotsNoarchive)],
        ['seo_sitemap_enabled', String(config.seo.sitemapEnabled)],
        ['seo_sitemap_include_images', String(config.seo.sitemapIncludeImages)],
        ['seo_twitter_card', config.seo.twitterCard],
        ['seo_structured_data_enabled', String(config.seo.structuredDataEnabled)],
        ['seo_structured_data_type', config.seo.structuredDataType],
        ['contact_email', config.contact.email],
        ['contact_phone', config.contact.phone],
        ['contact_whatsapp', config.contact.whatsapp],
        ['contact_location', config.contact.location],
        ['social_facebook', config.social.facebook],
        ['social_youtube', config.social.youtube],
        ['social_instagram', config.social.instagram],
        ['social_linkedin', config.social.linkedIn],
        ['social_behance', config.social.behance],
        ['premium_loader_enabled', String(config.loader.enabled)],
        ['premium_loader_apply_public', String(config.loader.applyToPublic)],
        ['premium_loader_apply_admin', String(config.loader.applyToAdmin)],
        ['premium_loader_style', config.loader.style],
        ['premium_loader_text', config.loader.text],
        ['premium_loader_image_source', config.loader.imageSource],
        ['premium_loader_minimum_duration', String(config.loader.minimumDuration)],
        ['premium_loader_rotation_speed', String(config.loader.rotationSpeed)],
        ['premium_loader_show_dots', String(config.loader.showProgressDots)],
        ['premium_loader_show_ring', String(config.loader.showRotatingStroke)],
        ['admin_language', config.admin.language],
        ['admin_dashboard_style', config.admin.dashboardStyle],
        ['admin_security_summary', config.admin.securitySummary],
        ['admin_warn_unsaved_changes', String(config.admin.warnOnUnsavedChanges)],
        ['advanced_head_script', config.advanced.customHeadScript],
        ['advanced_body_script', config.advanced.customBodyScript],
        ['advanced_maintenance_note', config.advanced.maintenanceNote],
      ];

      await Promise.all(entries.map(([key, value]) => writeSiteSetting(supabase, key, value)));
      await loadSettings();
      setMsg('✅ Global settings saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Settings save failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !config) {
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
        Settings system loading...
      </div>
    );
  }

  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens);

  return (
    <AdminShell
      eyebrow="System Settings"
      title="Run site-wide identity, SEO, media, and admin behavior from one settings system"
      description="This panel keeps global settings separate from page builders, while still giving you a clear place to manage shared assets, metadata, theme defaults, and admin preferences."
      actions={
        <>
          <AdminActionButton
            onClick={() => resetTab(activeTab)}
            variant="secondary"
          >
            Reset Current Tab
          </AdminActionButton>
          <AdminActionButton
            onClick={() => void saveSettings()}
            disabled={saving}
            variant="primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </AdminActionButton>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? <AdminNotice message={msg} /> : null}

        <AdminPanel
          title="Settings sections"
          description="Each tab focuses on one part of the system so the settings page stays understandable even as it gets more advanced."
          badge={hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <AdminChip tone={hasUnsavedChanges ? 'danger' : 'success'}>
                {hasUnsavedChanges ? 'Edits not saved yet' : 'All changes saved'}
              </AdminChip>
              <AdminChip tone="neutral">
                {tabs.length} organized tabs
              </AdminChip>
            </div>
            <div style={{ color: tokens.muted, fontSize: 13 }}>
              Save feedback, resets, upload previews, and unsaved-change warnings are active.
            </div>
          </div>
          <AdminSectionTabs items={tabs} value={activeTab} onChange={setActiveTab} />
        </AdminPanel>

        {activeTab === 'site-identity' ? (
          <SettingsSection
            title="Site Identity"
            description="Keep the public brand name, tagline, and accessible asset labels consistent."
            status={activeTab === 'site-identity' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'site-identity' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              <AdminField
                label="Site name"
                hint="Used in the navbar, metadata defaults, and brand references."
              >
                <input
                  value={config.siteIdentity.siteName}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            siteIdentity: {
                              ...current.siteIdentity,
                              siteName: event.target.value,
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
              <AdminField
                label="Logo alt text"
                hint="This describes the brand logo wherever it is shown."
              >
                <input
                  value={config.siteIdentity.logoAlt}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            siteIdentity: {
                              ...current.siteIdentity,
                              logoAlt: event.target.value,
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Tagline" full hint="Short brand positioning copy used in shared settings and previews.">
                <input
                  value={config.siteIdentity.tagline}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            siteIdentity: {
                              ...current.siteIdentity,
                              tagline: event.target.value,
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === 'theme' ? (
          <SettingsSection
            title="Theme"
            description="Choose the default experience for visitors and keep the global accent direction predictable."
            status={activeTab === 'theme' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'theme' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              <AdminField label="Default theme" hint="What the site uses before a visitor changes it.">
                <select
                  value={config.theme.defaultTheme}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            theme: {
                              ...current.theme,
                              defaultTheme:
                                event.target.value as GlobalSettingsConfig['theme']['defaultTheme'],
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </AdminField>
              <AdminField label="Color-mode behavior" hint="Decide whether visitors can toggle or must follow the default.">
                <select
                  value={config.theme.colorModeBehavior}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            theme: {
                              ...current.theme,
                              colorModeBehavior:
                                event.target.value as GlobalSettingsConfig['theme']['colorModeBehavior'],
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                >
                  <option value="user-toggle">Allow user toggle</option>
                  <option value="follow-default">Follow default theme</option>
                  <option value="locked">Lock to default theme</option>
                </select>
              </AdminField>
              <AdminField label="Accent color" hint="Stored globally for shared brand color usage.">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={config.theme.accentColor}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              theme: {
                                ...current.theme,
                                accentColor: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                    style={{
                      width: 48,
                      height: 48,
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                    }}
                  />
                  <input
                    value={config.theme.accentColor}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              theme: {
                                ...current.theme,
                                accentColor: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  />
                </div>
              </AdminField>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === 'seo' ? (
          <SettingsSection
            title="SEO"
            description="Configure practical metadata, crawl hints, page-level titles and social previews without making unrealistic ranking claims."
            status={activeTab === 'seo' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'seo' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <AdminSeoEditor
              value={config.seo}
              siteName={config.siteIdentity.siteName}
              uploadingField={uploadingField}
              onError={message => setMsg(message)}
              onImageUpload={(scope, file) => void handleImageUpload(scope, file)}
              onChange={nextSeo =>
                setConfig(current =>
                  current ? { ...current, seo: nextSeo } : current
                )
              }
            />
          </SettingsSection>
        ) : null}

        {activeTab === 'contact' ? (
          <SettingsSection
            title="Contact Info"
            description="Shared contact details used across the site, footer, and lead flow."
            status={activeTab === 'contact' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'contact' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              <AdminField label="Email">
                <input
                  value={config.contact.email}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            contact: { ...current.contact, email: event.target.value },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Phone">
                <input
                  value={config.contact.phone}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            contact: { ...current.contact, phone: event.target.value },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="WhatsApp">
                <input
                  value={config.contact.whatsapp}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            contact: { ...current.contact, whatsapp: event.target.value },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
              <AdminField label="Location" full>
                <input
                  value={config.contact.location}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            contact: { ...current.contact, location: event.target.value },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                />
              </AdminField>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === 'social' ? (
          <SettingsSection
            title="Social Links"
            description="Keep profile URLs consistent across footer, contact areas, and metadata."
            status={activeTab === 'social' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'social' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              {([
                ['facebook', 'Facebook'],
                ['youtube', 'YouTube'],
                ['instagram', 'Instagram'],
                ['linkedIn', 'LinkedIn'],
                ['behance', 'Behance'],
              ] as const).map(([key, label]) => (
                <AdminField key={key} label={label}>
                  <input
                    value={config.social[key]}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              social: { ...current.social, [key]: event.target.value },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  />
                </AdminField>
              ))}
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === 'uploads' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <SettingsSection
              title="Shared Asset Hub"
              description="Manage the global logo, favicon, and default social preview here. Page-specific images stay in their own builders so the system remains understandable."
              status={hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
              statusTone={hasUnsavedChanges ? 'danger' : 'success'}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                <AdminImageField
                  label="Site logo"
                  value={config.siteIdentity.logoUrl}
                  onChange={nextValue =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            siteIdentity: { ...current.siteIdentity, logoUrl: nextValue },
                          }
                        : current
                    )
                  }
                  onFileSelected={file => void handleImageUpload('logo', file)}
                  uploading={uploadingField === 'logo'}
                  onError={message => setMsg(message)}
                  uploadProfile="logo"
                  previewAlt={config.siteIdentity.logoAlt}
                />
                <AdminImageField
                  label="Favicon"
                  value={config.siteIdentity.faviconUrl}
                  onChange={nextValue =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            siteIdentity: { ...current.siteIdentity, faviconUrl: nextValue },
                          }
                        : current
                    )
                  }
                  onFileSelected={file => void handleImageUpload('favicon', file)}
                  uploading={uploadingField === 'favicon'}
                  onError={message => setMsg(message)}
                  uploadProfile="logo"
                  previewAlt="Site favicon"
                  previewHeight={140}
                />
                <AdminImageField
                  label="Default social preview"
                  value={config.seo.defaultOgImage}
                  onChange={nextValue =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            seo: { ...current.seo, defaultOgImage: nextValue },
                          }
                        : current
                    )
                  }
                  onFileSelected={file => void handleImageUpload('default', file)}
                  uploading={uploadingField === 'default'}
                  onError={message => setMsg(message)}
                  uploadProfile="showcase"
                  previewAlt={config.seo.defaultOgImageAlt || 'Default social preview image'}
                />
              </div>
            </SettingsSection>

            <SettingsSection
              title="Page-Specific Media Shortcuts"
              description="Use these dedicated builders when you need to change hero images, about images, thumbnails, portfolio graphics, or footer-specific media."
              status="Shortcuts"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <AdminActionButton href="/admin/homepage-portfolio" variant="secondary">
                  Homepage Builder
                </AdminActionButton>
                <AdminActionButton href="/admin/about" variant="secondary">
                  About Builder
                </AdminActionButton>
                <AdminActionButton href="/admin/contact" variant="secondary">
                  Contact Builder
                </AdminActionButton>
                <AdminActionButton href="/admin/portfolio" variant="secondary">
                  Portfolio Builder
                </AdminActionButton>
                <AdminActionButton href="/admin/footer" variant="secondary">
                  Footer Builder
                </AdminActionButton>
                <AdminActionButton href="/admin/tutorials" variant="secondary">
                  Tutorial Workspace
                </AdminActionButton>
                <AdminActionButton href="/admin/videos" variant="secondary">
                  Video Manager
                </AdminActionButton>
                <AdminActionButton href="/admin/graphics" variant="secondary">
                  Graphics Manager
                </AdminActionButton>
              </div>
            </SettingsSection>
          </div>
        ) : null}

        {activeTab === 'loader' ? (
          <SettingsSection
            title="Premium Portfolio Loader"
            description="Control the cinematic loading screen shown by route loading boundaries and fallback homepage loading states."
            status={config.loader.enabled ? 'Enabled' : 'Disabled'}
            statusTone={config.loader.enabled ? 'success' : 'neutral'}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}
              >
                <label
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.loader.enabled}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: { ...current.loader, enabled: event.target.checked },
                            }
                          : current
                      )
                    }
                  />
                  <span>
                    <strong>Enable premium loader</strong>
                    <span style={{ display: 'block', color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                      Shows the portfolio circle loader during route/page loading.
                    </span>
                  </span>
                </label>

                <label
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.loader.applyToPublic}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: { ...current.loader, applyToPublic: event.target.checked },
                            }
                          : current
                      )
                    }
                  />
                  <span>
                    <strong>Apply to public site</strong>
                    <span style={{ display: 'block', color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                      Enables the loader for Home, Portfolio, About, Contact, Tutorial, and category pages.
                    </span>
                  </span>
                </label>

                <label
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.loader.applyToAdmin}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: { ...current.loader, applyToAdmin: event.target.checked },
                            }
                          : current
                      )
                    }
                  />
                  <span>
                    <strong>Apply to admin panel</strong>
                    <span style={{ display: 'block', color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                      Enables the same premium loader for admin navigation and admin route loading.
                    </span>
                  </span>
                </label>

                <label
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.loader.showRotatingStroke}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: {
                                ...current.loader,
                                showRotatingStroke: event.target.checked,
                              },
                            }
                          : current
                      )
                    }
                  />
                  <span>
                    <strong>Show rotating stroke</strong>
                    <span style={{ display: 'block', color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                      Adds the animated gradient ring around the circular preview.
                    </span>
                  </span>
                </label>

                <label
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.loader.showProgressDots}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: { ...current.loader, showProgressDots: event.target.checked },
                            }
                          : current
                      )
                    }
                  />
                  <span>
                    <strong>Show progress dots</strong>
                    <span style={{ display: 'block', color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                      Small dots track which portfolio preview is currently visible.
                    </span>
                  </span>
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}
              >
                <AdminField label="Loader style">
                  <select
                    value={config.loader.style}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: {
                                ...current.loader,
                                style: event.target.value as PremiumLoaderStyle,
                              },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="portfolio-circle">Portfolio Circle</option>
                    <option value="simple-line">Simple Line</option>
                    <option value="minimal-fade">Minimal Fade</option>
                  </select>
                </AdminField>

                <AdminField label="Loader image source">
                  <select
                    value={config.loader.imageSource}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: {
                                ...current.loader,
                                imageSource: event.target.value as PremiumLoaderImageSource,
                              },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="graphics-only">Graphics only</option>
                    <option value="manual">Manual uploaded images</option>
                    <option value="profile-fallback">Profile fallback</option>
                  </select>
                </AdminField>

                <AdminField label="Rotation speed">
                  <select
                    value={config.loader.rotationSpeed}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: {
                                ...current.loader,
                                rotationSpeed: Number(
                                  event.target.value
                                ) as PremiumLoaderRotationSpeed,
                              },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  >
                    <option value={300} disabled>Default · 300ms</option>
                    <option value={250}>Ultra Fast · 250ms</option>
                    <option value={400}>Fast · 400ms</option>
                    <option value={800}>Normal · 800ms</option>
                    <option value={1200}>Slow · 1200ms</option>
                  </select>
                </AdminField>

                <AdminField label="Loader duration minimum">
                  <select
                    value={config.loader.minimumDuration}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: {
                                ...current.loader,
                                minimumDuration: Number(
                                  event.target.value
                                ) as PremiumLoaderMinimumDuration,
                              },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  >
                    <option value={500}>500ms</option>
                    <option value={800}>800ms</option>
                    <option value={1200}>1200ms</option>
                  </select>
                </AdminField>

                <AdminField label="Loader text" full>
                  <input
                    value={config.loader.text}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              loader: { ...current.loader, text: event.target.value },
                            }
                          : current
                      )
                    }
                    style={inputStyle}
                  />
                </AdminField>
              </div>

              <div
                style={{
                  border: `1px solid ${tokens.line}`,
                  borderRadius: 20,
                  background: tokens.fieldSoft,
                  padding: 16,
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Manual Loader Images</h3>
                    <p style={{ margin: '6px 0 0', color: tokens.muted, fontSize: 13, lineHeight: 1.6 }}>
                      Optional small images for the loader. Keep these compressed thumbnails; portfolio/video originals are not loaded here.
                    </p>
                  </div>
                  <AdminChip tone="neutral">{config.loader.manualImages.length}/6 images</AdminChip>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14,
                  }}
                >
                  {config.loader.manualImages.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} style={{ display: 'grid', gap: 10 }}>
                      <AdminImageField
                        label={`Loader image ${index + 1}`}
                        value={imageUrl}
                        onChange={nextValue =>
                          setConfig(current => {
                            if (!current) {
                              return current;
                            }

                            const manualImages = [...current.loader.manualImages];
                            manualImages[index] = nextValue;
                            return {
                              ...current,
                              loader: {
                                ...current.loader,
                                manualImages: manualImages.filter(Boolean).slice(0, 6),
                              },
                            };
                          })
                        }
                        onFileSelected={file => void handleLoaderImageUpload(file, index)}
                        uploading={uploadingField === `loader-manual-${index}`}
                        onError={message => setMsg(message)}
                        uploadProfile="thumbnail"
                        previewAlt={`Loader image ${index + 1}`}
                        previewHeight={140}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConfig(current =>
                            current
                              ? {
                                  ...current,
                                  loader: {
                                    ...current.loader,
                                    manualImages: current.loader.manualImages.filter(
                                      (_, imageIndex) => imageIndex !== index
                                    ),
                                  },
                                }
                              : current
                          )
                        }
                        style={{
                          border: `1px solid ${tokens.line}`,
                          background: tokens.fieldSoft,
                          color: tokens.text,
                          borderRadius: 12,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontWeight: 800,
                        }}
                      >
                        Remove image
                      </button>
                    </div>
                  ))}

                  {config.loader.manualImages.length < 6 ? (
                    <AdminImageField
                      label="Add manual loader image"
                      value=""
                      onChange={nextValue =>
                        setConfig(current =>
                          current && nextValue
                            ? {
                                ...current,
                                loader: {
                                  ...current.loader,
                                  manualImages: [
                                    ...current.loader.manualImages,
                                    nextValue,
                                  ].filter(Boolean).slice(0, 6),
                                },
                              }
                            : current
                        )
                      }
                      onFileSelected={file => void handleLoaderImageUpload(file)}
                      uploading={uploadingField === 'loader-manual-new'}
                      onError={message => setMsg(message)}
                      uploadProfile="thumbnail"
                      previewAlt="New loader image"
                      previewHeight={140}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === 'admin' ? (
          <SettingsSection
            title="Admin Preferences"
            description="Fine-tune how the admin experience behaves for your day-to-day editing workflow."
            status={activeTab === 'admin' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'admin' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              <AdminField label="Language">
                <select
                  value={config.admin.language}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            admin: {
                              ...current.admin,
                              language:
                                event.target.value as GlobalSettingsConfig['admin']['language'],
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                >
                  <option value="en">English</option>
                  <option value="bn">Bangla</option>
                </select>
              </AdminField>
              <AdminField label="Dashboard style">
                <select
                  value={config.admin.dashboardStyle}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            admin: {
                              ...current.admin,
                              dashboardStyle:
                                event.target.value as GlobalSettingsConfig['admin']['dashboardStyle'],
                            },
                          }
                        : current
                    )
                  }
                  style={inputStyle}
                >
                  <option value="immersive">Immersive</option>
                  <option value="balanced">Balanced</option>
                  <option value="compact">Compact</option>
                </select>
              </AdminField>
              <label
                style={{
                  borderRadius: 20,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.fieldSoft,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: tokens.softShadow,
                }}
              >
                <input
                  type="checkbox"
                  checked={config.admin.warnOnUnsavedChanges}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            admin: {
                              ...current.admin,
                              warnOnUnsavedChanges: event.target.checked,
                            },
                          }
                        : current
                    )
                  }
                />
                <span style={{ fontWeight: 700 }}>Warn before losing unsaved edits</span>
              </label>
              <AdminField label="Security summary" full hint="Keep a plain-language reminder of how admin and client access currently works.">
                <textarea
                  value={config.admin.securitySummary}
                  onChange={event =>
                    setConfig(current =>
                      current
                        ? {
                            ...current,
                            admin: {
                              ...current.admin,
                              securitySummary: event.target.value,
                            },
                          }
                        : current
                    )
                  }
                  style={textareaStyle}
                />
              </AdminField>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === 'advanced' ? (
          <SettingsSection
            title="Advanced"
            description="Use this area for trusted custom snippets, integrations, or operational notes. Keep these changes deliberate."
            status={activeTab === 'advanced' && hasUnsavedChanges ? 'Unsaved changes' : 'Ready'}
            statusTone={activeTab === 'advanced' && hasUnsavedChanges ? 'danger' : 'success'}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <AdminField label="Custom <head> script" hint="Only add code you trust and really need.">
                  <textarea
                    value={config.advanced.customHeadScript}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              advanced: {
                                ...current.advanced,
                                customHeadScript: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                    style={textareaStyle}
                  />
                </AdminField>
                <AdminField label="Custom body script" hint="Useful for verified widgets or analytics snippets.">
                  <textarea
                    value={config.advanced.customBodyScript}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              advanced: {
                                ...current.advanced,
                                customBodyScript: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                    style={textareaStyle}
                  />
                </AdminField>
                <AdminField label="Maintenance note" hint="A private reminder for future admin work or rollout notes.">
                  <textarea
                    value={config.advanced.maintenanceNote}
                    onChange={event =>
                      setConfig(current =>
                        current
                          ? {
                              ...current,
                              advanced: {
                                ...current.advanced,
                                maintenanceNote: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                    style={textareaStyle}
                  />
                </AdminField>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.fieldSoft,
                  padding: 18,
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
                      WhatsApp API
                    </div>
                    <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                      Manage direct WhatsApp reply credentials from Settings so inbox stays focused on lead handling.
                    </div>
                  </div>
                  <AdminChip tone={whatsAppApi.configured ? 'success' : 'neutral'}>
                    {whatsAppApi.loading
                      ? 'Checking...'
                      : whatsAppApi.configured
                        ? `Connected ${whatsAppApi.source === 'env' ? '(env)' : '(settings saved)'}`
                        : 'Not connected'}
                  </AdminChip>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  <AdminField label="Twilio Account SID">
                    <input
                      value={whatsAppConfigForm.accountSid}
                      onChange={event =>
                        setWhatsAppConfigForm(current => ({
                          ...current,
                          accountSid: event.target.value,
                        }))
                      }
                      style={inputStyle}
                      placeholder="ACxxxxxxxxxxxxxxxx"
                    />
                  </AdminField>
                  <AdminField label="Twilio Auth Token">
                    <input
                      value={whatsAppConfigForm.authToken}
                      onChange={event =>
                        setWhatsAppConfigForm(current => ({
                          ...current,
                          authToken: event.target.value,
                        }))
                      }
                      style={inputStyle}
                      type="password"
                      placeholder="Auth token"
                    />
                  </AdminField>
                  <AdminField label="WhatsApp Sender Number">
                    <input
                      value={whatsAppConfigForm.from}
                      onChange={event =>
                        setWhatsAppConfigForm(current => ({
                          ...current,
                          from: event.target.value,
                        }))
                      }
                      style={inputStyle}
                      placeholder="+1415..."
                    />
                  </AdminField>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <AdminActionButton
                    onClick={() => void saveWhatsAppConnection()}
                    disabled={
                      savingWhatsAppConfig ||
                      !whatsAppConfigForm.accountSid.trim() ||
                      !whatsAppConfigForm.authToken.trim() ||
                      !whatsAppConfigForm.from.trim()
                    }
                    variant="primary"
                  >
                    {savingWhatsAppConfig ? 'Saving...' : 'Connect WhatsApp API'}
                  </AdminActionButton>
                  <AdminActionButton
                    onClick={() => void disconnectWhatsAppConnection()}
                    disabled={savingWhatsAppConfig || whatsAppApi.source !== 'runtime'}
                    variant="secondary"
                  >
                    Disconnect
                  </AdminActionButton>
                  <AdminActionButton href="/admin/inbox" variant="ghost">
                    Open Inbox
                  </AdminActionButton>
                </div>

                <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.8 }}>
                  {whatsAppApi.loading
                    ? 'Checking WhatsApp API status...'
                    : whatsAppApi.configured
                      ? `Direct send is active via ${whatsAppApi.provider}. ${whatsAppApi.source === 'env' ? 'Environment variables are currently taking priority.' : 'Runtime credentials saved from settings are active.'}`
                      : 'No direct WhatsApp API connection is active yet. Inbox will keep showing the fallback Open WhatsApp action until you connect it here.'}
                </div>
              </div>
            </div>
          </SettingsSection>
        ) : null}
      </div>
    </AdminShell>
  );
}
