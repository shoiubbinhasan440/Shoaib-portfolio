'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const contactRef = useRef<HTMLDivElement>(null);

  const [showreel, setShowreel] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [heroTitle, setHeroTitle] = useState('Visual Storyteller & Creative Director');
  const [heroSubtitle, setHeroSubtitle] = useState('ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।');
  const [heroImage, setHeroImage] = useState('');
  const [heroImageMobile, setHeroImageMobile] = useState('');
  const [statClients, setStatClients] = useState(50);
  const [statYears, setStatYears] = useState(3);
  const [videoCount, setVideoCount] = useState(0);
  const [portfolioVideos, setPortfolioVideos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const bg = dark ? '#080808' : '#f9f9f9';
  const text = dark ? '#fff' : '#111';
  const sub = dark ? '#555' : '#888';
  const card = dark ? '#0d0d0d' : '#fff';
  const border = dark ? '#1a1a1a' : '#e5e5e5';
  const muted = dark ? '#333' : '#ccc';

  useEffect(() => {
    fetchData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function fetchData() {
    const { data: settings } = await supabase.from('site_settings').select('*');
    if (settings) {
      settings.forEach((s: any) => {
        if (s.key === 'showreel_url') setShowreel(s.value);
        if (s.key === 'hero_title') setHeroTitle(s.value);
        if (s.key === 'hero_subtitle') setHeroSubtitle(s.value);
        if (s.key === 'hero_image') setHeroImage(s.value);
        if (s.key === 'hero_image_mobile') setHeroImageMobile(s.value);
        if (s.key === 'stat_clients') setStatClients(parseInt(s.value) || 50);
        if (s.key === 'stat_years') setStatYears(parseInt(s.value) || 3);
      });
    }
    const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true }).eq('visible', true);
    setVideoCount(count || 0);
    const { data: vids } = await supabase.from('videos').select('*').eq('visible', true).order('order_num', { ascending: true }).limit(6);
    setPortfolioVideos(vids || []);
  }

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getThumb = (url: string) => {
    const match = url?.match(/(?:v=|embed\/|youtu\.be\/)([^&?/]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  };

  // Mobile-এ mobile image, Desktop-এ desktop image
  const currentHeroImage = isMobile && heroImageMobile ? heroImageMobile : heroImage;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden', transition: 'background 0.3s, color 0.3s' }}>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '40px 20px' : '60px 40px', maxWidth: 1300, margin: '0 auto', gap: 60, flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '25%', left: '45%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Left — Text */}
        <div style={{ flex: 1, minWidth: 280, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd', fontSize: 11, fontWeight: 700, padding: '6px 16px', borderRadius: 20, marginBottom: 28, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />
            Available for work
          </div>

          <h1 style={{ fontSize: isMobile ? '36px' : 'clamp(36px, 5vw, 66px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, margin: '0 0 22px', color: text, maxWidth: 580 }}>
            {heroTitle}
          </h1>

          <p style={{ fontSize: 16, color: sub, maxWidth: 460, margin: '0 0 40px', lineHeight: 1.8 }}>
            {heroSubtitle}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/portfolio')}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#3b82f6'}>
              Portfolio দেখুন →
            </button>
            <button onClick={scrollToContact}
              style={{ background: 'transparent', color: text, border: `1px solid ${muted}`, padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
              Hire Me 🤝
            </button>
            <button onClick={() => setShowModal(true)}
              style={{ background: 'transparent', color: sub, border: `1px solid ${border}`, padding: '14px 24px', borderRadius: 10, fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, background: dark ? '#1a1a1a' : '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>▶</span>
              Showreel
            </button>
          </div>

          <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', gap: 10, color: muted }}>
            <div style={{ width: 40, height: 1, background: muted }} />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll to explore</span>
          </div>
        </div>

        {/* Right — Hero Image (Desktop-এ দেখাবে) */}
        {!isMobile && (
          <div style={{ width: 400, height: 500, flexShrink: 0, position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              border: `1px solid ${border}`,
              background: currentHeroImage
                ? `url(${currentHeroImage}) center/cover no-repeat`
                : (dark ? 'linear-gradient(135deg, #0f172a, #111827)' : 'linear-gradient(135deg, #e0f2fe, #ede9fe)'),
              overflow: 'hidden',
            }}>
              {!currentHeroImage && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ fontSize: 56 }}>🎬</div>
                  <div style={{ fontSize: 12, color: sub, textAlign: 'center' }}>Admin Settings থেকে ছবি যোগ করুন</div>
                </div>
              )}
            </div>

            {/* Floating badges */}
            <div style={{ position: 'absolute', bottom: -16, left: -24, background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.1)' }}>
              <div style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{videoCount}+</div>
                <div style={{ fontSize: 11, color: sub }}>Projects Done</div>
              </div>
            </div>

            <div style={{ position: 'absolute', top: -16, right: -16, background: card, border: `1px solid ${border}`, borderRadius: 14, padding: '12px 18px', boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 11, color: sub, marginBottom: 4 }}>Experience</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{statYears}+ yrs</div>
            </div>
          </div>
        )}

        {/* Mobile Hero Image — full width */}
        {isMobile && currentHeroImage && (
          <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}` }}>
            <img src={currentHeroImage} alt="hero" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
          </div>
        )}
      </section>

      {/* ── PORTFOLIO PREVIEW ── */}
      {portfolioVideos.length > 0 && (
        <section style={{ padding: isMobile ? '40px 20px' : '60px 40px', maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Featured Work</div>
              <h2 style={{ fontSize: isMobile ? '24px' : 'clamp(24px, 3vw, 38px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: text }}>সাম্প্রতিক কাজ</h2>
            </div>
            <a href="/portfolio" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>সব দেখুন →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {portfolioVideos.map((vid, i) => {
              const thumb = vid.thumbnail || getThumb(vid.youtube_url || '');
              return (
                <div key={i} onClick={() => router.push('/portfolio')}
                  style={{ borderRadius: 12, overflow: 'hidden', background: card, border: `1px solid ${border}`, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'none'}>
                  <div style={{ paddingBottom: '56.25%', position: 'relative', background: dark ? '#111' : '#f0f0f0' }}>
                    {thumb && <img src={thumb} alt={vid.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: text, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.title}</div>
                    <div style={{ fontSize: 11, color: sub }}>{vid.category || 'Video'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      <section style={{ padding: isMobile ? '40px 20px' : '80px 40px', maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>About Me</div>
          <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(26px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 20px', color: text }}>
            আমি একজন<br /><span style={{ color: '#3b82f6' }}>Creative Designer</span>
          </h2>
          <p style={{ color: sub, fontSize: 15, lineHeight: 1.9, marginBottom: 28 }}>
            ভিডিও এডিটিং ও গ্রাফিক ডিজাইনে {statYears}+ বছরের অভিজ্ঞতা নিয়ে কাজ করছি।
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { skill: 'Premiere Pro', pct: 95 },
              { skill: 'After Effects', pct: 88 },
              { skill: 'Photoshop', pct: 90 },
            ].map(s => (
              <div key={s.skill}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: text }}>
                  <span>{s.skill}</span><span style={{ color: '#3b82f6', fontWeight: 700 }}>{s.pct}%</span>
                </div>
                <div style={{ height: 4, background: dark ? '#1a1a1a' : '#e5e5e5', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: s.pct + '%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/about')}
            style={{ marginTop: 28, background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            আরও জানুন →
          </button>
        </div>

        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: 320, flexShrink: 0 }}>
            {[
              { icon: '🎬', label: 'Video Editing', desc: 'Cinematic cuts & grading' },
              { icon: '🎨', label: 'Graphic Design', desc: 'Logos, posters & branding' },
              { icon: '✨', label: 'Motion Graphics', desc: 'Animations & effects' },
              { icon: '📱', label: 'Social Media', desc: 'Reels & content' },
            ].map(item => (
              <div key={item.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 18, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = border}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: text, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: sub }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SHOWREEL ── */}
      <section style={{ padding: isMobile ? '40px 20px' : '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Featured</div>
          <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-1px', margin: 0, color: text }}>আমার Showreel</h2>
        </div>
        <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}`, boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <iframe src={showreel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: isMobile ? '40px 20px' : '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', background: card, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
          {[
            { value: videoCount + '+', label: 'প্রজেক্ট সম্পন্ন', icon: '🎬' },
            { value: statClients + '+', label: 'সন্তুষ্ট ক্লায়েন্ট', icon: '🤝' },
            { value: statYears + '+', label: 'বছরের অভিজ্ঞতা', icon: '⚡' },
            { value: '100%', label: 'ক্লায়েন্ট সন্তুষ্টি', icon: '⭐' },
          ].map((s, i) => (
            <div key={i} style={{ padding: isMobile ? '28px 16px' : '44px 24px', textAlign: 'center', borderRight: isMobile ? (i % 2 === 0 ? `1px solid ${border}` : 'none') : (i < 3 ? `1px solid ${border}` : 'none'), borderBottom: isMobile && i < 2 ? `1px solid ${border}` : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? '32px' : 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-2px', color: text, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: sub }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HIRE ME / CONTACT ── */}
      <section ref={contactRef} style={{ padding: isMobile ? '40px 20px 60px' : '60px 40px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', background: dark ? 'linear-gradient(135deg, #0f172a, #1e1b4b)' : 'linear-gradient(135deg, #eff6ff, #eef2ff)', border: `1px solid ${dark ? '#1e3a8a' : '#bfdbfe'}`, borderRadius: 24, padding: isMobile ? '40px 24px' : '56px 40px' }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>🤝</div>
          <h2 style={{ fontSize: isMobile ? '24px' : 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.5px', color: text }}>একসাথে কাজ করি?</h2>
          <p style={{ color: sub, fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
            Video Editing, Graphics Design বা যেকোনো Creative প্রজেক্টের জন্য যোগাযোগ করুন।
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/contact')}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              যোগাযোগ করুন →
            </button>
            <a href="https://wa.me/8801885080118" target="_blank" rel="noopener noreferrer"
              style={{ background: '#25d366', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              📱 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: isMobile ? '40px 20px 28px' : '48px 40px 32px', background: dark ? '#050505' : '#fff' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 28 : 40, marginBottom: 40 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 10 }}>
                <span style={{ color: text }}>Sayeed</span><span style={{ color: '#3b82f6' }}>.</span>
              </div>
              <p style={{ color: sub, fontSize: 14, lineHeight: 1.7 }}>Video Editor & Graphic Designer</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>Quick Links</div>
              {[{ label: 'Portfolio', href: '/portfolio' }, { label: 'Tutorial', href: '/tutorial' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }].map(l => (
                <a key={l.label} href={l.href} style={{ display: 'block', color: sub, textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>{l.label}</a>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>যোগাযোগ</div>
              <div style={{ color: sub, fontSize: 13, lineHeight: 2 }}>
                <div>📧 sayeedfahaad@gmail.com</div>
                <div>📱 +880 1885 080118</div>
                <div>📍 Mirpur 10, Dhaka</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>Social</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Facebook', href: 'https://facebook.com', icon: '📘' },
                  { label: 'YouTube', href: 'https://youtube.com', icon: '▶️' },
                  { label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: sub, textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.icon} {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: sub }}>© 2025 Sayeed Fahad. All rights reserved.</div>
            <div style={{ fontSize: 13, color: sub }}>Made with ❤️ in Bangladesh</div>
          </div>
        </div>
      </footer>

      {/* ── SHOWREEL MODAL ── */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: dark ? '#0d0d0d' : '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <span style={{ fontWeight: 700, color: text }}>🎬 Showreel</span>
              <button onClick={() => setShowModal(false)} style={{ background: dark ? '#111' : '#f5f5f5', border: `1px solid ${border}`, color: sub, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe src={showreel + '?autoplay=1'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}