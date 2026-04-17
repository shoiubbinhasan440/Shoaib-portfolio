'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Tutorial {
  id: number;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail: string;
  category: string;
  duration: string;
  level: string;
  order_num: number;
  visible: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  beginner: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', label: 'Beginner' },
  intermediate: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', label: 'Intermediate' },
  advanced: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', label: 'Advanced' },
};

export default function TutorialPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [selected, setSelected] = useState<Tutorial | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data } = await supabase
      .from('tutorials')
      .select('*')
      .eq('visible', true)
      .order('order_num', { ascending: true });
    setTutorials(data || []);
    setLoading(false);
  }

  const categories = ['all', ...Array.from(new Set(tutorials.map(t => t.category).filter(Boolean)))];

  const filtered = tutorials.filter(t => {
    const catMatch = activeCategory === 'all' || t.category === activeCategory;
    const levelMatch = activeLevel === 'all' || t.level === activeLevel;
    return catMatch && levelMatch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <span style={{ color: '#fff' }}>Sayeed</span><span style={{ color: '#3b82f6' }}>.</span>
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
              style={{ color: item.label === 'Tutorial' ? '#fff' : '#555', textDecoration: 'none', fontWeight: item.label === 'Tutorial' ? 600 : 400 }}>
              {item.label}
            </a>
          ))}
          <a href="/portfolio" style={{ background: '#3b82f6', color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
            Portfolio →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 56px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          🎓 Tutorial
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px' }}>
          শিখুন, এগিয়ে যান
        </h1>
        <p style={{ color: '#555', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
          Video Editing ও Graphic Design-এর উপর বাংলায় সহজ টিউটোরিয়াল।
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 36 }}>
          {[
            { value: tutorials.length + '+', label: 'টিউটোরিয়াল' },
            { value: '100%', label: 'ফ্রি' },
            { value: 'বাংলা', label: 'ভাষায়' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? '#fff' : '#111',
                  color: activeCategory === cat ? '#000' : '#555',
                  border: `1px solid ${activeCategory === cat ? '#fff' : '#222'}`,
                  padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                }}>
                {cat === 'all' ? `সব (${tutorials.length})` : cat}
              </button>
            ))}
          </div>

          {/* Level */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {['all', 'beginner', 'intermediate', 'advanced'].map(lvl => (
              <button key={lvl} onClick={() => setActiveLevel(lvl)}
                style={{
                  background: activeLevel === lvl ? (LEVEL_COLORS[lvl]?.bg || 'rgba(255,255,255,0.1)') : 'transparent',
                  color: activeLevel === lvl ? (LEVEL_COLORS[lvl]?.color || '#fff') : '#555',
                  border: `1px solid ${activeLevel === lvl ? (LEVEL_COLORS[lvl]?.color || '#444') : '#1a1a1a'}`,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
                }}>
                {lvl === 'all' ? 'সব লেভেল' : LEVEL_COLORS[lvl]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#333' }}>লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#444' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <p>শীঘ্রই টিউটোরিয়াল আসছে...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map((t, index) => (
              <div key={t.id} onClick={() => setSelected(t)}
                style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1a1a1a';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0d0d0d' }}>
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt={t.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#222' }}>🎓</div>
                  )}
                  {/* Play */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #000', marginLeft: 3 }} />
                    </div>
                  </div>
                  {/* Number */}
                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                    #{index + 1}
                  </div>
                  {/* Duration */}
                  {t.duration && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>
                      ⏱ {t.duration}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {t.level && LEVEL_COLORS[t.level] && (
                      <span style={{ background: LEVEL_COLORS[t.level].bg, color: LEVEL_COLORS[t.level].color, fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                        {LEVEL_COLORS[t.level].label}
                      </span>
                    )}
                    {t.category && (
                      <span style={{ background: '#1a1a1a', color: '#666', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>
                        {t.category}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}>{t.title}</div>
                  {t.description && (
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 900, background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1a1a1a' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 4, display: 'flex', gap: 10 }}>
                  {selected.level && LEVEL_COLORS[selected.level] && (
                    <span style={{ color: LEVEL_COLORS[selected.level].color }}>{LEVEL_COLORS[selected.level].label}</span>
                  )}
                  {selected.category && <span>{selected.category}</span>}
                  {selected.duration && <span>⏱ {selected.duration}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
              <iframe
                src={selected.youtube_url + '?autoplay=1'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {selected.description && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1a', color: '#666', fontSize: 14, lineHeight: 1.6 }}>
                {selected.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}