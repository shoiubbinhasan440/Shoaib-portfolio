'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  findHomepageOrderConflict,
  getHomepageConfigForItem,
  getHomepageConfigForVideo,
  getHomepagePortfolioItemKey,
  HOMEPAGE_PORTFOLIO_SETTING_KEYS,
  parseHomepagePortfolioItemConfig,
  serializeHomepagePortfolioItemConfig,
  toPortfolioPreviewItems,
  type PortfolioGraphic,
  type PortfolioPreviewItem,
  type HomepagePortfolioConfigMap,
} from '@/lib/portfolio-content';
import { writeSiteSetting } from '@/lib/site-settings';

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
  order_num: 0,
  visible: true,
  showOnHomepage: true,
  homepageOrder: 0,
  homepageFeatured: false,
};

export default function AdminVideos() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homepageConfig, setHomepageConfig] = useState<HomepagePortfolioConfigMap>({});
  const [homepageItems, setHomepageItems] = useState<PortfolioPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  async function upsertSetting(key: string, value: string) {
    await writeSiteSetting(supabase, key, value);
  }

  async function saveHomepageConfig(nextConfig: HomepagePortfolioConfigMap) {
    await upsertSetting(
      HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig,
      serializeHomepagePortfolioItemConfig(nextConfig)
    );
    setHomepageConfig(nextConfig);
  }

  function getVideoHomepageState(video: Video) {
    return getHomepageConfigForVideo(video, homepageConfig);
  }

  async function getVideoData() {
    const [{ data: vids }, { data: cats }, { data: homepageSettings }, { data: graphicsData }] = await Promise.all([
      supabase.from('videos').select('*').order('order_num', { ascending: true }),
      supabase.from('categories').select('*').order('order_num', { ascending: true }),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig)
        .maybeSingle(),
      supabase.from('graphics').select('*').order('created_at', { ascending: false }),
    ]);

    const graphics = ((graphicsData || []) as Array<Omit<PortfolioGraphic, 'order_num'>>).map(
      (graphic, index) => ({
        ...graphic,
        order_num: 1000 + index,
      })
    );

    return {
      videos: vids || [],
      categories: cats || [],
      homepageConfig: parseHomepagePortfolioItemConfig(homepageSettings?.value),
      homepageItems: toPortfolioPreviewItems((vids || []) as Video[], graphics),
    };
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    async function load() {
      const data = await getVideoData();
      setVideos(data.videos);
      setCategories(data.categories);
      setHomepageConfig(data.homepageConfig);
      setHomepageItems(data.homepageItems);
      setLoading(false);
    }

    void load();
  }, [router]);

  async function refreshData() {
    setLoading(true);
    const data = await getVideoData();
    setVideos(data.videos);
    setCategories(data.categories);
    setHomepageConfig(data.homepageConfig);
    setHomepageItems(data.homepageItems);
    setLoading(false);
  }

  function getHomepageOrderConflictMessage(
    conflictItem: Pick<PortfolioPreviewItem, 'sourceType' | 'title'>,
    attemptedOrder: number
  ) {
    const itemTypeLabel = conflictItem.sourceType === 'video' ? 'ভিডিও' : 'গ্রাফিক';
    return `❌ Homepage order ${attemptedOrder} আগে থেকেই "${conflictItem.title}" (${itemTypeLabel}) ব্যবহার করছে। অন্য order দিন।`;
  }

  function getNextHomepageOrder() {
    const usedOrders = homepageItems
      .filter(item => item.visible)
      .map(item => getHomepageConfigForItem(item, homepageConfig))
      .filter(config => config.showOnHomepage)
      .map(config => config.homepageOrder);

    return usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 1;
  }

  function getYouTubeId(url: string) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function normalizeHomepageOrder(homepageOrder: number) {
    return homepageOrder > 0 ? homepageOrder : getNextHomepageOrder();
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
    try {
      const nextHomepageOrder = normalizeHomepageOrder(form.homepageOrder || form.order_num);
      const homepageConflict = findHomepageOrderConflict(
        homepageItems,
        homepageConfig,
        {
          sourceType: 'video',
          id: String(editingId ?? `new-video-${Date.now()}`),
          order_num: form.order_num,
        },
        nextHomepageOrder,
        form.showOnHomepage
      );

      if (homepageConflict) {
        setMsg(getHomepageOrderConflictMessage(homepageConflict, nextHomepageOrder));
        return;
      }

      const videoId = getYouTubeId(form.youtube_url);
      const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : form.youtube_url;
      const existingVideo = editingId ? videos.find(video => video.id === editingId) : null;

      const payload = {
        title: form.title,
        category: form.category,
        youtube_url: embedUrl,
        thumbnail: form.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        tier: existingVideo?.tier || 'standard',
        order_num: form.order_num,
        visible: form.visible,
      };

      let error;
      let savedVideoId = editingId;
      if (editingId) {
        ({ error } = await supabase.from('videos').update(payload).eq('id', editingId));
      } else {
        const insertResult = await supabase.from('videos').insert([payload]).select('id').single();
        error = insertResult.error;
        savedVideoId = insertResult.data?.id ?? null;
      }

      if (error) {
        setMsg('❌ সমস্যা হয়েছে: ' + error.message);
        return;
      }

      if (savedVideoId) {
        const nextHomepageConfig = {
          ...homepageConfig,
          [getHomepagePortfolioItemKey('video', savedVideoId)]: {
            showOnHomepage: form.showOnHomepage,
            homepageOrder: nextHomepageOrder,
            homepageFeatured: form.homepageFeatured,
          },
        };
        await saveHomepageConfig(nextHomepageConfig);
      }

      setMsg(editingId ? '✅ ভিডিও আপডেট হয়েছে!' : '✅ ভিডিও যোগ হয়েছে!');
      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM, homepageOrder: getNextHomepageOrder() });
      void refreshData();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ভিডিও সেভ করা যায়নি।';
      setMsg(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(v: Video) {
    const homepageState = getVideoHomepageState(v);
    setForm({
      title: v.title,
      category: v.category,
      youtube_url: v.youtube_url,
      thumbnail: v.thumbnail,
      order_num: v.order_num,
      visible: v.visible,
      showOnHomepage: homepageState.showOnHomepage,
      homepageOrder: homepageState.homepageOrder,
      homepageFeatured: homepageState.homepageFeatured,
    });
    setEditingId(v.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: number) {
    if (!confirm('এই ভিডিওটি ডিলিট করবেন?')) return;
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) {
        throw error;
      }

      const nextHomepageConfig = { ...homepageConfig };
      delete nextHomepageConfig[getHomepagePortfolioItemKey('video', id)];
      delete nextHomepageConfig[String(id)];
      await saveHomepageConfig(nextHomepageConfig);
      setMsg('🗑️ ভিডিও ডিলিট হয়েছে।');
      void refreshData();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ভিডিও ডিলিট করা যায়নি।';
      setMsg(`❌ ${message}`);
    }
  }

  async function toggleVisible(v: Video) {
    try {
      const { error } = await supabase.from('videos').update({ visible: !v.visible }).eq('id', v.id);
      if (error) {
        throw error;
      }

      void refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ভিডিও visibility বদলানো যায়নি।';
      setMsg(`❌ ${message}`);
    }
  }

  async function toggleHomepageVisible(video: Video) {
    try {
      const currentHomepageState = getVideoHomepageState(video);
      const nextShowOnHomepage = !currentHomepageState.showOnHomepage;
      const nextHomepageOrder = normalizeHomepageOrder(currentHomepageState.homepageOrder);
      const homepageConflict = findHomepageOrderConflict(
        homepageItems,
        homepageConfig,
        {
          sourceType: 'video',
          id: String(video.id),
          order_num: video.order_num,
        },
        nextHomepageOrder,
        nextShowOnHomepage
      );

      if (homepageConflict) {
        setMsg(getHomepageOrderConflictMessage(homepageConflict, nextHomepageOrder));
        setTimeout(() => setMsg(''), 3000);
        return;
      }

      const nextHomepageConfig = {
        ...homepageConfig,
        [getHomepagePortfolioItemKey('video', video.id)]: {
          ...currentHomepageState,
          showOnHomepage: nextShowOnHomepage,
          homepageOrder: nextHomepageOrder,
        },
      };

      await saveHomepageConfig(nextHomepageConfig);
      setMsg(
        nextShowOnHomepage
          ? '🏠 ভিডিওটি homepage preview-তে দেখানো হবে।'
          : '🙈 ভিডিওটি homepage preview থেকে লুকানো হয়েছে।'
      );
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Homepage visibility আপডেট করা যায়নি।';
      setMsg(`❌ ${message}`);
    }
  }

  async function updateHomepageOrder(video: Video, homepageOrder: number) {
    try {
      const nextHomepageOrder = normalizeHomepageOrder(homepageOrder);
      const currentHomepageState = getVideoHomepageState(video);
      const homepageConflict = findHomepageOrderConflict(
        homepageItems,
        homepageConfig,
        {
          sourceType: 'video',
          id: String(video.id),
          order_num: video.order_num,
        },
        nextHomepageOrder,
        currentHomepageState.showOnHomepage
      );

      if (homepageConflict) {
        setMsg(getHomepageOrderConflictMessage(homepageConflict, nextHomepageOrder));
        void refreshData();
        setTimeout(() => setMsg(''), 3000);
        return;
      }

      const nextHomepageConfig = {
        ...homepageConfig,
        [getHomepagePortfolioItemKey('video', video.id)]: {
          ...currentHomepageState,
          homepageOrder: nextHomepageOrder,
        },
      };

      await saveHomepageConfig(nextHomepageConfig);
      setMsg('↕️ Homepage order আপডেট হয়েছে।');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Homepage order আপডেট করা যায়নি।';
      setMsg(`❌ ${message}`);
    }
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
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ ...EMPTY_FORM, homepageOrder: getNextHomepageOrder() });
          }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  id="showOnHomepage"
                  checked={form.showOnHomepage}
                  onChange={e => setForm(f => ({ ...f, showOnHomepage: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="showOnHomepage" style={{ fontSize: 14, color: '#ccc', cursor: 'pointer' }}>Homepage preview-তে দেখাবে</label>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Homepage order</label>
                <input
                  type="number"
                  min="1"
                  value={form.homepageOrder}
                  onChange={e => setForm(f => ({ ...f, homepageOrder: parseInt(e.target.value, 10) || 0 }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  id="homepageFeatured"
                  checked={form.homepageFeatured}
                  onChange={e => setForm(f => ({ ...f, homepageFeatured: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="homepageFeatured" style={{ fontSize: 14, color: '#ccc', cursor: 'pointer' }}>Homepage-এ featured priority দিন</label>
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
                onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM, homepageOrder: getNextHomepageOrder() }); }}
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
            <p>এখনও কোনো ভিডিও নেই। উপরের &quot;+ নতুন ভিডিও&quot; বাটনে ক্লিক করুন।</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(v => {
              const homepageState = getVideoHomepageState(v);

              return (
              <div key={v.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16, opacity: v.visible ? 1 : 0.5 }}>
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8, border: '1px solid #333', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{v.title}</span>
                    {!v.visible && <span style={{ background: '#1a1a1a', color: '#666', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #333' }}>লুকানো</span>}
                    {homepageState.showOnHomepage && <span style={{ background: '#10233a', color: '#7dd3fc', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #1e3a5f' }}>🏠 Homepage</span>}
                    {homepageState.homepageFeatured && <span style={{ background: '#1b2542', color: '#a5b4fc', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #312e81' }}>✨ Featured</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
                    <span>📁 {categories.find(c => c.slug === v.category)?.name || v.category}</span>
                    <span>🔢 ক্রম: {v.order_num}</span>
                    <span>🏠 Homepage ক্রম: {homepageState.homepageOrder}</span>
                    <span>{homepageState.showOnHomepage ? '👁 Homepage visible' : '🙈 Homepage hidden'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <input
                    key={`${v.id}-${homepageState.homepageOrder}`}
                    type="number"
                    min="1"
                    defaultValue={homepageState.homepageOrder}
                    onBlur={e => void updateHomepageOrder(v, parseInt(e.target.value, 10) || 0)}
                    title="Homepage order"
                    style={{ width: 74, background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}
                  />
                  <button
                    onClick={() => void toggleHomepageVisible(v)}
                    title={homepageState.showOnHomepage ? 'Homepage থেকে লুকান' : 'Homepage-এ দেখান'}
                    style={{ background: '#1a1a1a', color: homepageState.showOnHomepage ? '#7dd3fc' : '#666', border: '1px solid #333', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                    🏠
                  </button>
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
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
