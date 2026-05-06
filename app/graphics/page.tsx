'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Graphic = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  visible: boolean;
};

export default function GraphicsPage() {
  const [graphics, setGraphics] = useState<Graphic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('সব');
  const [selected, setSelected] = useState<Graphic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('graphics')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false });

      if (data) {
        setGraphics(data);
        const cats = Array.from(new Set(data.map((graphic: Graphic) => graphic.category).filter(Boolean)));
        setCategories(cats);
      }

      setLoading(false);
    }

    void load();
  }, []);

  const filtered = activeCategory === 'সব'
    ? graphics
    : graphics.filter(g => g.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 22, textDecoration: 'none' }}>
          <span style={{ color: '#fff' }}>Minhajul</span>
          <span style={{ color: '#3b82f6' }}>.</span>
        </Link>
        <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
          {[
            { label: 'Home', href: '/' },
            { label: 'Portfolio', href: '/portfolio' },
            { label: 'Tutorial', href: '/tutorial' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#555'}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link href="/portfolio" style={{ background: '#3b82f6', color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
          Visit Portfolio →
        </Link>
      </nav>

      {/* Header */}
      <div style={{ paddingTop: 120, paddingBottom: 48, textAlign: 'center', padding: '120px 24px 48px' }}>
        <div style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
          Creative Work
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 16px' }}>
          Graphics Design
        </h1>
        <p style={{ fontSize: 15, color: '#555', maxWidth: 440, margin: '0 auto' }}>
          Poster, Logo, Banner — সব ধরনের গ্রাফিক্স ডিজাইনের সংগ্রহ
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px 48px' }}>
        {['সব', ...categories].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? '#fff' : 'transparent',
              color: activeCategory === cat ? '#000' : '#555',
              border: activeCategory === cat ? '1px solid #fff' : '1px solid #1e1e1e',
              padding: '8px 20px', borderRadius: 100,
              fontSize: 13, fontWeight: activeCategory === cat ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (activeCategory !== cat) (e.currentTarget as HTMLButtonElement).style.borderColor = '#444'; }}
            onMouseLeave={e => { if (activeCategory !== cat) (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1e1e'; }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Graphics Grid */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 24px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#333', padding: '80px 0', fontSize: 14 }}>লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#333', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎨</div>
            <div style={{ fontSize: 14 }}>এখনো কোনো গ্রাফিক্স যোগ করা হয়নি</div>
            <div style={{ fontSize: 12, color: '#222', marginTop: 8 }}>Admin Panel থেকে ছবি যোগ করুন</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((item) => (
              <div key={item.id}
                onClick={() => setSelected(item)}
                style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: '#0d0d0d', border: '1px solid #111',
                  cursor: 'pointer', transition: 'all 0.25s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#222';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#111';
                }}>
                {/* Image */}
                <div style={{ paddingBottom: '75%', position: 'relative', background: '#111', overflow: 'hidden' }}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                      onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', fontSize: 32 }}>🖼️</div>
                  )}
                  {/* Hover overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.45)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)'}>
                    <div style={{
                      width: 44, height: 44, background: 'rgba(255,255,255,0.9)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, opacity: 0, transition: 'opacity 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0'}>
                      🔍
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#e5e5e5' }}>{item.title || 'Md Minhajul Hoque Project'}</div>
                  <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 500 }}>{item.category || 'Graphics'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{ maxWidth: 900, width: '100%', position: 'relative' }}>

            {/* Close */}
            <button onClick={() => setSelected(null)}
              style={{
                position: 'absolute', top: -44, right: 0,
                background: '#111', border: '1px solid #222',
                color: '#888', width: 36, height: 36, borderRadius: 8,
                cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>

            {/* Image */}
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.title}
                style={{ width: '100%', borderRadius: 16, display: 'block', maxHeight: '80vh', objectFit: 'contain' }} />
            )}

            {/* Caption */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.title}</div>
                <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 4 }}>{selected.category}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Prev */}
                <button
                  onClick={() => {
                    const idx = filtered.findIndex(g => g.id === selected.id);
                    if (idx > 0) setSelected(filtered[idx - 1]);
                  }}
                  style={{ background: '#111', border: '1px solid #222', color: '#fff', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                  ←
                </button>
                {/* Next */}
                <button
                  onClick={() => {
                    const idx = filtered.findIndex(g => g.id === selected.id);
                    if (idx < filtered.length - 1) setSelected(filtered[idx + 1]);
                  }}
                  style={{ background: '#111', border: '1px solid #222', color: '#fff', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
