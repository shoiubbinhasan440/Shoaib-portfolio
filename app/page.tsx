'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const router = useRouter();
  const [showreel, setShowreel] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [heroTitle, setHeroTitle] = useState('Visual Storyteller & Creative Director');
  const [heroSubtitle, setHeroSubtitle] = useState('ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।');
  const [heroBadge, setHeroBadge] = useState('Available for work');
  const [heroImage, setHeroImage] = useState('');
  const [ctaBtn, setCtaBtn] = useState('Portfolio দেখুন');
  const [statClients, setStatClients] = useState(50);
  const [statYears, setStatYears] = useState(3);
  const [videoCount, setVideoCount] = useState(0);
  const [portfolioVideos, setPortfolioVideos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function fetchData() {
    const { data: settings } = await supabase.from('site_settings').select('*');
    if (settings) {
      settings.forEach((s: { key: string; value: string }) => {
        if (s.key === 'showreel_url') setShowreel(s.value);
        if (s.key === 'hero_title') setHeroTitle(s.value);
        if (s.key === 'hero_subtitle') setHeroSubtitle(s.value);
        if (s.key === 'hero_badge') setHeroBadge(s.value);
        if (s.key === 'hero_image') setHeroImage(s.value);
        if (s.key === 'cta_button') setCtaBtn(s.value);
        if (s.key === 'stat_clients') setStatClients(parseInt(s.value) || 50);
        if (s.key === 'stat_years') setStatYears(parseInt(s.value) || 3);
      });
    }
    const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true }).eq('visible', true);
    setVideoCount(count || 0);

    // Portfolio preview — last 6 visible videos
    const { data: vids } = await supabase.from('videos').select('*').eq('visible', true).order('created_at', { ascending: false }).limit(6);
    setPortfolioVideos(vids || []);
  }

  const getThumb = (youtubeUrl: string) => {
    if (!youtubeUrl) return '';
    const match = youtubeUrl.match(/(?:v=|embed\/|youtu\.be\/)([^&?/]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  };

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s',
      }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <span style={{ color: '#fff' }}>Sayeed</span>
          <span style={{ color: '#3b82f6' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 14, alignItems: 'center' }}>
          {[
            { label: 'Home', href: '/' },
            { label: 'Portfolio', href: '/portfolio' },
            { label: 'Tutorial', href: '/tutorial' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ].map(item => (
            <a key={item.label} href={item.href}
              style={{ color: item.label === 'Home' ? '#fff' : '#666', textDecoration: 'none', fontWeight: item.label === 'Home' ? 600 : 400, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = item.label === 'Home' ? '#fff' : '#666'}>
              {item.label}
            </a>
          ))}
          <a href="/admin/login"
            style={{ color: '#666', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#fff'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#666'}>
            Login
          </a>
          <a href="/portfolio"
            style={{ background: '#3b82f6', color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#2563eb'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#3b82f6'}>
            Visit Portfolio →
          </a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '100px 60px 60px',
        position: 'relative', overflow: 'hidden',
        maxWidth: 1400, margin: '0 auto',
      }}>
        {/* BG glow */}
        <div style={{ position: 'absolute', top: '20%', left: '40%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Left — text */}
        <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#93c5fd', fontSize: 11, fontWeight: 700,
            padding: '6px 16px', borderRadius: 20, marginBottom: 28,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {heroBadge}
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 5vw, 68px)', fontWeight: 800,
            letterSpacing: '-2px', lineHeight: 1.05, margin: '0 0 24px',
            maxWidth: 600,
          }}>
            {heroTitle}
          </h1>

          <p style={{ fontSize: 16, color: '#555', maxWidth: 460, margin: '0 0 44px', lineHeight: 1.8 }}>
            {heroSubtitle}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/portfolio')}
              style={{ background: '#fff', color: '#000', border: 'none', padding: '14px 30px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
              {ctaBtn} →
            </button>
            <button onClick={() => setShowModal(true)}
              style={{ background: 'transparent', color: '#fff', border: '1px solid #222', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#444'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#222'}>
              <span style={{ width: 26, height: 26, background: '#1a1a1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '9px solid #fff', marginLeft: 2 }} />
              </span>
              Showreel
            </button>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 72, display: 'flex', alignItems: 'center', gap: 10, color: '#2a2a2a' }}>
            <div style={{ width: 40, height: 1, background: '#2a2a2a' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll to explore</span>
          </div>
        </div>

        {/* Right — Hero Image */}
        <div style={{ width: 420, height: 520, flexShrink: 0, marginLeft: 60, position: 'relative' }}>
          {/* Decorative frame */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            border: '1px solid rgba(59,130,246,0.15)',
            background: heroImage
              ? `url(${heroImage}) center/cover no-repeat`
              : 'linear-gradient(135deg, #0f172a, #111827)',
            overflow: 'hidden',
          }}>
            {!heroImage && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontSize: 48 }}>🎬</div>
                <div style={{ fontSize: 12, color: '#334155', textAlign: 'center', padding: '0 20px' }}>
                  Admin Panel থেকে<br />Hero Image যোগ করুন
                </div>
              </div>
            )}
            {/* Overlay gradient at bottom */}
            {heroImage && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, rgba(8,8,8,0.7), transparent)' }} />}
          </div>

          {/* Floating badge */}
          <div style={{
            position: 'absolute', bottom: -16, left: -24,
            background: '#0d0d0d', border: '1px solid #1e1e1e',
            borderRadius: 14, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>{videoCount}+</div>
              <div style={{ fontSize: 11, color: '#444' }}>Projects Done</div>
            </div>
          </div>

          {/* Top right badge */}
          <div style={{
            position: 'absolute', top: -16, right: -16,
            background: '#0d0d0d', border: '1px solid #1e1e1e',
            borderRadius: 14, padding: '12px 18px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Experience</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{statYears}+ yrs</div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '20px 60px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#0d0d0d', border: '1px solid #111', borderRadius: 20, overflow: 'hidden',
        }}>
          {[
            { value: videoCount + '+', label: 'প্রজেক্ট সম্পন্ন', icon: '🎬' },
            { value: statClients + '+', label: 'সন্তুষ্ট ক্লায়েন্ট', icon: '🤝' },
            { value: statYears + '+', label: 'বছরের অভিজ্ঞতা', icon: '⚡' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '44px 24px', textAlign: 'center', borderRight: i < 2 ? '1px solid #111' : 'none' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 'clamp(38px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#444' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Showreel ── */}
      <section style={{ padding: '0 60px 100px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Featured Work</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>আমার Showreel</h2>
        </div>
        <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #1a1a1a', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
          <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <iframe src={showreel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      </section>

      {/* ── Portfolio Preview ── */}
      {portfolioVideos.length > 0 && (
        <section style={{ padding: '0 60px 100px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Portfolio</div>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>সাম্প্রতিক কাজ</h2>
            </div>
            <a href="/portfolio" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>সব দেখুন →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {portfolioVideos.map((vid, i) => {
              const thumb = vid.thumbnail || getThumb(vid.youtube_url || '');
              return (
                <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: '#0d0d0d', border: '1px solid #111', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'none'}
                  onClick={() => router.push('/portfolio')}>
                  <div style={{ paddingBottom: '56.25%', position: 'relative', background: '#111' }}>
                    {thumb && <img src={thumb} alt={vid.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0'}>
                      <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '13px solid #000', marginLeft: 3 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{vid.title}</div>
                    <div style={{ fontSize: 11, color: '#444' }}>{vid.category || 'Video'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{ padding: '0 60px 100px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', border: '1px solid #1e3a8a', borderRadius: 24, padding: '60px 48px' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🎬</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.5px' }}>{videoCount}+ প্রজেক্ট রেডি</h2>
          <p style={{ color: '#475569', fontSize: 16, margin: '0 0 32px', lineHeight: 1.6 }}>Video Editing থেকে Graphics Design — সব কাজ একসাথে।</p>
          <button onClick={() => router.push('/portfolio')}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px 34px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            পুরো Portfolio দেখুন →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #0f0f0f', padding: '28px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>
          <span>Sayeed</span><span style={{ color: '#3b82f6' }}>.</span>
        </div>
        <div style={{ fontSize: 13, color: '#2a2a2a' }}>© 2025 Sayeed Fahad. All rights reserved.</div>
      </footer>

      {/* ── Showreel Modal ── */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: '#0d0d0d', borderRadius: 16, overflow: 'hidden', border: '1px solid #1e1e1e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #111' }}>
              <span style={{ fontWeight: 700 }}>🎬 Showreel</span>
              <button onClick={() => setShowModal(false)} style={{ background: '#111', border: '1px solid #222', color: '#666', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
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