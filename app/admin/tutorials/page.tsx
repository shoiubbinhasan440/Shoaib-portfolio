'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type S = { value: string; fontSize: number; fontWeight: string; color: string; fontFamily: string };

const DEF: Record<string, S> = {
  tutorial_title:    { value: 'Tutorial',                       fontSize: 56, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  tutorial_subtitle: { value: 'ভিডিও এডিটিং শিখুন ধাপে ধাপে', fontSize: 16, fontWeight: '400', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif' },
  tutorial_coming:   { value: 'শীঘ্রই আসছে...',                 fontSize: 24, fontWeight: '700', color: '#3b82f6',  fontFamily: 'Inter, system-ui, sans-serif' },
};

function st(s: S, extra?: React.CSSProperties): React.CSSProperties {
  return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, fontFamily: s.fontFamily, ...extra };
}

interface Tutorial {
  id: number; title: string; description: string; youtube_url: string;
  thumbnail: string; category: string; duration: string; level: string;
  order_num: number; visible: boolean;
}

const LEVEL: Record<string, { bg: string; color: string; label: string }> = {
  beginner:     { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', label: 'Beginner' },
  intermediate: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', label: 'Intermediate' },
  advanced:     { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', label: 'Advanced' },
};

export default function TutorialPage() {
  const [settings, setSettings]     = useState<Record<string, S>>(DEF);
  const [tutorials, setTutorials]   = useState<Tutorial[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCat] = useState('all');
  const [activeLevel, setActiveLvl]    = useState('all');
  const [selected, setSelected]        = useState<Tutorial | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: settingsData }, { data: tutorialsData }] = await Promise.all([
        supabase.from('site_settings').select('*'),
        supabase.from('tutorials').select('*').eq('visible', true).order('order_num'),
      ]);

      if (settingsData) {
        const map: Record<string, string> = {};
        settingsData.forEach((r: any) => { map[r.key] = r.value; });
        const merged: Record<string, S> = { ...DEF };
        Object.keys(DEF).forEach(key => {
          if (map[key]) {
            try { merged[key] = { ...DEF[key], ...JSON.parse(map[key]) }; }
            catch { merged[key] = { ...DEF[key], value: map[key] }; }
          }
        });
        setSettings(merged);
      }

      setTutorials(tutorialsData || []);
      setLoading(false);
    }
    load();
  }, []);

  const s = (key: string) => settings[key] || DEF[key];
  const categories = ['all', ...Array.from(new Set(tutorials.map(t => t.category).filter(Boolean)))];
  const filtered = tutorials.filter(t => {
    const catOk = activeCategory === 'all' || t.category === activeCategory;
    const lvlOk = activeLevel === 'all' || t.level === activeLevel;
    return catOk && lvlOk;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontFamily: 'Inter, system-ui, sans-serif' }}>
      লোড হচ্ছে...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: 'clamp(80px,10vw,120px) 24px 56px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          🎓 Tutorial
        </div>
        <h1 style={{ ...st(s('tutorial_title')), letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 14 }}>
          {s('tutorial_title').value}
        </h1>
        <p style={{ ...st(s('tutorial_subtitle')), lineHeight: 1.7, maxWidth: 460, margin: '0 auto 36px' }}>
          {s('tutorial_subtitle').value}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
          {[{ value: tutorials.length + '+', label: 'টিউটোরিয়াল' }, { value: '100%', label: 'ফ্রি' }, { value: 'বাংলা', label: 'ভাষায়' }].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 100px' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{ background: activeCategory === cat ? '#fff' : '#111', color: activeCategory === cat ? '#000' : '#555', border: `1px solid ${activeCategory === cat ? '#fff' : '#222'}`, padding: '7px 16px', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                {cat === 'all' ? `সব (${tutorials.length})` : cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {['all','beginner','intermediate','advanced'].map(lvl => (
              <button key={lvl} onClick={() => setActiveLvl(lvl)}
                style={{ background: activeLevel === lvl ? (LEVEL[lvl]?.bg || 'rgba(255,255,255,0.1)') : 'transparent', color: activeLevel === lvl ? (LEVEL[lvl]?.color || '#fff') : '#555', border: `1px solid ${activeLevel === lvl ? (LEVEL[lvl]?.color || '#444') : '#1a1a1a'}`, padding: '6px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                {lvl === 'all' ? 'সব লেভেল' : LEVEL[lvl]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid or Empty */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#0d0d0d', borderRadius: 16, border: '1px dashed #1a1a1a' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <p style={{ ...st(s('tutorial_coming')) }}>{s('tutorial_coming').value}</p>
            <p style={{ color: '#444', fontSize: 14, marginTop: 8 }}>Admin Panel থেকে tutorial যোগ করুন।</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map((t, index) => (
              <div key={t.id} onClick={() => setSelected(t)}
                style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.borderColor = '#2a2a2a'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.borderColor = '#1a1a1a'; }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                  {t.thumbnail
                    ? <img src={t.thumbnail} alt={t.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', fontSize: 32 }}>🎓</div>
                  }
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #000', marginLeft: 3 }} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>#{index + 1}</div>
                  {t.duration && <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>⏱ {t.duration}</div>}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {t.level && LEVEL[t.level] && <span style={{ background: LEVEL[t.level].bg, color: LEVEL[t.level].color, fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{LEVEL[t.level].label}</span>}
                    {t.category && <span style={{ background: '#1a1a1a', color: '#666', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{t.category}</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.4 }}>{t.title}</div>
                  {t.description && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1a1a1a' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 4, display: 'flex', gap: 10 }}>
                  {selected.level && LEVEL[selected.level] && <span style={{ color: LEVEL[selected.level].color }}>{LEVEL[selected.level].label}</span>}
                  {selected.category && <span>{selected.category}</span>}
                  {selected.duration && <span>⏱ {selected.duration}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
              <iframe src={selected.youtube_url + '?autoplay=1'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            {selected.description && <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1a', color: '#666', fontSize: 14, lineHeight: 1.6 }}>{selected.description}</div>}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #111', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>Minhajul<span style={{ color: '#3b82f6' }}>.</span></div>
        <p style={{ fontSize: 13, color: '#333' }}>© 2025 Md. Minhajul Hoque. All rights reserved.</p>
      </footer>
    </div>
  );
}