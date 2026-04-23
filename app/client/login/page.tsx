'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

export default function ClientLoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [identifier, setIdentifier] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode, identifier }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Client login failed.');
      }

      router.push('/client/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Client login failed.');
    } finally {
      setSubmitting(false);
    }
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'start',
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
            Client Portal
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2.4rem, 7vw, 4.4rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.07em',
            }}
          >
            Track your project with clarity
          </h1>
          <p style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 16, lineHeight: 1.9, margin: '18px 0 0' }}>
            Use the email, mobile, or WhatsApp number connected to your project together with the access code shared after your project was accepted.
          </p>

          <div
            style={{
              marginTop: 22,
              padding: 18,
              borderRadius: 24,
              background: dark ? 'rgba(15,23,42,0.76)' : 'rgba(248,250,252,0.94)',
              border: `1px solid ${dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)'}`,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Inside the dashboard</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: dark ? '#cbd5e1' : '#334155', lineHeight: 1.9 }}>
              <li>Current project status and progress percentage</li>
              <li>Milestones, requirements, and next step</li>
              <li>Client-visible notes and delivery links</li>
              <li>Updates without exposing private admin notes</li>
            </ul>
          </div>
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
          <h2 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.05em' }}>Login</h2>
          <p style={{ margin: '0 0 24px', color: dark ? '#94a3b8' : '#475569', lineHeight: 1.8 }}>
            Your access code is issued when the project is moved into the client portal.
          </p>

          {error ? (
            <div
              style={{
                borderRadius: 18,
                padding: '12px 14px',
                marginBottom: 18,
                border: '1px solid rgba(248,113,113,0.2)',
                background: dark ? 'rgba(127,29,29,0.28)' : 'rgba(254,226,226,0.92)',
                color: dark ? '#fecaca' : '#b91c1c',
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 12 }}>
                Email / Mobile / WhatsApp
              </span>
              <input
                value={identifier}
                onChange={event => setIdentifier(event.target.value)}
                placeholder="name@email.com or +8801..."
                required
                style={fieldStyle(dark)}
              />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: dark ? '#94a3b8' : '#475569', fontSize: 12 }}>
                Access code
              </span>
              <input
                value={accessCode}
                onChange={event => setAccessCode(event.target.value.toUpperCase())}
                placeholder="VED-0001-X7QK"
                required
                style={fieldStyle(dark)}
              />
            </label>

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
              {submitting ? 'Logging in...' : 'Open client dashboard'}
            </button>
          </form>

          <div style={{ marginTop: 18, color: dark ? '#94a3b8' : '#475569', fontSize: 13, lineHeight: 1.8 }}>
            Need help? Reach out from the <Link href="/contact" style={{ color: '#38bdf8' }}>contact page</Link> and mention that you need your client portal access code.
          </div>
        </section>
      </div>
    </main>
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
