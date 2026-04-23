'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

type BriefFormState = {
  brandName: string;
  budget: string;
  colorPreference: string;
  contentScript: string;
  contactEmail: string;
  deadline: string;
  notes: string;
  projectGoal: string;
  projectTitle: string;
  referencesLinks: string;
  requiredFilesLinks: string;
  serviceNeeded: string;
  status: string;
  stylePreference: string;
  submittedAt: string;
  targetAudience: string;
  whatsappNumber: string;
};

export default function CreativeBriefPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [form, setForm] = useState<BriefFormState>({
    brandName: '',
    budget: '',
    colorPreference: '',
    contentScript: '',
    contactEmail: '',
    deadline: '',
    notes: '',
    projectGoal: '',
    projectTitle: '',
    referencesLinks: '',
    requiredFilesLinks: '',
    serviceNeeded: '',
    status: '',
    submittedAt: '',
    stylePreference: '',
    targetAudience: '',
    whatsappNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/brief/${token}`);
        const result = (await response.json()) as {
          brief?: BriefFormState;
          error?: string;
        };

        if (!response.ok || !result.brief) {
          throw new Error(result.error || 'Brief not found.');
        }

        setForm(result.brief);
        setSubmitted(result.brief.status === 'submitted');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load brief.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      void load();
    }
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/brief/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit brief.');
      }

      setSubmitted(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit brief.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: dark ? '#050816' : '#f5f9ff',
          color: dark ? '#94a3b8' : '#475569',
        }}
      >
        Loading brief...
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '120px 24px',
          background: dark ? '#050816' : '#f5f9ff',
          color: dark ? '#f8fafc' : '#0f172a',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            borderRadius: 32,
            padding: '28px 26px',
            textAlign: 'center',
            border: `1px solid ${dark ? 'rgba(248,113,113,0.18)' : 'rgba(248,113,113,0.2)'}`,
            background: dark
              ? 'linear-gradient(145deg, rgba(2,6,23,0.92), rgba(127,29,29,0.18))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(254,242,242,0.94))',
          }}
        >
          <h1 style={{ margin: '0 0 10px', fontSize: 32, letterSpacing: '-0.05em' }}>
            Brief link unavailable
          </h1>
          <p style={{ margin: 0, color: dark ? '#94a3b8' : '#475569', lineHeight: 1.8 }}>
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '120px 20px 80px',
        background: dark
          ? 'radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 30%), #050816'
          : 'radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 28%), #f5f9ff',
        color: dark ? '#f8fafc' : '#0f172a',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <section
          style={{
            borderRadius: 32,
            border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'}`,
            padding: '28px 26px',
            background: dark
              ? 'linear-gradient(145deg, rgba(2,6,23,0.92), rgba(15,23,42,0.82))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: dark ? 'rgba(14,165,233,0.12)' : 'rgba(219,234,254,0.84)',
              color: '#38bdf8',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Creative Brief
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.4rem, 7vw, 4rem)', lineHeight: 0.95, letterSpacing: '-0.07em' }}>
            Share the details that shape the project
          </h1>
          <p style={{ margin: '16px 0 0', color: dark ? '#94a3b8' : '#475569', lineHeight: 1.9, maxWidth: 760 }}>
            This form helps transform your initial inquiry into a precise scope, better direction, and smoother delivery.
          </p>
        </section>

        <section
          style={{
            borderRadius: 32,
            border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'}`,
            padding: '28px 26px',
            background: dark
              ? 'linear-gradient(145deg, rgba(2,6,23,0.92), rgba(15,23,42,0.82))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
              <div style={{ fontSize: 54, marginBottom: 16 }}>✓</div>
              <h2 style={{ margin: '0 0 12px', fontSize: 34, letterSpacing: '-0.05em' }}>
                Brief submitted
              </h2>
              <p style={{ margin: 0, color: dark ? '#94a3b8' : '#475569', lineHeight: 1.8 }}>
                Thanks for sending the project details. The submission is now attached to your lead and the project owner can continue from there.
              </p>
              <div style={{ marginTop: 18, color: dark ? '#94a3b8' : '#475569', fontSize: 13 }}>
                Need to add something else? Reach out through <Link href="/contact" style={{ color: '#38bdf8' }}>contact</Link>.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <Field label="Project title">
                  <input value={form.projectTitle} onChange={event => setForm(current => ({ ...current, projectTitle: event.target.value }))} required style={fieldStyle(dark)} />
                </Field>
                <Field label="Brand / business name">
                  <input value={form.brandName} onChange={event => setForm(current => ({ ...current, brandName: event.target.value }))} style={fieldStyle(dark)} />
                </Field>
                <Field label="Service needed">
                  <input value={form.serviceNeeded} onChange={event => setForm(current => ({ ...current, serviceNeeded: event.target.value }))} required style={fieldStyle(dark)} />
                </Field>
                <Field label="WhatsApp number">
                  <input value={form.whatsappNumber} onChange={event => setForm(current => ({ ...current, whatsappNumber: event.target.value }))} required style={fieldStyle(dark)} />
                </Field>
                <Field label="Deadline">
                  <input value={form.deadline} onChange={event => setForm(current => ({ ...current, deadline: event.target.value }))} required style={fieldStyle(dark)} />
                </Field>
                <Field label="Budget">
                  <input value={form.budget} onChange={event => setForm(current => ({ ...current, budget: event.target.value }))} required style={fieldStyle(dark)} />
                </Field>
              </div>

              <Field label="Project goal">
                <textarea value={form.projectGoal} onChange={event => setForm(current => ({ ...current, projectGoal: event.target.value }))} required rows={4} style={textareaStyle(dark)} />
              </Field>
              <Field label="Target audience">
                <textarea value={form.targetAudience} onChange={event => setForm(current => ({ ...current, targetAudience: event.target.value }))} required rows={4} style={textareaStyle(dark)} />
              </Field>
              <Field label="References / inspiration links">
                <textarea value={form.referencesLinks} onChange={event => setForm(current => ({ ...current, referencesLinks: event.target.value }))} rows={3} style={textareaStyle(dark)} />
              </Field>
              <Field label="Required files / links">
                <textarea value={form.requiredFilesLinks} onChange={event => setForm(current => ({ ...current, requiredFilesLinks: event.target.value }))} rows={3} style={textareaStyle(dark)} />
              </Field>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <Field label="Style preference">
                  <input value={form.stylePreference} onChange={event => setForm(current => ({ ...current, stylePreference: event.target.value }))} style={fieldStyle(dark)} />
                </Field>
                <Field label="Color preference">
                  <input value={form.colorPreference} onChange={event => setForm(current => ({ ...current, colorPreference: event.target.value }))} style={fieldStyle(dark)} />
                </Field>
              </div>
              <Field label="Content / script">
                <textarea value={form.contentScript} onChange={event => setForm(current => ({ ...current, contentScript: event.target.value }))} rows={5} style={textareaStyle(dark)} />
              </Field>
              <Field label="Notes">
                <textarea value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} rows={4} style={textareaStyle(dark)} />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  borderRadius: 16,
                  padding: '14px 18px',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: submitting
                    ? dark
                      ? 'rgba(15,23,42,0.72)'
                      : 'rgba(226,232,240,0.9)'
                    : 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                  color: submitting ? (dark ? '#94a3b8' : '#475569') : '#fff',
                  fontWeight: 800,
                  boxShadow: submitting ? 'none' : '0 18px 40px rgba(37,99,235,0.26)',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit creative brief'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      {children}
    </label>
  );
}

function fieldStyle(dark: boolean): React.CSSProperties {
  return {
    width: '100%',
    borderRadius: 14,
    padding: '13px 14px',
    border: `1px solid ${dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)'}`,
    background: dark ? 'rgba(2,6,23,0.92)' : 'rgba(255,255,255,0.94)',
    color: dark ? '#f8fafc' : '#0f172a',
    boxSizing: 'border-box',
  };
}

function textareaStyle(dark: boolean): React.CSSProperties {
  return {
    ...fieldStyle(dark),
    resize: 'vertical',
    lineHeight: 1.7,
  };
}
