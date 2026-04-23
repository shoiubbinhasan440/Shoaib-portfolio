'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';
import GlobalFooter from '@/components/shared/GlobalFooter';
import { getContactPageConfig, type ContactPageConfig } from '@/lib/contact-content';
import {
  LEAD_INTENT_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from '@/lib/crm-shared';
import { getGlobalFooterConfig } from '@/lib/footer-content';
import { toSettingMap, type SettingRow } from '@/lib/hero-settings';
import { createDefaultHomepageBuilderConfig } from '@/lib/homepage-content';
import { fetchPortfolioDataset } from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ContactFormState = {
  attachmentLink: string;
  budgetRange: string;
  deadline: string;
  name: string;
  email: string;
  intentCategory: string;
  message: string;
  mobileNumber: string;
  preferredContactMethod: string;
  projectType: string;
  serviceType: string;
  whatsappNumber: string;
};

function getMaxWidth(width: ContactPageConfig['hero']['width']) {
  switch (width) {
    case 'normal':
      return 980;
    case 'full':
      return 1360;
    case 'wide':
    default:
      return 1220;
  }
}

function getSectionPadding(
  spacing: ContactPageConfig['hero']['spacing'],
  isMobile: boolean
) {
  if (spacing === 'compact') {
    return isMobile ? '42px 16px' : '56px 28px';
  }

  if (spacing === 'spacious') {
    return isMobile ? '62px 16px' : '88px 28px';
  }

  return isMobile ? '52px 16px' : '72px 28px';
}

export default function ContactPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [pageConfig, setPageConfig] = useState<ContactPageConfig>(() =>
    getContactPageConfig({})
  );
  const [footerConfig, setFooterConfig] = useState(() => createDefaultHomepageBuilderConfig().footer);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<ContactFormState>({
    attachmentLink: '',
    budgetRange: '',
    deadline: '',
    name: '',
    email: '',
    intentCategory: 'Work Inquiry',
    message: '',
    mobileNumber: '',
    preferredContactMethod: 'WhatsApp',
    projectType: '',
    serviceType: 'Video Editing',
    whatsappNumber: '',
  });

  useEffect(() => {
    async function load() {
      const [{ data: settingsRows }, dataset] = await Promise.all([
        supabase.from('site_settings').select('*'),
        fetchPortfolioDataset(supabase),
      ]);

      const map = toSettingMap((settingsRows || []) as SettingRow[]);
      setPageConfig(getContactPageConfig(map));
      setFooterConfig(
        getGlobalFooterConfig(map, {
          projectCount: dataset.videos.length + dataset.graphics.length,
        })
      );
      setLoading(false);
    }

    void load();

    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitState({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentLink: form.attachmentLink,
          budgetRange: form.budgetRange,
          deadline: form.deadline,
          intentCategory: form.intentCategory,
          mobileNumber: form.mobileNumber,
          name: form.name,
          email: form.email,
          message: form.message,
          preferredContactMethod: form.preferredContactMethod,
          projectType: form.projectType,
          serviceType: form.serviceType,
          whatsappNumber: form.whatsappNumber,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || 'বার্তা পাঠানো যায়নি।');
      }

      setSent(true);
      setSubmitState({
        type: 'success',
        message: pageConfig.formSection.successMessage,
      });
      setForm({
        attachmentLink: '',
        budgetRange: '',
        deadline: '',
        name: '',
        email: '',
        intentCategory: 'Work Inquiry',
        message: '',
        mobileNumber: '',
        preferredContactMethod: 'WhatsApp',
        projectType: '',
        serviceType: 'Video Editing',
        whatsappNumber: '',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'বার্তা পাঠানো যায়নি।';
      setSubmitState({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  const bg = dark ? '#080808' : '#f8fbff';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? 'rgba(226,232,240,0.7)' : '#475569';
  const soft = dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)';
  const glass = dark
    ? 'linear-gradient(150deg, rgba(15,23,42,0.7), rgba(2,6,23,0.88))'
    : 'linear-gradient(150deg, rgba(255,255,255,0.95), rgba(239,246,255,0.82))';
  const panel = dark
    ? 'linear-gradient(180deg, rgba(2,6,23,0.9), rgba(15,23,42,0.72))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))';

  const orderedSections = useMemo(
    () =>
      [
        { key: 'hero', order: pageConfig.hero.order, enabled: pageConfig.hero.enabled },
        {
          key: 'formSection',
          order: pageConfig.formSection.order,
          enabled: pageConfig.formSection.enabled,
        },
        {
          key: 'extraSection',
          order: pageConfig.extraSection.order,
          enabled: pageConfig.extraSection.enabled,
        },
        { key: 'cta', order: pageConfig.cta.order, enabled: pageConfig.cta.enabled },
      ]
        .filter(section => section.enabled)
        .sort((leftItem, rightItem) => leftItem.order - rightItem.order),
    [pageConfig]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#64748b',
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Contact page loading...
      </div>
    );
  }

  if (!pageConfig.pageEnabled) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: bg,
          color: text,
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'grid',
          placeItems: 'center',
          padding: '120px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 620,
            textAlign: 'center',
            borderRadius: 28,
            padding: '38px 28px',
            border: `1px solid ${soft}`,
            background: glass,
          }}
        >
          <div
            style={{
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Contact Hidden
          </div>
          <h1
            style={{
              margin: '0 0 12px',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.05em',
            }}
          >
            Contact page is currently disabled.
          </h1>
          <p style={{ margin: 0, color: muted, lineHeight: 1.75 }}>
            Admin থেকে Contact Builder ব্যবহার করে visibility চালু করুন।
          </p>
        </div>
      </main>
    );
  }

  function renderHero() {
    const section = pageConfig.hero;
    const center = section.alignment === 'center';

    return (
      <section
        key="hero"
        style={{
          position: 'relative',
          padding: getSectionPadding(section.spacing, isMobile),
          background: dark
            ? 'radial-gradient(circle at 84% 18%, rgba(37,99,235,0.22), transparent 28%), radial-gradient(circle at 12% 26%, rgba(14,165,233,0.14), transparent 30%), #080808'
            : 'radial-gradient(circle at 84% 18%, rgba(37,99,235,0.12), transparent 28%), radial-gradient(circle at 12% 26%, rgba(14,165,233,0.12), transparent 30%), #f8fbff',
        }}
      >
        <div
          style={{
            maxWidth: getMaxWidth(section.width),
            margin: '0 auto',
            textAlign: section.alignment,
            display: 'grid',
            justifyItems: center ? 'center' : 'stretch',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              border: `1px solid ${dark ? 'rgba(56,189,248,0.22)' : 'rgba(37,99,235,0.18)'}`,
              background: dark ? 'rgba(14,165,233,0.08)' : 'rgba(219,234,254,0.82)',
              color: dark ? '#7dd3fc' : '#2563eb',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
            {section.label}
          </div>

          <h1
            style={{
              margin: 0,
              color: text,
              fontSize: isMobile ? 'clamp(2.7rem, 13vw, 4rem)' : 'clamp(4rem, 8vw, 6.4rem)',
              lineHeight: 0.94,
              letterSpacing: '-0.07em',
              fontWeight: 900,
              maxWidth: center ? 980 : 860,
            }}
          >
            {section.title}
          </h1>

          {section.subtitle ? (
            <div
              style={{
                color: '#38bdf8',
                fontSize: isMobile ? 15 : 18,
                fontWeight: 850,
                maxWidth: center ? 880 : 760,
              }}
            >
              {section.subtitle}
            </div>
          ) : null}

          {section.description ? (
            <p
              style={{
                margin: 0,
                color: muted,
                fontSize: isMobile ? 15 : 17,
                lineHeight: 1.9,
                maxWidth: center ? 860 : 780,
              }}
            >
              {section.description}
            </p>
          ) : null}

          <div
            style={{
              display: 'flex',
              justifyContent: center ? 'center' : 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 10,
            }}
          >
            {section.showPrimaryButton ? (
              <Link
                href={section.primaryButtonLink || '#contact-form'}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  borderRadius: 14,
                  padding: '14px 22px',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 850,
                  boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
                }}
              >
                {section.primaryButtonText} →
              </Link>
            ) : null}
            {section.showSecondaryButton ? (
              <Link
                href={section.secondaryButtonLink || '/portfolio'}
                style={{
                  background: dark ? 'rgba(15,23,42,0.52)' : 'rgba(255,255,255,0.8)',
                  color: text,
                  border: `1px solid ${soft}`,
                  borderRadius: 14,
                  padding: '14px 20px',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 760,
                }}
              >
                {section.secondaryButtonText}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function renderFormSection() {
    const section = pageConfig.formSection;
    const infoCards = section.infoCards.filter(item => item.enabled);
    const socials = section.socialLinks.filter(item => item.enabled);
    const stacked = isMobile || section.layout === 'stacked' || section.layout === 'centered';
    const infoFirst = section.layout !== 'card-right';

    const infoPanel = (
      <div
        style={{
          display: 'grid',
          gap: 18,
          order: infoFirst ? 1 : 2,
        }}
      >
        <div
          style={{
            padding: isMobile ? 22 : 28,
            borderRadius: 30,
            border: `1px solid ${soft}`,
            background: glass,
            boxShadow: dark
              ? '0 26px 64px rgba(2,6,23,0.26)'
              : '0 20px 50px rgba(15,23,42,0.08)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              marginBottom: 14,
              background: dark ? 'rgba(15,23,42,0.56)' : 'rgba(255,255,255,0.74)',
              border: `1px solid ${soft}`,
              color: '#38bdf8',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            {section.label}
          </div>
          <h2
            style={{
              margin: '0 0 10px',
              fontSize: isMobile ? 28 : 40,
              letterSpacing: '-0.05em',
              color: text,
            }}
          >
            {section.title}
          </h2>
          {section.subtitle ? (
            <div style={{ color: '#38bdf8', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
              {section.subtitle}
            </div>
          ) : null}
          {section.description ? (
            <p style={{ margin: 0, color: muted, lineHeight: 1.85, fontSize: 15 }}>
              {section.description}
            </p>
          ) : null}
        </div>

        {section.showInfoCards ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {infoCards.map(card => {
              const cardContent = (
                <div
                  style={{
                    padding: isMobile ? 18 : 20,
                    borderRadius: 24,
                    border: `1px solid ${soft}`,
                    background: panel,
                    boxShadow: dark
                      ? '0 20px 44px rgba(2,6,23,0.22)'
                      : '0 16px 36px rgba(15,23,42,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        display: 'grid',
                        placeItems: 'center',
                        background: dark ? 'rgba(14,165,233,0.1)' : 'rgba(219,234,254,0.9)',
                        color: '#38bdf8',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {card.icon || '✦'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: muted, marginBottom: 6 }}>
                        {card.title}
                      </div>
                      <div
                        style={{
                          color: text,
                          fontSize: 18,
                          fontWeight: 800,
                          lineHeight: 1.3,
                          marginBottom: card.description ? 6 : 0,
                        }}
                      >
                        {card.value}
                      </div>
                      {card.description ? (
                        <p style={{ margin: 0, color: muted, fontSize: 13, lineHeight: 1.7 }}>
                          {card.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );

              if (card.href) {
                return (
                  <a
                    key={card.id}
                    href={card.href}
                    target={card.href.startsWith('http') ? '_blank' : undefined}
                    rel={card.href.startsWith('http') ? 'noreferrer' : undefined}
                    style={{ textDecoration: 'none' }}
                  >
                    {cardContent}
                  </a>
                );
              }

              return <div key={card.id}>{cardContent}</div>;
            })}
          </div>
        ) : null}

        {section.showAvailabilityCard ? (
          <div
            style={{
              padding: isMobile ? 18 : 20,
              borderRadius: 24,
              border: '1px solid rgba(34,197,94,0.22)',
              background: dark
                ? 'linear-gradient(180deg, rgba(34,197,94,0.12), rgba(2,6,23,0.72))'
                : 'linear-gradient(180deg, rgba(220,252,231,0.85), rgba(240,253,244,0.82))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: dark ? '#86efac' : '#15803d',
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              {section.availabilityTitle}
            </div>
            <p style={{ margin: 0, color: dark ? '#dcfce7' : '#166534', lineHeight: 1.75, fontSize: 14 }}>
              {section.availabilityText}
            </p>
          </div>
        ) : null}

        {section.showSocialLinks && socials.length > 0 ? (
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            {socials.map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  borderRadius: 999,
                  border: `1px solid ${soft}`,
                  background: dark ? 'rgba(15,23,42,0.48)' : 'rgba(255,255,255,0.82)',
                  color: text,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span style={{ color: '#38bdf8' }}>{item.icon || '•'}</span>
                {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );

    const formPanel = (
      <div
        id="contact-form"
        style={{
          padding: isMobile ? 22 : 30,
          borderRadius: 32,
          border: `1px solid ${soft}`,
          background: glass,
          boxShadow: dark
            ? '0 28px 74px rgba(2,6,23,0.28)'
            : '0 24px 64px rgba(15,23,42,0.08)',
          order: infoFirst ? 2 : 1,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 999,
            marginBottom: 14,
            background: dark ? 'rgba(15,23,42,0.56)' : 'rgba(255,255,255,0.74)',
            border: `1px solid ${soft}`,
            color: '#38bdf8',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {section.formLabel}
        </div>

        {sent ? (
          <div style={{ textAlign: section.alignment }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>✅</div>
            <h3
              style={{
                color: text,
                fontSize: isMobile ? 28 : 34,
                letterSpacing: '-0.05em',
                margin: '0 0 12px',
              }}
            >
              {section.successTitle}
            </h3>
            <p style={{ color: muted, lineHeight: 1.8, margin: '0 0 20px' }}>
              {submitState.message || section.successMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setSubmitState({ type: '', message: '' });
              }}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '13px 22px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              আরেকটি বার্তা পাঠান
            </button>
          </div>
        ) : (
          <>
            <h3
              style={{
                margin: '0 0 12px',
                color: text,
                fontSize: isMobile ? 28 : 38,
                letterSpacing: '-0.05em',
              }}
            >
              {section.formTitle}
            </h3>
            {section.formDescription ? (
              <p style={{ margin: '0 0 24px', color: muted, lineHeight: 1.8, fontSize: 15 }}>
                {section.formDescription}
              </p>
            ) : null}

            {submitState.type === 'error' ? (
              <div
                style={{
                  marginBottom: 18,
                  borderRadius: 18,
                  padding: '12px 14px',
                  background: dark ? 'rgba(127,29,29,0.34)' : 'rgba(254,226,226,0.92)',
                  border: '1px solid rgba(248,113,113,0.24)',
                  color: dark ? '#fecaca' : '#b91c1c',
                  fontSize: 14,
                }}
              >
                {submitState.message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 16,
                }}
              >
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>আপনার নাম</span>
                  <input
                    value={form.name}
                    onChange={event =>
                      setForm(current => ({ ...current, name: event.target.value }))
                    }
                    required
                    placeholder="Md. Rahim"
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>ইমেইল</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={event =>
                      setForm(current => ({ ...current, email: event.target.value }))
                    }
                    required
                    placeholder="rahim@gmail.com"
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>মোবাইল নাম্বার</span>
                  <input
                    value={form.mobileNumber}
                    onChange={event =>
                      setForm(current => ({ ...current, mobileNumber: event.target.value }))
                    }
                    required
                    placeholder="+8801XXXXXXXXX"
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>WhatsApp নাম্বার</span>
                  <input
                    value={form.whatsappNumber}
                    onChange={event =>
                      setForm(current => ({ ...current, whatsappNumber: event.target.value }))
                    }
                    required
                    placeholder="+8801XXXXXXXXX"
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>Service type</span>
                  <select
                    value={form.serviceType}
                    onChange={event =>
                      setForm(current => ({ ...current, serviceType: event.target.value }))
                    }
                    required
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  >
                    {SERVICE_TYPE_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>Intent / category</span>
                  <select
                    value={form.intentCategory}
                    onChange={event =>
                      setForm(current => ({ ...current, intentCategory: event.target.value }))
                    }
                    required
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  >
                    {LEAD_INTENT_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 16,
                }}
              >
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>Project type</span>
                  <input
                    value={form.projectType}
                    onChange={event =>
                      setForm(current => ({ ...current, projectType: event.target.value }))
                    }
                    required
                    placeholder="YouTube campaign, brand reel, logo system..."
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>Budget range</span>
                  <input
                    value={form.budgetRange}
                    onChange={event =>
                      setForm(current => ({ ...current, budgetRange: event.target.value }))
                    }
                    required
                    placeholder="$300 - $600"
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>Deadline</span>
                  <input
                    value={form.deadline}
                    onChange={event =>
                      setForm(current => ({ ...current, deadline: event.target.value }))
                    }
                    required
                    placeholder="May 15, 2026"
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: muted }}>Preferred contact method</span>
                  <select
                    value={form.preferredContactMethod}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        preferredContactMethod: event.target.value,
                      }))
                    }
                    required
                    style={{
                      width: '100%',
                      background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                      border: `1px solid ${soft}`,
                      borderRadius: 14,
                      color: text,
                      padding: '13px 14px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  >
                    {PREFERRED_CONTACT_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 12, color: muted }}>Optional file / link</span>
                <input
                  value={form.attachmentLink}
                  onChange={event =>
                    setForm(current => ({ ...current, attachmentLink: event.target.value }))
                  }
                  placeholder="Google Drive, Figma, Behance, Dropbox..."
                  style={{
                    width: '100%',
                    background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                    border: `1px solid ${soft}`,
                    borderRadius: 14,
                    color: text,
                    padding: '13px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 12, color: muted }}>Project details / message</span>
                <textarea
                  value={form.message}
                  onChange={event =>
                    setForm(current => ({ ...current, message: event.target.value }))
                  }
                  required
                  rows={6}
                  placeholder="আপনার project, deadline, deliverables, references বা brand direction সম্পর্কে লিখুন..."
                  style={{
                    width: '100%',
                    background: dark ? '#020617' : 'rgba(255,255,255,0.92)',
                    border: `1px solid ${soft}`,
                    borderRadius: 16,
                    color: text,
                    padding: '14px',
                    fontSize: 14,
                    lineHeight: 1.7,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  border: 'none',
                  borderRadius: 16,
                  padding: '15px 20px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: submitting
                    ? dark
                      ? 'rgba(15,23,42,0.76)'
                      : 'rgba(226,232,240,0.92)'
                    : 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: submitting ? muted : '#fff',
                  fontSize: 15,
                  fontWeight: 850,
                  boxShadow: submitting ? 'none' : '0 18px 38px rgba(37,99,235,0.26)',
                }}
              >
                {submitting ? 'পাঠানো হচ্ছে...' : section.submitButtonText}
              </button>
            </form>
          </>
        )}
      </div>
    );

    return (
      <section key="formSection" style={{ padding: getSectionPadding(section.spacing, isMobile) }}>
        <div
          style={{
            maxWidth: getMaxWidth(section.width),
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: stacked ? '1fr' : 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: isMobile ? 24 : 30,
            alignItems: 'start',
          }}
        >
          {infoPanel}
          {formPanel}
        </div>
      </section>
    );
  }

  function renderExtraSection() {
    const section = pageConfig.extraSection;
    const stacked = isMobile || section.layout === 'stacked' || section.layout === 'centered';
    const visualFirst = section.layout === 'card-left';

    return (
      <section key="extraSection" style={{ padding: getSectionPadding(section.spacing, isMobile) }}>
        <div
          style={{
            maxWidth: getMaxWidth(section.width),
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: stacked ? '1fr' : 'minmax(340px, 0.9fr) minmax(0, 1.05fr)',
            gap: isMobile ? 24 : 36,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              order: visualFirst ? 1 : 2,
              position: 'relative',
              minHeight: isMobile ? 320 : 420,
              borderRadius: 32,
              overflow: 'hidden',
              border: `1px solid ${soft}`,
              background: section.image
                ? `linear-gradient(180deg, rgba(2,6,23,0.08), rgba(2,6,23,0.8)), url(${section.image}) center/cover no-repeat`
                : dark
                  ? 'linear-gradient(145deg, #020617, #0f172a 48%, #0ea5e9)'
                  : 'linear-gradient(145deg, #dbeafe, #eff6ff 48%, #0ea5e9)',
              boxShadow: dark
                ? '0 34px 90px rgba(2,6,23,0.28)'
                : '0 24px 64px rgba(15,23,42,0.08)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 24% 18%, rgba(56,189,248,0.2), transparent 30%), linear-gradient(180deg, rgba(2,6,23,0.08), rgba(2,6,23,0.82))',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 18,
                right: 18,
                bottom: 18,
                padding: 22,
                borderRadius: 24,
                background: 'linear-gradient(180deg, rgba(2,6,23,0.54), rgba(2,6,23,0.84))',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#e2e8f0',
              }}
            >
              <div
                style={{
                  color: '#7dd3fc',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Contact Workflow
              </div>
              <p style={{ margin: 0, lineHeight: 1.7, fontSize: 15 }}>
                {section.subtitle || 'Clear direction, revision-friendly process, and delivery that feels presentation-ready.'}
              </p>
            </div>
          </div>

          <div
            style={{
              order: visualFirst ? 2 : 1,
              textAlign: section.alignment,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: 999,
                marginBottom: 16,
                border: `1px solid ${soft}`,
                background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.8)',
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {section.label}
            </div>
            <h2
              style={{
                margin: '0 0 14px',
                color: text,
                fontSize: isMobile ? 30 : 46,
                letterSpacing: '-0.05em',
              }}
            >
              {section.title}
            </h2>
            {section.subtitle ? (
              <div style={{ color: '#38bdf8', fontWeight: 800, marginBottom: 12 }}>
                {section.subtitle}
              </div>
            ) : null}
            {section.description ? (
              <p style={{ margin: 0, color: muted, lineHeight: 1.85, fontSize: 15 }}>
                {section.description}
              </p>
            ) : null}
            {section.showButton ? (
              <div style={{ marginTop: 24 }}>
                <Link
                  href={section.buttonLink || '/portfolio'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                    padding: '13px 20px',
                    borderRadius: 14,
                    fontWeight: 800,
                    boxShadow: '0 18px 38px rgba(37,99,235,0.22)',
                  }}
                >
                  {section.buttonText}
                  <span>→</span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function renderCta() {
    const section = pageConfig.cta;

    return (
      <section key="cta" style={{ padding: getSectionPadding(section.spacing, isMobile) }}>
        <div
          style={{
            maxWidth: getMaxWidth(section.width),
            margin: '0 auto',
            padding: isMobile ? '28px 20px' : '42px 30px',
            borderRadius: 34,
            border: `1px solid ${soft}`,
            background: glass,
            boxShadow: dark
              ? '0 28px 74px rgba(2,6,23,0.28)'
              : '0 24px 64px rgba(15,23,42,0.08)',
            textAlign: section.alignment,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              marginBottom: 16,
              border: `1px solid ${soft}`,
              background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.8)',
              color: '#38bdf8',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {section.label}
          </div>
          <h2
            style={{
              margin: '0 0 12px',
              color: text,
              fontSize: isMobile ? 28 : 42,
              letterSpacing: '-0.05em',
            }}
          >
            {section.title}
          </h2>
          {section.description ? (
            <p style={{ margin: '0 auto', color: muted, lineHeight: 1.85, fontSize: 15, maxWidth: 760 }}>
              {section.description}
            </p>
          ) : null}
          <div
            style={{
              display: 'flex',
              justifyContent: section.alignment === 'center' ? 'center' : 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 24,
            }}
          >
            {section.showPrimaryButton ? (
              <Link
                href={section.primaryButtonLink || '#contact-form'}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: '#fff',
                  borderRadius: 14,
                  padding: '14px 22px',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 850,
                  boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
                }}
              >
                {section.primaryButtonText} →
              </Link>
            ) : null}
            {section.showSecondaryButton ? (
              <Link
                href={section.secondaryButtonLink || '/'}
                style={{
                  background: dark ? 'rgba(15,23,42,0.52)' : 'rgba(255,255,255,0.8)',
                  color: text,
                  border: `1px solid ${soft}`,
                  borderRadius: 14,
                  padding: '14px 20px',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 760,
                }}
              >
                {section.secondaryButtonText}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  const renderers: Record<string, () => React.ReactNode> = {
    hero: renderHero,
    formSection: renderFormSection,
    extraSection: renderExtraSection,
    cta: renderCta,
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: text,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {orderedSections.map(section => renderers[section.key]())}
      <GlobalFooter config={footerConfig} isMobile={isMobile} />
    </main>
  );
}
