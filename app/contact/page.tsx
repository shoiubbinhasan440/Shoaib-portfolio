'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // ২ সেকেন্ড delay (পরে real email service যোগ করা যাবে)
    await new Promise(r => setTimeout(r, 2000));
    setSending(false);
    setSent(true);
  }

  const contacts = [
    { icon: '📧', label: 'Email', value: 'sayeedfahad@gmail.com', href: 'mailto:sayeedfahad@gmail.com' },
    { icon: '📱', label: 'WhatsApp', value: '+880 1XXX-XXXXXX', href: 'https://wa.me/880XXXXXXXXXX' },
    { icon: '🎬', label: 'YouTube', value: '@SayeedFahad', href: 'https://youtube.com/@SayeedFahad' },
    { icon: '📸', label: 'Instagram', value: '@sayeedfahad', href: 'https://instagram.com/sayeedfahad' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 60px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          যোগাযোগ
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px' }}>
          কাজ করতে চান?
        </h1>
        <p style={{ color: '#555', fontSize: 15, maxWidth: 440, margin: '0 auto' }}>
          যেকোনো প্রজেক্ট বা কোলাবোরেশনের জন্য আমার সাথে যোগাযোগ করুন।
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 100px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 40 }}>

        {/* Left — Contact Info */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>সরাসরি যোগাযোগ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contacts.map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
                style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2a2a2a';
                  (e.currentTarget as HTMLAnchorElement).style.background = '#141414';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1a1a1a';
                  (e.currentTarget as HTMLAnchorElement).style.background = '#111';
                }}>
                <div style={{ width: 44, height: 44, background: '#1a1a1a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 14, color: '#ccc', fontWeight: 500 }}>{c.value}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Availability */}
          <div style={{ marginTop: 24, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
              <span style={{ fontSize: 14, color: '#86efac', fontWeight: 600 }}>এখন কাজ নেওয়া যাচ্ছে</span>
            </div>
            <p style={{ fontSize: 13, color: '#555', marginTop: 8, marginBottom: 0 }}>
              সাধারণত ২৪ ঘণ্টার মধ্যে reply করি।
            </p>
          </div>
        </div>

        {/* Right — Contact Form */}
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: 32 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>বার্তা পাঠানো হয়েছে!</h3>
              <p style={{ color: '#555', marginBottom: 28 }}>শীঘ্রই যোগাযোগ করব।</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                আবার পাঠান
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>বার্তা পাঠান</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>আপনার নাম *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required placeholder="Md. Rahim"
                      style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>ইমেইল *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required placeholder="rahim@gmail.com"
                      style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>বিষয় *</label>
                  <input
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    required placeholder="যেমন: Wedding Video Editing"
                    style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>বার্তা *</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    required rows={5}
                    placeholder="আপনার প্রজেক্ট সম্পর্কে বলুন..."
                    style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                <button type="submit" disabled={sending}
                  style={{ width: '100%', background: sending ? '#1a1a1a' : '#3b82f6', color: sending ? '#555' : '#fff', border: 'none', padding: '13px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: sending ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {sending ? '⏳ পাঠানো হচ্ছে...' : '📨 বার্তা পাঠান'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #111', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>
          <span>Sayeed</span><span style={{ color: '#3b82f6' }}>.</span>
        </div>
        <div style={{ fontSize: 13, color: '#333' }}>© 2025 Sayeed Fahad. All rights reserved.</div>
      </footer>
    </div>
  );
}