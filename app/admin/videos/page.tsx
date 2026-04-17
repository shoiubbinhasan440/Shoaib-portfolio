'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  order_num: number;
  visible: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const EMPTY_FORM = {
  title: '',
  category: '',
  youtube_url: '',
  thumbnail: '',
  tier: 'standard',
  order_num: 0,
  visible: true,
};

export default function AdminVideos() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: vids }, { data: cats }] = await Promise.all([
      supabase.from('videos').select('*').order('order_num', { ascending: true }),
      supabase.from('categories').select('*').order('order_num', { ascending: true }),
    ]);
    setVideos(vids || []);
    setCategories(cats || []);
    setLoading(false);
  }

  function getYouTubeId(url: string) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function handleYouTubeUrl(url: string) {
    const id = getYouTubeId(url);
    const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
    setForm(f => ({
      ...f,
      youtube_url: url,
      thumbnail: thumb,
    }));
  }

  async function handleSave() {
    if (!form.title || !form.category || !form.youtube_url) {
      setMsg('❌ টাইটেল, ক্যাটাগরি এবং YouTube URL আবশ্যক।');
      return;
    }
    setSaving(true);
    const videoId = getYouTubeId(form.youtube_url);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : form.youtube_url;

    const payload = {
      title: form.title,
      category: form.category,
      youtube_url: embedUrl,
      thumbnail: form.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      tier: form.tier,
      order_num: form.order_num,
      visible: form.visible,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('videos').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('videos').insert([payload]));
    }

    setSaving(false);
    if (error) {
      setMsg('❌ সমস্যা হয়েছে: ' + error.message);
    } else {
      setMsg(editingId ? '✅ ভিডিও আপডেট হয়েছে!' : '✅ ভিডিও যোগ হয়েছে!');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    }
  }

  function handleEdit(v: Video) {
    setForm({
      title: v.title,
      category: v.category,
      youtube_url: v.youtube_url,
      thumbnail: v.thumbnail,
      tier: v.tier,
      order_num: v.order_num,
      visible: v.visible,
    });
    setEditingId(v.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: number) {
    if (!confirm('এই ভিডিওটি ডিলিট করবেন?')) return;
    await supabase.from('videos').delete().eq('id', id);
    setMsg('🗑️ ভিডিও ডিলিট হয়েছে।');
    fetchData();
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggleVisible(v: Video) {
    await supabase.from('videos').update({ visible: !v.visible }).eq('id', v.id);
    fetchData();
  }

  const filtered = filterCat === 'all' ? videos : videos.filter(v => v.category === filterCat);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            ← ড্যাশবোর্ড
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🎬 ভিডিও ম্যানেজার</h1>
          <span style={{ background: '#1a3a5c', color: '#4da6ff', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
            {videos.length}টি ভিডিও
          </span>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          {showForm ? '✕ বন্ধ করুন' : '+ নতুন ভিডিও'}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Message */}
        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#0f2a1a' : msg.startsWith('🗑️') ? '#1a1a2e' : '#2a0f0f', border: `1px solid ${msg.startsWith('✅') ? '#1a5c33' : '#444'}`, color: msg.startsWith('✅') ? '#4ade80' : '#f87171', padding: '12px 20px', borderRadius: 10, marginBottom: 24, fontSize: 15 }}>
            {msg}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, color: '#4da6ff' }}>
              {editingId ? '✏️ ভিডিও এডিট করুন' : '➕ নতুন ভিডিও যোগ করুন'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ভিডিও টাইটেল *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="যেমন: Wedding Highlight 2024"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ক্যাটাগরি *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: form.category ? '#fff' : '#555', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  <option value="">-- ক্যাটাগরি বেছে নিন --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>YouTube URL *</label>
                <input
                  value={form.youtube_url}
                  onChange={e => handleYouTubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>URL দিলে থাম্বনেইল অটো সেট হয়ে যাবে।</p>
              </div>
              {form.thumbnail && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>থাম্বনেইল প্রিভিউ</label>
                  <img src={form.thumbnail} alt="thumb" style={{ height: 120, borderRadius: 8, border: '1px solid #333' }} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>টায়ার</label>
                <select
                  value={form.tier}
                  onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium ⭐</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ক্রম নম্বর (ছোট মানে আগে)</label>
                <input
                  type="number"
                  value={form.order_num}
                  onChange={e => setForm(f => ({ ...f, order_num: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  id="visible"
                  checked={form.visible}
                  onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="visible" style={{ fontSize: 14, color: '#ccc', cursor: 'pointer' }}>পোর্টফোলিওতে দেখাবে</label>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: saving ? '#333' : '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}>
                {saving ? '⏳ সেভ হচ্ছে...' : editingId ? '✅ আপডেট করুন' : '✅ ভিডিও যোগ করুন'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterCat('all')}
            style={{ background: filterCat === 'all' ? '#2563eb' : '#1a1a1a', color: filterCat === 'all' ? '#fff' : '#aaa', border: '1px solid #333', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>
            সব ({videos.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.slug)}
              style={{ background: filterCat === c.slug ? '#2563eb' : '#1a1a1a', color: filterCat === c.slug ? '#fff' : '#aaa', border: '1px solid #333', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>
              {c.name} ({videos.filter(v => v.category === c.slug).length})
            </button>
          ))}
        </div>

        {/* Video List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555', background: '#111', borderRadius: 16, border: '1px dashed #222' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <p>এখনও কোনো ভিডিও নেই। উপরের "+ নতুন ভিডিও" বাটনে ক্লিক করুন।</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(v => (
              <div key={v.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16, opacity: v.visible ? 1 : 0.5 }}>
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8, border: '1px solid #333', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{v.title}</span>
                    {v.tier === 'premium' && <span style={{ background: '#2a1f00', color: '#fbbf24', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #3d2e00' }}>⭐ Premium</span>}
                    {!v.visible && <span style={{ background: '#1a1a1a', color: '#666', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #333' }}>লুকানো</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#666' }}>
                    <span>📁 {categories.find(c => c.slug === v.category)?.name || v.category}</span>
                    <span>🔢 ক্রম: {v.order_num}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleVisible(v)}
                    title={v.visible ? 'লুকিয়ে রাখুন' : 'দেখান'}
                    style={{ background: '#1a1a1a', color: v.visible ? '#4ade80' : '#666', border: '1px solid #333', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                    {v.visible ? '👁️' : '🙈'}
                  </button>
                  <button
                    onClick={() => handleEdit(v)}
                    style={{ background: '#1a2a3a', color: '#4da6ff', border: '1px solid #1e3a5f', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ✏️ এডিট
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    style={{ background: '#2a0f0f', color: '#f87171', border: '1px solid #5c1a1a', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🗑️ ডিলিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}