'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NavItem {
  id: string;
  label: string;
  href: string;
  order_num: number;
  visible: boolean;
}

const EMPTY: Omit<NavItem, 'id'> = { label: '', href: '', order_num: 0, visible: true };

export default function NavigationEditor() {
  const router = useRouter();
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<NavItem, 'id'>>(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('navigation')
      .select('*')
      .order('order_num', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.label || !form.href) return;
    setSaving(true);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_num)) + 1 : 1;
    await supabase.from('navigation').insert({ ...form, order_num: maxOrder });
    setForm(EMPTY);
    setShowAdd(false);
    await fetchItems();
    setSaving(false);
    flashSaved();
  }

  async function handleUpdate() {
    if (!editingId || !form.label || !form.href) return;
    setSaving(true);
    await supabase.from('navigation').update({ label: form.label, href: form.href, visible: form.visible }).eq('id', editingId);
    setEditingId(null);
    setForm(EMPTY);
    await fetchItems();
    setSaving(false);
    flashSaved();
  }

  async function handleDelete(id: string) {
    setSaving(true);
    await supabase.from('navigation').delete().eq('id', id);
    setDeleteId(null);
    await fetchItems();
    setSaving(false);
  }

  async function toggleVisible(item: NavItem) {
    await supabase.from('navigation').update({ visible: !item.visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, visible: !i.visible } : i));
  }

  async function moveItem(index: number, dir: 'up' | 'down') {
    const newItems = [...items];
    const swapIndex = dir === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    // update order_num for both
    const a = newItems[index];
    const b = newItems[swapIndex];
    setItems(newItems.map((item, i) => ({ ...item, order_num: i + 1 })));
    await supabase.from('navigation').update({ order_num: swapIndex + 1 }).eq('id', a.id);
    await supabase.from('navigation').update({ order_num: index + 1 }).eq('id', b.id);
    flashSaved();
  }

  function startEdit(item: NavItem) {
    setEditingId(item.id);
    setForm({ label: item.label, href: item.href, order_num: item.order_num, visible: item.visible });
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── styles ──
  const S = {
    page:    { minHeight: '100vh', background: '#030303', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px 24px' } as React.CSSProperties,
    card:    { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14 } as React.CSSProperties,
    input:   { width: '100%', background: '#111', border: '1px solid #1a1a1a', color: '#fff', padding: '10px 13px', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
    label:   { display: 'block', fontSize: 12, color: '#555', marginBottom: 6 } as React.CSSProperties,
    btnBlue: { background: '#3b82f6', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 } as React.CSSProperties,
    btnGray: { background: '#1a1a1a', color: '#888', border: '1px solid #222', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
    btnRed:  { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 } as React.CSSProperties,
    btnSm:   { background: '#111', color: '#555', border: '1px solid #1a1a1a', width: 30, height: 30, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/admin/dashboard')}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: '2px 6px' }}>←</button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Navigation Editor</h1>
              <p style={{ fontSize: 12, color: '#444', margin: '3px 0 0' }}>Navbar-এর menu items ম্যানেজ করুন</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>✓ সেভ হয়েছে</span>}
            <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(EMPTY); }}
              style={S.btnBlue}>+ নতুন লিংক</button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ ...S.card, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#aaa', marginBottom: 16 }}>নতুন Menu Item যোগ করুন</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Label (নাম) *</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="যেমন: Portfolio" style={S.input} />
              </div>
              <div>
                <label style={S.label}>URL (লিংক) *</label>
                <input value={form.href} onChange={e => setForm(f => ({ ...f, href: e.target.value }))}
                  placeholder="যেমন: /portfolio" style={S.input} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#888' }}>
                <input type="checkbox" checked={form.visible}
                  onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} />
                দেখানো হবে
              </label>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowAdd(false); setForm(EMPTY); }} style={S.btnGray}>বাতিল</button>
                <button onClick={handleAdd} disabled={saving || !form.label || !form.href} style={{ ...S.btnBlue, opacity: (!form.label || !form.href) ? 0.5 : 1 }}>
                  {saving ? 'যোগ হচ্ছে...' : '✓ যোগ করুন'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview bar */}
        <div style={{ background: '#0a0a0a', border: '1px solid #111', borderRadius: 10, padding: '10px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#333', marginRight: 8, fontWeight: 700, letterSpacing: '0.08em' }}>PREVIEW</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginRight: 16 }}>Minhajul<span style={{ color: '#3b82f6' }}>.</span></span>
          {items.filter(i => i.visible).map(item => (
            <span key={item.id} style={{ fontSize: 13, color: '#666', padding: '2px 10px', background: '#111', borderRadius: 6 }}>
              {item.label}
            </span>
          ))}
          {items.filter(i => i.visible).length === 0 && (
            <span style={{ fontSize: 12, color: '#2a2a2a' }}>কোনো visible item নেই</span>
          )}
        </div>

        {/* Items list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#333' }}>লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div style={{ ...S.card, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <p style={{ color: '#444', fontSize: 14 }}>এখনো কোনো navigation item নেই।<br />উপরের "+ নতুন লিংক" বাটন দিয়ে যোগ করুন।</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, index) => (
              <div key={item.id}>
                {/* Normal row */}
                {editingId !== item.id ? (
                  <div style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, opacity: item.visible ? 1 : 0.45 }}>
                    {/* Order buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => moveItem(index, 'up')} disabled={index === 0}
                        style={{ ...S.btnSm, opacity: index === 0 ? 0.3 : 1, fontSize: 11 }}>▲</button>
                      <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}
                        style={{ ...S.btnSm, opacity: index === items.length - 1 ? 0.3 : 1, fontSize: 11 }}>▼</button>
                    </div>

                    {/* Order badge */}
                    <div style={{ width: 28, height: 28, background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#444', flexShrink: 0 }}>
                      {index + 1}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: item.visible ? '#fff' : '#555' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>{item.href}</div>
                    </div>

                    {/* Visible badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: item.visible ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                      color: item.visible ? '#4ade80' : '#444',
                      border: `1px solid ${item.visible ? 'rgba(34,197,94,0.2)' : '#1a1a1a'}`,
                    }}>
                      {item.visible ? 'দেখানো' : 'লুকানো'}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleVisible(item)}
                        title={item.visible ? 'লুকান' : 'দেখান'}
                        style={{ ...S.btnSm, fontSize: 14 }}>
                        {item.visible ? '👁' : '🙈'}
                      </button>
                      <button onClick={() => startEdit(item)}
                        style={{ background: 'rgba(59,130,246,0.08)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.15)', padding: '6px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        এডিট
                      </button>
                      <button onClick={() => setDeleteId(item.id)} style={S.btnRed}>মুছুন</button>
                    </div>
                  </div>
                ) : (
                  /* Edit row */
                  <div style={{ ...S.card, padding: 18, border: '1px solid rgba(59,130,246,0.3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={S.label}>Label</label>
                        <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={S.input} />
                      </div>
                      <div>
                        <label style={S.label}>URL</label>
                        <input value={form.href} onChange={e => setForm(f => ({ ...f, href: e.target.value }))} style={S.input} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#888' }}>
                        <input type="checkbox" checked={form.visible}
                          onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} />
                        দেখানো হবে
                      </label>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button onClick={cancelEdit} style={S.btnGray}>বাতিল</button>
                        <button onClick={handleUpdate} disabled={saving} style={S.btnBlue}>
                          {saving ? 'সেভ...' : '✓ আপডেট করুন'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <div style={{ marginTop: 20, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#444', lineHeight: 1.6 }}>
          💡 <strong style={{ color: '#555' }}>নোট:</strong> এখানে পরিবর্তন করলে Navbar-এ সাথে সাথে apply হবে যদি Navbar.tsx navigation table থেকে data load করে। ▲▼ দিয়ে order বদলানো যাবে।
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div onClick={() => setDeleteId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>মুছে ফেলবেন?</h3>
            <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>
              "<strong style={{ color: '#aaa' }}>{items.find(i => i.id === deleteId)?.label}</strong>" item টি মুছে যাবে।
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={S.btnGray}>বাতিল</button>
              <button onClick={() => handleDelete(deleteId)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}