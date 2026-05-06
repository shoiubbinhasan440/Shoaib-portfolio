'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminShell from '@/components/admin/AdminShell';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import {
  AdminBuilderSection,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import PageStyleEditor from '@/components/admin/PageStyleEditor';
import {
  CONTACT_PAGE_SETTING_KEY,
  getContactPageConfig,
  type ContactAlignment,
  type ContactInfoCard,
  type ContactLayoutMode,
  type ContactLinkItem,
  type ContactPageConfig,
  serializeContactPageConfig,
} from '@/lib/contact-content';
import { toSettingMap } from '@/lib/hero-settings';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const layoutOptions: Array<{ value: ContactLayoutMode; label: string }> = [
  { value: 'split', label: 'Split layout' },
  { value: 'stacked', label: 'Stacked layout' },
  { value: 'centered', label: 'Centered layout' },
  { value: 'card-left', label: 'Card left / content right' },
  { value: 'card-right', label: 'Card right / content left' },
];

const alignmentOptions: Array<{ value: ContactAlignment; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
];

function createInfoCard(order: number): ContactInfoCard {
  return {
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    icon: '✦',
    title: '',
    value: '',
    href: '',
    description: '',
    enabled: true,
    order,
  };
}

function createSocialLink(order: number): ContactLinkItem {
  return {
    id: `social-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    url: '',
    icon: '•',
    enabled: true,
    order,
  };
}

function nextOrder<T extends { order: number }>(items: T[]) {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map(item => item.order)) + 1;
}

function firstEnabledValue(
  cards: ContactInfoCard[],
  matcher: (card: ContactInfoCard) => boolean
) {
  return (
    cards
      .filter(card => card.enabled)
      .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
      .find(matcher)?.value || ''
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
  const tokens = useAdminThemeTokens();

  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
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
    <AdminBuilderSection
      title={title}
      description={description}
      tabs={[
        {
          id: 'content',
          label: 'Content',
          description:
            'All controls related to this contact admin area stay inside one expandable container.',
          content: children,
        },
      ]}
    />
  );
}

export default function ContactAdminPage() {
  const router = useRouter();
  const tokens = useAdminThemeTokens();
  const [pageConfig, setPageConfig] = useState<ContactPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function loadSystem() {
    const { data: settingsRows } = await supabase.from('site_settings').select('*');
    const map = toSettingMap(settingsRows || []);
    setPageConfig(getContactPageConfig(map));
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadSystem();
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
  const textareaStyle = getAdminTextareaStyle(tokens, { minHeight: 96 });

  function updateHero<K extends keyof ContactPageConfig['hero']>(
    key: K,
    value: ContactPageConfig['hero'][K]
  ) {
    setPageConfig(current => (current ? { ...current, hero: { ...current.hero, [key]: value } } : current));
  }

  function updateFormSection<K extends keyof ContactPageConfig['formSection']>(
    key: K,
    value: ContactPageConfig['formSection'][K]
  ) {
    setPageConfig(current =>
      current ? { ...current, formSection: { ...current.formSection, [key]: value } } : current
    );
  }

  function updateExtraSection<K extends keyof ContactPageConfig['extraSection']>(
    key: K,
    value: ContactPageConfig['extraSection'][K]
  ) {
    setPageConfig(current =>
      current ? { ...current, extraSection: { ...current.extraSection, [key]: value } } : current
    );
  }

  function updateCta<K extends keyof ContactPageConfig['cta']>(
    key: K,
    value: ContactPageConfig['cta'][K]
  ) {
    setPageConfig(current => (current ? { ...current, cta: { ...current.cta, [key]: value } } : current));
  }

  async function handleImageUpload(file: File) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `contact/${Date.now()}-extra.${ext}`;
    setUploadingField('extra-image');

    try {
      const { publicUrl } = await adminUploadFile('media', path, file, {
        uploadProfile: 'showcase',
      });
      updateExtraSection('image', publicUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField(null);
    }
  }

  async function saveConfig() {
    if (!pageConfig) {
      return;
    }

    setSaving(true);
    try {
      const email = firstEnabledValue(
        pageConfig.formSection.infoCards,
        card => card.title.toLowerCase().includes('mail') || card.value.includes('@')
      );
      const phone = firstEnabledValue(
        pageConfig.formSection.infoCards,
        card =>
          card.title.toLowerCase().includes('phone') ||
          card.title.toLowerCase().includes('whatsapp') ||
          /[+0-9]/.test(card.value)
      );

      await Promise.all([
        writeSiteSetting(
          supabase,
          CONTACT_PAGE_SETTING_KEY,
          serializeContactPageConfig(pageConfig)
        ),
        writeSiteSetting(supabase, 'contact_email', email),
        writeSiteSetting(supabase, 'contact_phone', phone),
      ]);

      await loadSystem();
      setMsg('✅ Contact page config saved successfully.');
      setTimeout(() => setMsg(''), 3200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Contact config save failed.';
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
        Contact system loading...
      </div>
    );
  }

  return (
    <AdminShell
      eyebrow="Contact Page Builder"
      title="Shape the public contact experience without leaving the admin workspace"
      description="Control contact page layout, messaging, info cards, CTA blocks, and submission context while keeping inbox management separate at `/admin/inbox`."
      actions={
        <>
          <button
            type="button"
            onClick={() => router.push('/admin/inbox')}
            style={{
              background: '#111827',
              color: '#e2e8f0',
              border: '1px solid rgba(148,163,184,0.16)',
              borderRadius: 14,
              padding: '11px 16px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Open Inbox
          </button>
          <button
            onClick={saveConfig}
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
            {saving ? 'Saving...' : 'Save Contact System'}
          </button>
        </>
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

        <Panel
          title="Global Contact Visibility"
          description="Whole contact page visibility lives here. Each section now keeps its own order, content, media, layout, and styling inside one unified builder card."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Page Enabled">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageConfig.pageEnabled}
                  onChange={event => setPageConfig({ ...pageConfig, pageEnabled: event.target.checked })}
                />
                <span>{pageConfig.pageEnabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
          </div>
        </Panel>

        <AdminBuilderSection
          title="Hero Section"
          description="Top label, title, description, CTA buttons, and alignment control."
          badge={pageConfig.hero.enabled ? 'Visible' : 'Hidden'}
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageConfig.hero.order}
                  onChange={event => updateHero('order', Number(event.target.value))}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageConfig.hero.enabled}
                  onChange={event => updateHero('enabled', event.target.checked)}
                />
                <span>{pageConfig.hero.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Label, title, description, and CTA copy for the hero block.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Label">
                    <input value={pageConfig.hero.label} onChange={event => updateHero('label', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Title" full>
                    <input value={pageConfig.hero.title} onChange={event => updateHero('title', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Subtitle" full>
                    <input value={pageConfig.hero.subtitle} onChange={event => updateHero('subtitle', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Description" full>
                    <textarea value={pageConfig.hero.description} onChange={event => updateHero('description', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Primary CTA Text">
                    <input value={pageConfig.hero.primaryButtonText} onChange={event => updateHero('primaryButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Primary CTA Link">
                    <input value={pageConfig.hero.primaryButtonLink} onChange={event => updateHero('primaryButtonLink', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Secondary CTA Text">
                    <input value={pageConfig.hero.secondaryButtonText} onChange={event => updateHero('secondaryButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Secondary CTA Link">
                    <input value={pageConfig.hero.secondaryButtonLink} onChange={event => updateHero('secondaryButtonLink', event.target.value)} style={inputStyle} />
                  </Field>
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Hero layout, alignment, and width live beside the hero content.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Layout">
                    <select
                      value={pageConfig.hero.layout}
                      onChange={event => updateHero('layout', event.target.value as ContactLayoutMode)}
                      style={inputStyle}
                    >
                      {layoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Alignment">
                    <select
                      value={pageConfig.hero.alignment}
                      onChange={event => updateHero('alignment', event.target.value as ContactAlignment)}
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
                      value={pageConfig.hero.width}
                      onChange={event => updateHero('width', event.target.value as ContactPageConfig['hero']['width'])}
                      style={inputStyle}
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                      <option value="full">Full</option>
                    </select>
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Hero typography, colors, spacing, and advanced button styling stay inside this hero card.',
              content: (
                <PageStyleEditor
                  title="Hero styling"
                  description="Control heading scale, alignment, section background, and hero CTA presentation."
                  value={pageConfig.hero.styles}
                  onChange={nextValue => updateHero('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Contact + Form Section"
          description="Info cards, form labels, social links, subject field, and availability status."
          badge={pageConfig.formSection.enabled ? 'Visible' : 'Hidden'}
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageConfig.formSection.order}
                  onChange={event => updateFormSection('order', Number(event.target.value))}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageConfig.formSection.enabled}
                  onChange={event => updateFormSection('enabled', event.target.checked)}
                />
                <span>{pageConfig.formSection.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Section copy, form labels, success messages, and availability text.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Section Label">
                    <input value={pageConfig.formSection.label} onChange={event => updateFormSection('label', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Heading" full>
                    <input value={pageConfig.formSection.title} onChange={event => updateFormSection('title', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Subtitle" full>
                    <input value={pageConfig.formSection.subtitle} onChange={event => updateFormSection('subtitle', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Description" full>
                    <textarea value={pageConfig.formSection.description} onChange={event => updateFormSection('description', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Form Label">
                    <input value={pageConfig.formSection.formLabel} onChange={event => updateFormSection('formLabel', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Form Title">
                    <input value={pageConfig.formSection.formTitle} onChange={event => updateFormSection('formTitle', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Submit Button Text">
                    <input value={pageConfig.formSection.submitButtonText} onChange={event => updateFormSection('submitButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Show Subject Field">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={pageConfig.formSection.showSubjectField}
                        onChange={event => updateFormSection('showSubjectField', event.target.checked)}
                      />
                      <span>{pageConfig.formSection.showSubjectField ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </Field>
                  <Field label="Form Description" full>
                    <textarea value={pageConfig.formSection.formDescription} onChange={event => updateFormSection('formDescription', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Success Title">
                    <input value={pageConfig.formSection.successTitle} onChange={event => updateFormSection('successTitle', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Success Message" full>
                    <textarea value={pageConfig.formSection.successMessage} onChange={event => updateFormSection('successMessage', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Show Info Cards">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={pageConfig.formSection.showInfoCards} onChange={event => updateFormSection('showInfoCards', event.target.checked)} />
                      <span>{pageConfig.formSection.showInfoCards ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </Field>
                  <Field label="Show Social Links">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={pageConfig.formSection.showSocialLinks} onChange={event => updateFormSection('showSocialLinks', event.target.checked)} />
                      <span>{pageConfig.formSection.showSocialLinks ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </Field>
                  <Field label="Show Availability Card">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={pageConfig.formSection.showAvailabilityCard} onChange={event => updateFormSection('showAvailabilityCard', event.target.checked)} />
                      <span>{pageConfig.formSection.showAvailabilityCard ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </Field>
                  <Field label="Availability Title">
                    <input value={pageConfig.formSection.availabilityTitle} onChange={event => updateFormSection('availabilityTitle', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Availability Text" full>
                    <textarea value={pageConfig.formSection.availabilityText} onChange={event => updateFormSection('availabilityText', event.target.value)} style={textareaStyle} />
                  </Field>
                </div>
              ),
            },
            {
              id: 'details',
              label: 'Cards & Social',
              description: 'Contact cards and social links stay inside the same contact-form section builder.',
              content: (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>Contact Info Cards</h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateFormSection('infoCards', [
                          ...pageConfig.formSection.infoCards,
                          createInfoCard(nextOrder(pageConfig.formSection.infoCards)),
                        ])
                      }
                      style={{ background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}
                    >
                      + Add Card
                    </button>
                  </div>

                  {pageConfig.formSection.infoCards
                    .slice()
                    .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
                    .map(card => (
                      <div key={card.id} style={{ background: tokens.fieldSoft, border: `1px solid ${tokens.line}`, borderRadius: 18, padding: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                          <Field label="Icon">
                            <input
                              value={card.icon || ''}
                              onChange={event =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.map(item =>
                                    item.id === card.id ? { ...item, icon: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Title">
                            <input
                              value={card.title}
                              onChange={event =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.map(item =>
                                    item.id === card.id ? { ...item, title: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Value">
                            <input
                              value={card.value}
                              onChange={event =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.map(item =>
                                    item.id === card.id ? { ...item, value: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Href">
                            <input
                              value={card.href || ''}
                              onChange={event =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.map(item =>
                                    item.id === card.id ? { ...item, href: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Order">
                            <input
                              type="number"
                              value={card.order}
                              onChange={event =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.map(item =>
                                    item.id === card.id ? { ...item, order: Number(event.target.value) } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Description" full>
                            <textarea
                              value={card.description || ''}
                              onChange={event =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.map(item =>
                                    item.id === card.id ? { ...item, description: event.target.value } : item
                                  )
                                )
                              }
                              style={textareaStyle}
                            />
                          </Field>
                          <Field label="Visible">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input
                                type="checkbox"
                                checked={card.enabled}
                                onChange={event =>
                                  updateFormSection(
                                    'infoCards',
                                    pageConfig.formSection.infoCards.map(item =>
                                      item.id === card.id ? { ...item, enabled: event.target.checked } : item
                                    )
                                  )
                                }
                              />
                              <span>{card.enabled ? 'Visible' : 'Hidden'}</span>
                            </label>
                          </Field>
                          <Field label="Remove">
                            <button
                              type="button"
                              onClick={() =>
                                updateFormSection(
                                  'infoCards',
                                  pageConfig.formSection.infoCards.filter(item => item.id !== card.id)
                                )
                              }
                              style={{ ...inputStyle, cursor: 'pointer', color: '#fca5a5', background: tokens.field }}
                            >
                              Delete Card
                            </button>
                          </Field>
                        </div>
                      </div>
                    ))}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>Social Links</h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateFormSection('socialLinks', [
                          ...pageConfig.formSection.socialLinks,
                          createSocialLink(nextOrder(pageConfig.formSection.socialLinks)),
                        ])
                      }
                      style={{ background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}
                    >
                      + Add Social
                    </button>
                  </div>

                  {pageConfig.formSection.socialLinks
                    .slice()
                    .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
                    .map(link => (
                      <div key={link.id} style={{ background: tokens.fieldSoft, border: `1px solid ${tokens.line}`, borderRadius: 18, padding: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                          <Field label="Icon">
                            <input
                              value={link.icon || ''}
                              onChange={event =>
                                updateFormSection(
                                  'socialLinks',
                                  pageConfig.formSection.socialLinks.map(item =>
                                    item.id === link.id ? { ...item, icon: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Label">
                            <input
                              value={link.label}
                              onChange={event =>
                                updateFormSection(
                                  'socialLinks',
                                  pageConfig.formSection.socialLinks.map(item =>
                                    item.id === link.id ? { ...item, label: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="URL">
                            <input
                              value={link.url}
                              onChange={event =>
                                updateFormSection(
                                  'socialLinks',
                                  pageConfig.formSection.socialLinks.map(item =>
                                    item.id === link.id ? { ...item, url: event.target.value } : item
                                  )
                                )
                              }
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Order">
                            <input
                              type="number"
                              value={link.order}
                              onChange={event =>
                                updateFormSection(
                                  'socialLinks',
                                  pageConfig.formSection.socialLinks.map(item =>
                                    item.id === link.id ? { ...item, order: Number(event.target.value) } : item
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
                                checked={link.enabled}
                                onChange={event =>
                                  updateFormSection(
                                    'socialLinks',
                                    pageConfig.formSection.socialLinks.map(item =>
                                      item.id === link.id ? { ...item, enabled: event.target.checked } : item
                                    )
                                  )
                                }
                              />
                              <span>{link.enabled ? 'Visible' : 'Hidden'}</span>
                            </label>
                          </Field>
                        </div>
                      </div>
                    ))}
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Form block layout, alignment, and width controls stay with the section.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Layout">
                    <select
                      value={pageConfig.formSection.layout}
                      onChange={event => updateFormSection('layout', event.target.value as ContactLayoutMode)}
                      style={inputStyle}
                    >
                      {layoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Alignment">
                    <select
                      value={pageConfig.formSection.alignment}
                      onChange={event => updateFormSection('alignment', event.target.value as ContactAlignment)}
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
                      value={pageConfig.formSection.width}
                      onChange={event => updateFormSection('width', event.target.value as ContactPageConfig['formSection']['width'])}
                      style={inputStyle}
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                      <option value="full">Full</option>
                    </select>
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Typography, colors, buttons, and card polish for the contact form section.',
              content: (
                <PageStyleEditor
                  title="Form section styling"
                  description="Customize labels, form copy, card surfaces, social chips, and the overall contact block layout."
                  value={pageConfig.formSection.styles}
                  onChange={nextValue => updateFormSection('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Extra / Workflow Section"
          description="Optional workflow, map, or extra content block with image and CTA."
          badge={pageConfig.extraSection.enabled ? 'Visible' : 'Hidden'}
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageConfig.extraSection.order}
                  onChange={event => updateExtraSection('order', Number(event.target.value))}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.extraSection.enabled} onChange={event => updateExtraSection('enabled', event.target.checked)} />
                <span>{pageConfig.extraSection.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Workflow copy, subtitle, CTA text, and section visibility settings.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Label">
                    <input value={pageConfig.extraSection.label} onChange={event => updateExtraSection('label', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Title" full>
                    <input value={pageConfig.extraSection.title} onChange={event => updateExtraSection('title', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Subtitle" full>
                    <input value={pageConfig.extraSection.subtitle} onChange={event => updateExtraSection('subtitle', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Description" full>
                    <textarea value={pageConfig.extraSection.description} onChange={event => updateExtraSection('description', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Show CTA">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={pageConfig.extraSection.showButton} onChange={event => updateExtraSection('showButton', event.target.checked)} />
                      <span>{pageConfig.extraSection.showButton ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </Field>
                  <Field label="CTA Text">
                    <input value={pageConfig.extraSection.buttonText} onChange={event => updateExtraSection('buttonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="CTA Link">
                    <input value={pageConfig.extraSection.buttonLink} onChange={event => updateExtraSection('buttonLink', event.target.value)} style={inputStyle} />
                  </Field>
                </div>
              ),
            },
            {
              id: 'media',
              label: 'Media',
              description: 'The supporting workflow image upload now stays inside the workflow section itself.',
              content: (
                <AdminImageField
                  label="Workflow image"
                  value={pageConfig.extraSection.image}
                  onChange={value => updateExtraSection('image', value)}
                  onFileSelected={file => void handleImageUpload(file)}
                  uploading={uploadingField === 'extra-image'}
                  onError={message => setMsg(message)}
                  uploadProfile="showcase"
                  full
                />
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'Workflow layout, alignment, and width controls stay beside the workflow content.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Layout">
                    <select value={pageConfig.extraSection.layout} onChange={event => updateExtraSection('layout', event.target.value as ContactLayoutMode)} style={inputStyle}>
                      {layoutOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Alignment">
                    <select value={pageConfig.extraSection.alignment} onChange={event => updateExtraSection('alignment', event.target.value as ContactAlignment)} style={inputStyle}>
                      {alignmentOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Width">
                    <select value={pageConfig.extraSection.width} onChange={event => updateExtraSection('width', event.target.value as ContactPageConfig['extraSection']['width'])} style={inputStyle}>
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                      <option value="full">Full</option>
                    </select>
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Typography, colors, image balance, and CTA polish for the workflow section.',
              content: (
                <PageStyleEditor
                  title="Workflow / extra section styling"
                  description="Refine the supporting workflow section, image placement, CTA button look, and section spacing."
                  value={pageConfig.extraSection.styles}
                  onChange={nextValue => updateExtraSection('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Closing CTA Section"
          description="Final conversion block at the bottom of the contact page."
          badge={pageConfig.cta.enabled ? 'Visible' : 'Hidden'}
          headerControls={
            <>
              <div style={{ display: 'grid', gap: 6, minWidth: 92 }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Order
                </div>
                <input
                  type="number"
                  value={pageConfig.cta.order}
                  onChange={event => updateCta('order', Number(event.target.value))}
                  style={{ ...inputStyle, width: 92 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.cta.enabled} onChange={event => updateCta('enabled', event.target.checked)} />
                <span>{pageConfig.cta.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </>
          }
          tabs={[
            {
              id: 'content',
              label: 'Content',
              description: 'Closing CTA copy and button text stay inside the CTA section card.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Label">
                    <input value={pageConfig.cta.label} onChange={event => updateCta('label', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Title" full>
                    <input value={pageConfig.cta.title} onChange={event => updateCta('title', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Description" full>
                    <textarea value={pageConfig.cta.description} onChange={event => updateCta('description', event.target.value)} style={textareaStyle} />
                  </Field>
                  <Field label="Show Primary Button">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={pageConfig.cta.showPrimaryButton} onChange={event => updateCta('showPrimaryButton', event.target.checked)} />
                      <span>{pageConfig.cta.showPrimaryButton ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </Field>
                  <Field label="Primary CTA Text">
                    <input value={pageConfig.cta.primaryButtonText} onChange={event => updateCta('primaryButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Primary CTA Link">
                    <input value={pageConfig.cta.primaryButtonLink} onChange={event => updateCta('primaryButtonLink', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Show Secondary Button">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={pageConfig.cta.showSecondaryButton} onChange={event => updateCta('showSecondaryButton', event.target.checked)} />
                      <span>{pageConfig.cta.showSecondaryButton ? 'Visible' : 'Hidden'}</span>
                    </label>
                  </Field>
                  <Field label="Secondary CTA Text">
                    <input value={pageConfig.cta.secondaryButtonText} onChange={event => updateCta('secondaryButtonText', event.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Secondary CTA Link">
                    <input value={pageConfig.cta.secondaryButtonLink} onChange={event => updateCta('secondaryButtonLink', event.target.value)} style={inputStyle} />
                  </Field>
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              description: 'CTA alignment and width stay with the CTA content rather than a separate panel.',
              content: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <Field label="Alignment">
                    <select value={pageConfig.cta.alignment} onChange={event => updateCta('alignment', event.target.value as ContactAlignment)} style={inputStyle}>
                      {alignmentOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Width">
                    <select value={pageConfig.cta.width} onChange={event => updateCta('width', event.target.value as ContactPageConfig['cta']['width'])} style={inputStyle}>
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                      <option value="full">Full</option>
                    </select>
                  </Field>
                </div>
              ),
            },
            {
              id: 'design',
              label: 'Design',
              description: 'Final typography, color, spacing, and button treatment for the closing CTA.',
              content: (
                <PageStyleEditor
                  title="Closing CTA styling"
                  description="Adjust CTA typography, section background, button style, spacing rhythm, and final card feel."
                  value={pageConfig.cta.styles}
                  onChange={nextValue => updateCta('styles', nextValue)}
                />
              ),
            },
          ]}
        />

        <Panel
          title="Admin Inbox Moved"
          description="Lead management, WhatsApp replies, briefs, এবং project conversion এখন dedicated inbox page-এ আছে।"
        >
          <div
            style={{
              borderRadius: 24,
              border: '1px solid rgba(56,189,248,0.18)',
              background: 'linear-gradient(145deg, rgba(15,23,42,0.82), rgba(8,47,73,0.2))',
              padding: 22,
              display: 'grid',
              gap: 14,
            }}
          >
            <div style={{ color: '#e2e8f0', fontSize: 16, lineHeight: 1.8 }}>
              Contact page builder এখন public page content-এর জন্য dedicated রয়েছে। সব submitted leads, filters, WhatsApp reply actions, brief links, templates, আর lead-to-project conversion এখন `/admin/inbox` page-এ।
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => router.push('/admin/inbox')}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '11px 16px',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                Open Inbox
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/projects')}
                style={{
                  background: '#111827',
                  color: '#e2e8f0',
                  border: '1px solid rgba(148,163,184,0.16)',
                  borderRadius: 14,
                  padding: '11px 16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Open Projects
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
