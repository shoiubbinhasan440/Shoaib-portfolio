'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  created_at?: string;
};

const BLANK = { title: '', category: '', image_url: '', visible: true };

export default function AdminGraphics() {
  const router = useRouter();
  const [graphics, setGraphics] = useState<Graphic[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Graphic | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('all');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: gData, error: gErr } = await supabase
      .from('graphics')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: cData } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (gErr) console.error('Graphics fetch error:', gErr);
    setGraphics(gData || []);
    setCategories(cData || []);
    setLoading(false);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = Date.now() + "." + ext;
    const { error } = await supabase.storage.from("graphics").upload(fileName, file, { upsert: true });
    if (error) { setError("আপলোড হয়নি: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("graphics").getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  }

  function openAdd() {
    setEditItem(null);
    setForm(BLANK);
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Graphic) {
    setEditItem(item);
    setForm({ title: item.title, category: item.category, image_url: item.image_url, visible: item.visible });
    setError('');
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) { setError('টাইটেল দিন'); return; }
    if (!form.image_url.trim()) { setError('ছবির URL দিন'); return; }
    setSaving(true);
    setError('');

    if (editItem) {
      const { error: err } = await supabase
        .from('graphics')
        .update({ title: form.title, category: form.category, image_url: form.image_url, visible: form.visible })
        .eq('id', editItem.id);
      if (err) { setError('আপডেট হয়নি: ' + err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase
        .from('graphics')
        .insert({ title: form.title, category: form.category, image_url: form.image_url, visible: form.visible });
      if (err) { setError('যোগ হয়নি: ' + err.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowForm(false);
    fetchAll();
  }

  async function toggleVisible(item: Graphic) {
    await supabase.from('graphics').update({ visible: !item.visible }).eq('id', item.id);
    fetchAll();
  }

  async function deleteItem(id: string) {
    if (!confirm('এই ডিজাইনটি ডিলিট করবেন?')) return;
    setDeleting(id);
    await supabase.from('graphics').delete().eq('id', id);
    setDeleting(null);
    fetchAll();
  }

  const allCats = ['all', ...Array.from(new Set(graphics.map(g => g.category).filter(Boolean)))];
  const filtered = filterCat === 'all' ? graphics : graphics.filter(g => g.category === filterCat);

  return (
    <div style={{ minHeight: '100vh', background: '#030303', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top Bar */}
      <div style={{ borderBottom: '1px solid #111', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>←</button>
          <span style={{ fontSize: 18 }}>🎨</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>গ্রাফিক্স ম্যানেজার</span>
          <span style={{ background: '#1a1a1a', color: '#555', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>{graphics.length} টি</span>
        </div>
        <button onClick={openAdd}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + নতুন ডিজাইন
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #0f0f0f' }}>
        {allCats.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            style={{
              background: filterCat === cat ? '#3b82f6' : '#111',
              color: filterCat === cat ? '#fff' : '#888',
              border: `1px solid ${filterCat === cat ? '#3b82f6' : '#222'}`,
              padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 500
            }}>
            {cat === 'all' ? `সব (${graphics.length})` : `${cat} (${graphics.filter(g => g.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Graphics List */}
      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#444', padding: 60 }}>লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <div style={{ color: '#444', marginBottom: 20 }}>এখনো কোনো ডিজাইন নেই</div>
            <button onClick={openAdd}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              প্রথম ডিজাইন যোগ করুন
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => (
              <div key={item.id}
                style={{ background: '#0a0a0a', border: '1px solid #111', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                
                {/* Thumbnail */}
                <div style={{ width: 80, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 20 }}>🖼</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: item.visible ? '#fff' : '#555' }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {item.category && (
                      <span style={{ background: '#111', color: '#888', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>📂 {item.category}</span>
                    )}
                    <span style={{ fontSize: 11, color: item.visible ? '#22c55e' : '#555' }}>
                      {item.visible ? '● দৃশ্যমান' : '○ লুকানো'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => toggleVisible(item)}
                    title={item.visible ? 'লুকান' : 'দেখান'}
                    style={{ background: '#111', border: '1px solid #222', color: '#888', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                    {item.visible ? '👁' : '🙈'}
                  </button>
                  <button onClick={() => openEdit(item)}
                    style={{ background: '#1a2a1a', border: '1px solid #2a4a2a', color: '#4ade80', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✏ এডিট
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    disabled={deleting === item.id}
                    style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', color: '#f87171', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {deleting === item.id ? '...' : '🗑 ডিলিট'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editItem ? 'ডিজাইন এডিট' : 'নতুন ডিজাইন যোগ'}</h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {error && (
              <div style={{ background: '#2a1a1a', border: '1px solid #f87171', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>টাইটেল *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="ডিজাইনের নাম"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>ক্যাটাগরি</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="যেমন: Poster Design, Logo, Banner"
                  list="cat-list"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                <datalist id="cat-list">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>ছবি আপলোড বা URL *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <label style={{ background: uploading ? '#1d4ed8' : '#2563eb', color: '#fff', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {uploading ? '⏳ আপলোড...' : '📁 ছবি বেছে নিন'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if(e.target.files?.[0]) uploadImage(e.target.files[0]); }} disabled={uploading} />
                  </label>
                  <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                    placeholder="অথবা সরাসরি URL দিন"
                    style={{ flex: 1, background: '#1a1a1a', border: '1px solid #222', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="preview"
                    style={{ marginTop: 10, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6, border: '1px solid #222' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="visible" checked={form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="visible" style={{ fontSize: 13, color: '#aaa', cursor: 'pointer' }}>দৃশ্যমান রাখুন</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, background: '#1a1a1a', color: '#888', border: '1px solid #222', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                বাতিল
              </button>
              <button onClick={save} disabled={saving}
                style={{ flex: 2, background: saving ? '#1d4ed8' : '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {saving ? 'সেভ হচ্ছে...' : editItem ? '✓ আপডেট করুন' : '+ যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}