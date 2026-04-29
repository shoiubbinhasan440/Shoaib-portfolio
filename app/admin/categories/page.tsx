'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminShell from '@/components/admin/AdminShell';
import { adminDeleteRows, adminInsertRows, adminUpdateRows } from '@/lib/admin-data-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  order_num: number;
  active: boolean;
}

const EMPTY_FORM = { name: '', slug: '', type: 'video', order_num: 0, active: true };

function toSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

export default function AdminCategories() {
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function getCategories() {
    const { data } = await supabase.from('categories').select('*').order('order_num', { ascending: true });
    return data || [];
  }

  useEffect(() => {
    let active = true;

    async function load() {
      const data = await getCategories();
      setCats(data);
      setLoading(false);
    }

    async function verifyAndLoad() {
      const ok = await verifyAdminSessionClient();
      if (!active) {
        return;
      }
      if (!ok) {
        router.replace('/admin/login');
        return;
      }
      await load();
    }

    void verifyAndLoad();

    return () => {
      active = false;
    };
  }, [router]);

  async function refreshCats() {
    setLoading(true);
    const data = await getCategories();
    setCats(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name || !form.slug) {
      setMsg('❌ নাম এবং slug আবশ্যক।');
      return;
    }
    setSaving(true);
    const payload = { name: form.name, slug: form.slug, type: form.type, order_num: form.order_num, active: form.active };
    try {
      if (editingId) {
        await adminUpdateRows('categories', payload, { id: editingId });
      } else {
        await adminInsertRows('categories', [payload]);
      }
      setMsg(editingId ? '✅ ক্যাটাগরি আপডেট হয়েছে!' : '✅ ক্যাটাগরি যোগ হয়েছে!');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      void refreshCats();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      setMsg('❌ সমস্যা: ' + (error instanceof Error ? error.message : 'Save failed.'));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(c: Category) {
    setForm({ name: c.name, slug: c.slug, type: c.type || 'video', order_num: c.order_num, active: c.active });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: number) {
    if (!confirm('এই ক্যাটাগরিটি ডিলিট করবেন? এর সাথে যুক্ত ভিডিওগুলো প্রভাবিত হবে না।')) return;
    await adminDeleteRows('categories', { id });
    setMsg('🗑️ ক্যাটাগরি ডিলিট হয়েছে।');
    void refreshCats();
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggleActive(c: Category) {
    await adminUpdateRows('categories', { active: !c.active }, { id: c.id });
    void refreshCats();
  }

  return (
    <AdminShell
      eyebrow="Category Manager"
      title="Keep categories clean across videos and graphics"
      description="Manage shared categories from one content manager without losing mobile navigation or burying the tool inside another page."
      actions={
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
          type="button"
          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
        >
          {showForm ? 'Close Form' : '+ New Category'}
        </button>
      }
    >
      <div style={{ maxWidth: 980, display: 'grid', gap: 18 }}>
        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#0f2a1a' : '#2a0f0f', border: '1px solid #333', color: msg.startsWith('✅') ? '#4ade80' : '#f87171', padding: '12px 20px', borderRadius: 10, marginBottom: 24, fontSize: 15 }}>
            {msg}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, color: '#4ade80' }}>
              {editingId ? '✏️ ক্যাটাগরি এডিট করুন' : '➕ নতুন ক্যাটাগরি যোগ করুন'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ক্যাটাগরির নাম *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: toSlug(e.target.value) }))}
                  placeholder="যেমন: Wedding Film"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Slug (URL-এ ব্যবহার হবে) *</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))}
                  placeholder="wedding-film"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#4ade80', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ধরন</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
                  <option value="video">🎬 ভিডিও</option>
                  <option value="graphic">🎨 গ্রাফিক্স</option>
                  <option value="both">🎬🎨 উভয়</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ক্রম নম্বর</label>
                <input
                  type="number"
                  value={form.order_num}
                  onChange={e => setForm(f => ({ ...f, order_num: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" id="active" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <label htmlFor="active" style={{ fontSize: 14, color: '#ccc', cursor: 'pointer' }}>সক্রিয় (পোর্টফোলিওতে দেখাবে)</label>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: saving ? '#333' : '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}>
                {saving ? '⏳ সেভ হচ্ছে...' : editingId ? '✅ আপডেট করুন' : '✅ যোগ করুন'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Default categories hint */}
        {!loading && cats.length === 0 && (
          <div style={{ background: '#111', border: '1px dashed #333', borderRadius: 12, padding: 24, marginBottom: 24, color: '#666', fontSize: 14 }}>
            💡 কিছু পরামর্শ: <strong style={{ color: '#aaa' }}>Wedding Film, Commercial, Music Video, Short Film, Cinematic, Behind the Scene</strong> — এগুলো যোগ করতে পারেন।
          </div>
        )}

        {/* Category List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>লোড হচ্ছে...</div>
        ) : cats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555', background: '#111', borderRadius: 16, border: '1px dashed #222' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <p>এখনও কোনো ক্যাটাগরি নেই।</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {cats.map(c => (
              <div key={c.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', opacity: c.active ? 1 : 0.5 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</span>
                    <span style={{ background: '#1a1a2e', color: '#818cf8', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontFamily: 'monospace' }}>/{c.slug}</span>
                    <span style={{ background: '#1a1a1a', color: '#888', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>
                      {c.type === 'video' ? '🎬' : c.type === 'graphic' ? '🎨' : '🎬🎨'}
                    </span>
                    {!c.active && <span style={{ background: '#2a0f0f', color: '#f87171', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>বন্ধ</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>ক্রম: {c.order_num}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => toggleActive(c)} title={c.active ? 'বন্ধ করুন' : 'চালু করুন'}
                    style={{ background: '#1a1a1a', color: c.active ? '#4ade80' : '#666', border: '1px solid #333', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
                    {c.active ? '✓' : '○'}
                  </button>
                  <button onClick={() => handleEdit(c)}
                    style={{ background: '#1a2a3a', color: '#4da6ff', border: '1px solid #1e3a5f', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ✏️ এডিট
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    style={{ background: '#2a0f0f', color: '#f87171', border: '1px solid #5c1a1a', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
