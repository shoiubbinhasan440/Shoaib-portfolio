'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type NavItem = {
  id: string;
  label: string;
  href: string;
  order_num: number;
  visible: boolean;
};

const EMPTY_FORM = {
  label: '',
  href: '',
  order_num: 0,
  visible: true,
};

const DEFAULT_PREVIEW_ITEMS = [
  { label: 'Home', href: '/', order_num: 0, visible: true },
  { label: 'Portfolio', href: '/portfolio', order_num: 1, visible: true },
  { label: 'Tutorial', href: '/tutorial', order_num: 2, visible: true },
  { label: 'About', href: '/about', order_num: 3, visible: true },
  { label: 'Contact', href: '/contact', order_num: 4, visible: true },
];

function getIcon(href: string): string {
  if (href === '/') return '🏠';
  if (href.includes('portfolio')) return '🎬';
  if (href.includes('tutorial')) return '🎓';
  if (href.includes('about')) return '👤';
  if (href.includes('contact')) return '✉️';
  if (href.includes('graphic')) return '🎨';
  return '🔗';
}

export default function AdminNavigationPage() {
  const router = useRouter();
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function getNavigationItems() {
    const { data } = await supabase
      .from('navigation')
      .select('*')
      .order('order_num', { ascending: true });

    return data || [];
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    async function load() {
      const data = await getNavigationItems();
      setItems(data);
      setLoading(false);
    }

    void load();
  }, [router]);

  async function refreshItems() {
    setLoading(true);
    const data = await getNavigationItems();
    setItems(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.label.trim() || !form.href.trim()) {
      setMsg('❌ Label এবং URL দুইটাই লাগবে।');
      return;
    }

    setSaving(true);

    const payload = {
      label: form.label.trim(),
      href: form.href.trim(),
      order_num: form.order_num,
      visible: form.visible,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('navigation').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('navigation').insert([payload]));
    }

    setSaving(false);

    if (error) {
      setMsg(`❌ সমস্যা হয়েছে: ${error.message}`);
      return;
    }

    setMsg(editingId ? '✅ মেনু আইটেম আপডেট হয়েছে!' : '✅ নতুন মেনু আইটেম যোগ হয়েছে!');
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    void refreshItems();
    setTimeout(() => setMsg(''), 3000);
  }

  function handleEdit(item: NavItem) {
    setForm({
      label: item.label,
      href: item.href,
      order_num: item.order_num,
      visible: item.visible,
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('এই নেভিগেশন আইটেমটি ডিলিট করবেন?')) {
      return;
    }

    await supabase.from('navigation').delete().eq('id', id);
    setMsg('🗑️ মেনু আইটেম ডিলিট হয়েছে।');
    void refreshItems();
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggleVisible(item: NavItem) {
    await supabase
      .from('navigation')
      .update({ visible: !item.visible })
      .eq('id', item.id);
    void refreshItems();
  }

  const previewItems = (items.length > 0 ? items : DEFAULT_PREVIEW_ITEMS)
    .filter(item => item.visible)
    .sort((a, b) => a.order_num - b.order_num);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            ← ড্যাশবোর্ড
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🧭 নেভিগেশন ম্যানেজার</h1>
          <span style={{ background: '#1a1a2e', color: '#818cf8', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
            {items.length}টি আইটেম
          </span>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          {showForm ? '✕ বন্ধ করুন' : '+ নতুন মেনু আইটেম'}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#0f2a1a' : msg.startsWith('🗑️') ? '#1a1a2e' : '#2a0f0f', border: '1px solid #333', color: msg.startsWith('✅') ? '#4ade80' : msg.startsWith('🗑️') ? '#a5b4fc' : '#f87171', padding: '12px 20px', borderRadius: 10, marginBottom: 24, fontSize: 15 }}>
            {msg}
          </div>
        )}

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>লাইভ প্রিভিউ</div>
          <div style={{ background: 'rgba(10, 10, 20, 0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Minhajul<span style={{ color: '#818cf8' }}>.</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', color: '#bbb', fontSize: 13 }}>
              {previewItems.map(item => (
                <span key={`${item.href}-${item.label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>{getIcon(item.href)}</span>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {showForm && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, color: '#4da6ff' }}>
              {editingId ? '✏️ মেনু আইটেম এডিট করুন' : '➕ নতুন মেনু আইটেম যোগ করুন'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>লেবেল *</label>
                <input
                  value={form.label}
                  onChange={e => setForm(current => ({ ...current, label: e.target.value }))}
                  placeholder="যেমন: Portfolio"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>URL / Path *</label>
                <input
                  value={form.href}
                  onChange={e => setForm(current => ({ ...current, href: e.target.value }))}
                  placeholder="/portfolio"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ক্রম নম্বর</label>
                <input
                  type="number"
                  value={form.order_num}
                  onChange={e => setForm(current => ({ ...current, order_num: parseInt(e.target.value, 10) || 0 }))}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  id="nav-visible"
                  checked={form.visible}
                  onChange={e => setForm(current => ({ ...current, visible: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="nav-visible" style={{ fontSize: 14, color: '#ccc', cursor: 'pointer' }}>দৃশ্যমান রাখুন</label>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: saving ? '#333' : '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}
              >
                {saving ? '⏳ সেভ হচ্ছে...' : editingId ? '✅ আপডেট করুন' : '✅ যোগ করুন'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
                style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555', background: '#111', borderRadius: 16, border: '1px dashed #222' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
            <p>এখনও কোনো নেভিগেশন আইটেম নেই। ডিফল্ট প্রিভিউ দেখানো হচ্ছে।</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16, opacity: item.visible ? 1 : 0.55 }}>
                <div style={{ width: 44, height: 44, background: '#1a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {getIcon(item.href)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{item.label}</span>
                    {!item.visible && <span style={{ background: '#1a1a1a', color: '#666', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #333' }}>লুকানো</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
                    <span>{item.href}</span>
                    <span>ক্রম: {item.order_num}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleVisible(item)}
                    title={item.visible ? 'লুকান' : 'দেখান'}
                    style={{ background: '#1a1a1a', color: item.visible ? '#4ade80' : '#666', border: '1px solid #333', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}
                  >
                    {item.visible ? '👁️' : '🙈'}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{ background: '#1a2a3a', color: '#4da6ff', border: '1px solid #1e3a5f', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    ✏️ এডিট
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ background: '#2a0f0f', color: '#f87171', border: '1px solid #5c1a1a', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
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
