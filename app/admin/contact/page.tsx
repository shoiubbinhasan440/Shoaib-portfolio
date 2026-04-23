'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
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
import type { ContactMessage } from '@/lib/contact-messages';
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

function MediaField({
  label,
  value,
  onChange,
  onFileSelected,
  uploading,
}: {
  label: string;
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
          No image selected
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
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>
    </div>
  );
}

export default function ContactAdminPage() {
  const router = useRouter();
  const [pageConfig, setPageConfig] = useState<ContactPageConfig | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingMessages, setSyncingMessages] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function loadSystem() {
    const [settingsResult, messageResult] = await Promise.all([
      supabase.from('site_settings').select('*'),
      fetch('/api/contact').then(async response => {
        if (!response.ok) {
          throw new Error('Failed to load contact inbox.');
        }

        return (await response.json()) as { messages: ContactMessage[] };
      }),
    ]);

    const map = toSettingMap(settingsResult.data || []);
    setPageConfig(getContactPageConfig(map));
    setMessages(messageResult.messages || []);
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

  const selectedMessage = useMemo(
    () => messages.find(item => item.id === selectedMessageId) || messages[0] || null,
    [messages, selectedMessageId]
  );

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
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(path);
      updateExtraSection('image', data.publicUrl);
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

  async function patchMessage(id: string, patch: { read?: boolean; archived?: boolean }) {
    setSyncingMessages(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact message.');
      }

      await loadSystem();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Message update failed.';
      setMsg(`❌ ${message}`);
      setTimeout(() => setMsg(''), 4200);
    } finally {
      setSyncingMessages(false);
    }
  }

  async function removeMessage(id: string) {
    setSyncingMessages(true);
    try {
      const response = await fetch(`/api/contact?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact message.');
      }

      await loadSystem();
      setSelectedMessageId('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Message delete failed.';
      setMsg(`❌ ${message}`);
      setTimeout(() => setMsg(''), 4200);
    } finally {
      setSyncingMessages(false);
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

  const unreadCount = messages.filter(message => !message.read && !message.archived).length;

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
            Contact Page Builder
          </div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.05em' }}>
            Contact page + message inbox
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
            Contact page content, layout, CTA, info cards, socials এবং submitted messages এক জায়গা থেকে control করুন।
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
          <button
            onClick={saveConfig}
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
            {saving ? 'Saving...' : 'Save Contact System'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 22px 56px', display: 'grid', gap: 18 }}>
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
          description="Whole contact page on/off, and section order control."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
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
            <Field label="Hero Order">
              <input
                type="number"
                value={pageConfig.hero.order}
                onChange={event => updateHero('order', Number(event.target.value))}
                style={inputStyle}
              />
            </Field>
            <Field label="Contact Section Order">
              <input
                type="number"
                value={pageConfig.formSection.order}
                onChange={event => updateFormSection('order', Number(event.target.value))}
                style={inputStyle}
              />
            </Field>
            <Field label="Extra / Workflow Order">
              <input
                type="number"
                value={pageConfig.extraSection.order}
                onChange={event => updateExtraSection('order', Number(event.target.value))}
                style={inputStyle}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Hero Section"
          description="Top label, title, description, CTA buttons, and alignment control."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <Field label="Show Hero">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageConfig.hero.enabled}
                  onChange={event => updateHero('enabled', event.target.checked)}
                />
                <span>{pageConfig.hero.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
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
        </Panel>

        <Panel
          title="Contact + Form Section"
          description="Info cards, form labels, social links, subject field, and availability status."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <Field label="Show Section">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={pageConfig.formSection.enabled}
                  onChange={event => updateFormSection('enabled', event.target.checked)}
                />
                <span>{pageConfig.formSection.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
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

          <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
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
                <div key={card.id} style={{ background: '#020617', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
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
                        style={{ ...inputStyle, cursor: 'pointer', color: '#fca5a5', background: '#1f172a' }}
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
                <div key={link.id} style={{ background: '#020617', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 18, padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
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
        </Panel>

        <Panel
          title="Extra / Workflow Section"
          description="Optional workflow, map, or extra content block with image and CTA."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <Field label="Show Section">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.extraSection.enabled} onChange={event => updateExtraSection('enabled', event.target.checked)} />
                <span>{pageConfig.extraSection.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
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
            <Field label="Order">
              <input type="number" value={pageConfig.extraSection.order} onChange={event => updateExtraSection('order', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="Visual / Image" full>
              <MediaField
                label="Workflow image"
                value={pageConfig.extraSection.image}
                onChange={value => updateExtraSection('image', value)}
                onFileSelected={file => void handleImageUpload(file)}
                uploading={uploadingField === 'extra-image'}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Closing CTA Section"
          description="Final conversion block at the bottom of the contact page."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <Field label="Show Section">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={pageConfig.cta.enabled} onChange={event => updateCta('enabled', event.target.checked)} />
                <span>{pageConfig.cta.enabled ? 'Visible' : 'Hidden'}</span>
              </label>
            </Field>
            <Field label="Alignment">
              <select value={pageConfig.cta.alignment} onChange={event => updateCta('alignment', event.target.value as ContactAlignment)} style={inputStyle}>
                {alignmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Order">
              <input type="number" value={pageConfig.cta.order} onChange={event => updateCta('order', Number(event.target.value))} style={inputStyle} />
            </Field>
            <Field label="Width">
              <select value={pageConfig.cta.width} onChange={event => updateCta('width', event.target.value as ContactPageConfig['cta']['width'])} style={inputStyle}>
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
                <option value="full">Full</option>
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
        </Panel>

        <Panel
          title="Admin Inbox"
          description="Submitted contact messages read, archive, and delete করুন।"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.46fr) minmax(0, 1fr)', gap: 18 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: '#020617',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>Messages</div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>
                    {messages.length} total · {unreadCount} unread
                  </div>
                </div>
                {syncingMessages ? <div style={{ color: '#38bdf8', fontSize: 12 }}>Syncing...</div> : null}
              </div>

              {messages.length === 0 ? (
                <div
                  style={{
                    background: '#020617',
                    border: '1px dashed rgba(148,163,184,0.18)',
                    borderRadius: 18,
                    padding: 18,
                    color: '#94a3b8',
                    fontSize: 14,
                  }}
                >
                  এখনো কোনো message আসেনি।
                </div>
              ) : (
                messages.map(message => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => {
                      setSelectedMessageId(message.id);
                      if (!message.read) {
                        void patchMessage(message.id, { read: true });
                      }
                    }}
                    style={{
                      textAlign: 'left',
                      background:
                        selectedMessage?.id === message.id
                          ? 'rgba(37,99,235,0.18)'
                          : '#020617',
                      border: `1px solid ${selectedMessage?.id === message.id ? 'rgba(59,130,246,0.36)' : 'rgba(148,163,184,0.14)'}`,
                      borderRadius: 18,
                      padding: 14,
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontWeight: 800 }}>{message.name}</div>
                      {!message.read ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>{message.email}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
                      {(message.subject || message.message).slice(0, 90)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 10 }}>
                      {new Date(message.createdAt).toLocaleString('en-GB')}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div
              style={{
                background: '#020617',
                border: '1px solid rgba(148,163,184,0.14)',
                borderRadius: 24,
                padding: 20,
                minHeight: 420,
              }}
            >
              {selectedMessage ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: 24, letterSpacing: '-0.04em' }}>{selectedMessage.name}</h3>
                      <div style={{ color: '#94a3b8', fontSize: 14 }}>{selectedMessage.email}</div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                        {new Date(selectedMessage.createdAt).toLocaleString('en-GB')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => void patchMessage(selectedMessage.id, { read: !selectedMessage.read })}
                        style={{ background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '9px 12px', cursor: 'pointer' }}
                      >
                        {selectedMessage.read ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void patchMessage(selectedMessage.id, { archived: !selectedMessage.archived })}
                        style={{ background: '#111827', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, padding: '9px 12px', cursor: 'pointer' }}
                      >
                        {selectedMessage.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeMessage(selectedMessage.id)}
                        style={{ background: '#1f172a', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 12, padding: '9px 12px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {selectedMessage.subject ? (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: '12px 14px',
                        borderRadius: 16,
                        background: 'rgba(15,23,42,0.52)',
                        border: '1px solid rgba(148,163,184,0.12)',
                      }}
                    >
                      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Subject</div>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>
                        {selectedMessage.subject}
                      </div>
                    </div>
                  ) : null}

                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 20,
                      background: 'rgba(15,23,42,0.42)',
                      border: '1px solid rgba(148,163,184,0.12)',
                      color: '#e2e8f0',
                      fontSize: 15,
                      lineHeight: 1.9,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedMessage.message}
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8', display: 'grid', placeItems: 'center', minHeight: 360 }}>
                  Select a message to read it here.
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
