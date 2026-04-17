'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Video {
  id: number;
  title: string;
  category: string;
  youtube_url: string;
  thumbnail: string;
  tier: string;
  visible: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  active: boolean;
}

export default function PortfolioPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'graphic'>('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: vids }, { data: cats }] = await Promise.all([
      supabase.from('videos').select('*').eq('visible', true).order('order_num', { ascending: true }),
      supabase.from('categories').select('*').eq('active', true).order('order_num', { ascending: true }),
    ]);
    setVideos(vids || []);
    setCategories(cats || []);
    setLoading(false);
  }

  function handleTabChange(tab: 'all' | 'video' | 'graphic') {
    setActiveTab(tab);
    setActiveCategory('all');
  }

  const visibleCategories = categories.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'video') return c.type === 'video' || c.type === 'both';
    if (activeTab === 'graphic') return c.type === 'graphic' || c.type === 'both';
    return true;
  });

  const filtered = videos.filter(v => {
    const catSlugs = visibleCategories.map(c => c.slug);
    const inTab = activeTab === 'all' ? true : catSlugs.includes(v.category);
    const inCat = activeCategory === 'all' || v.category === activeCategory;
    return inTab && inCat;
  });

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <div style={{ textAlign: 'center', padding: '72px 24px 48px' }}>
        <div style={{ display: 'inline-block', background: '#1a1a2e', color: '#818cf8', fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Portfolio
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px', lineHeight: 1.1 }}>
          আমার কাজের সংগ্রহ
        </h1>
        <p style={{ color: '#555', fontSize: 15, maxWidth: 440, margin: '0 auto' }}>
          প্রতিটি প্রজেক্ট একটি গল্প বলে — এখানে আমার সেরা কাজগুলো।
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Main Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
          {[
            { value: 'all', label: '✦ সব কাজ' },
            { value: 'video', label: '🎬 Video Editing' },
            { value: 'graphic', label: '🎨 Graphics' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as 'all' | 'video' | 'graphic')}
              style={{
                background: activeTab === tab.value ? '#fff' : '#111',
                color: activeTab === tab.value ? '#000' : '#666',
                border: `1px solid ${activeTab === tab.value ? '#fff' : '#222'}`,
                padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        {visibleCategories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            <button onClick={() => setActiveCategory('all')}
              style={{
                background: activeCategory === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeCategory === 'all' ? '#fff' : '#555',
                border: `1px solid ${activeCategory === 'all' ? '#444' : '#1a1a1a'}`,
                padding: '6px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
              }}>
              সব ({filtered.length})
            </button>
            {visibleCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.slug)}
                style={{
                  background: activeCategory === cat.slug ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeCategory === cat.slug ? '#fff' : '#555',
                  border: `1px solid ${activeCategory === cat.slug ? '#444' : '#1a1a1a'}`,
                  padding: '6px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
                }}>
                {cat.name} ({videos.filter(v => v.category === cat.slug).length})
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#333' }}>লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#333' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <p>এই বিভাগে এখনও কোনো কাজ নেই।</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
            {filtered.map(video => (
              <div key={video.id} onClick={() => setSelectedVideo(video)}
                style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: '#111', border: '1px solid #1a1a1a', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1a1a1a';
                }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0d0d0d' }}>
                  <img src={video.thumbnail} alt={video.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Play icon */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '0'}>
                    <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '15px solid #000', marginLeft: 3 }} />
                    </div>
                  </div>
                  {/* Category badge */}
                  <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.75)', color: '#aaa', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>
                    {categories.find(c => c.slug === video.category)?.name || video.category}
                  </div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {video.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div onClick={() => setSelectedVideo(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 900, background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1a1a1a' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedVideo.title}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
                  {categories.find(c => c.slug === selectedVideo.category)?.name || selectedVideo.category}
                </div>
              </div>
              <button onClick={() => setSelectedVideo(null)}
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                ✕
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
              <iframe
                src={selectedVideo.youtube_url + '?autoplay=1'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}