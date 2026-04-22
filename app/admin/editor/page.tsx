'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getHeroImageUpdates, getStoredHeroImages, toSettingMap } from '@/lib/hero-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Block = {
  key: string;
  label: string;
  value: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  fontFamily: string;
  section: string;
  page: string;
};

type SettingRow = {
  key: string;
  value: string;
};

const FONT_FAMILIES = [
  { label: 'Inter (Default)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'Raleway', value: "'Raleway', sans-serif" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
];

const FONT_WEIGHTS = [
  { label: '300', value: '300' },
  { label: '400', value: '400' },
  { label: '500', value: '500' },
  { label: '600', value: '600' },
  { label: '700', value: '700' },
  { label: '800', value: '800' },
];

const PAGES = [
  { key: 'home', label: '🏠 Home', href: '/' },
  { key: 'portfolio', label: '🎬 Portfolio', href: '/portfolio' },
  { key: 'about', label: '👤 About', href: '/about' },
  { key: 'contact', label: '📬 Contact', href: '/contact' },
  { key: 'tutorial', label: '📚 Tutorial', href: '/tutorial' },
];

const ALL_BLOCKS: Block[] = [
  // ── HOME ──
  { key: 'nav_brand', label: 'Brand Name', value: 'Minhajul', fontSize: 22, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Navbar', page: 'home' },
  { key: 'hero_badge', label: 'Hero Badge', value: 'Available for work', fontSize: 11, fontWeight: '700', color: '#93c5fd', fontFamily: 'Inter, system-ui, sans-serif', section: 'Hero', page: 'home' },
  { key: 'hero_title', label: 'Hero Title', value: 'Visual Storyteller & Creative Director', fontSize: 68, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Hero', page: 'home' },
  { key: 'hero_subtitle', label: 'Hero Subtitle', value: 'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।', fontSize: 16, fontWeight: '400', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif', section: 'Hero', page: 'home' },
  { key: 'cta_button', label: 'CTA Button', value: 'Portfolio দেখুন', fontSize: 15, fontWeight: '700', color: '#000000', fontFamily: 'Inter, system-ui, sans-serif', section: 'Hero', page: 'home' },
  { key: 'hero_badge2_text', label: 'Projects Badge', value: 'Projects Done', fontSize: 11, fontWeight: '400', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Hero', page: 'home' },
  { key: 'stat1_label', label: 'Stat 1 Label', value: 'প্রজেক্ট সম্পন্ন', fontSize: 13, fontWeight: '400', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Stats', page: 'home' },
  { key: 'stat2_label', label: 'Stat 2 Label', value: 'সন্তুষ্ট ক্লায়েন্ট', fontSize: 13, fontWeight: '400', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Stats', page: 'home' },
  { key: 'stat3_label', label: 'Stat 3 Label', value: 'বছরের অভিজ্ঞতা', fontSize: 13, fontWeight: '400', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Stats', page: 'home' },
  { key: 'showreel_eyebrow', label: 'Showreel Eyebrow', value: 'Featured Work', fontSize: 11, fontWeight: '600', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Showreel', page: 'home' },
  { key: 'showreel_title', label: 'Showreel Title', value: 'আমার Showreel', fontSize: 42, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Showreel', page: 'home' },
  { key: 'portfolio_eyebrow', label: 'Portfolio Eyebrow', value: 'Portfolio', fontSize: 11, fontWeight: '600', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Portfolio Section', page: 'home' },
  { key: 'portfolio_recent', label: 'Portfolio Title', value: 'সাম্প্রতিক কাজ', fontSize: 38, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Portfolio Section', page: 'home' },
  { key: 'cta_subtitle', label: 'CTA Subtitle', value: 'Video Editing থেকে Graphics Design — সব কাজ একসাথে।', fontSize: 16, fontWeight: '400', color: '#475569', fontFamily: 'Inter, system-ui, sans-serif', section: 'CTA', page: 'home' },
  { key: 'footer_copy', label: 'Footer Copyright', value: '© 2025 Md. Minhajul Hoque. All rights reserved.', fontSize: 13, fontWeight: '400', color: '#2a2a2a', fontFamily: 'Inter, system-ui, sans-serif', section: 'Footer', page: 'home' },

  // ── ABOUT ──
  { key: 'about_eyebrow', label: 'About Eyebrow', value: 'About Me', fontSize: 11, fontWeight: '600', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'about' },
  { key: 'about_title', label: 'About Title', value: 'আমি কে?', fontSize: 56, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'about' },
  { key: 'about_bio', label: 'Bio Text', value: 'আমি একজন পেশাদার ভিডিও এডিটর ও গ্রাফিক্স ডিজাইনার। বিভিন্ন ব্র্যান্ড ও ব্যক্তিত্বের জন্য কাজ করেছি।', fontSize: 16, fontWeight: '400', color: '#666666', fontFamily: 'Inter, system-ui, sans-serif', section: 'Bio', page: 'about' },
  { key: 'about_skill_title', label: 'Skills Title', value: 'আমার দক্ষতা', fontSize: 28, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Skills', page: 'about' },
  { key: 'about_skill1', label: 'Skill 1', value: 'Video Editing', fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Skills', page: 'about' },
  { key: 'about_skill2', label: 'Skill 2', value: 'Motion Graphics', fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Skills', page: 'about' },
  { key: 'about_skill3', label: 'Skill 3', value: 'Poster Design', fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Skills', page: 'about' },
  { key: 'about_skill4', label: 'Skill 4', value: 'Logo Design', fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Skills', page: 'about' },
  { key: 'about_cta', label: 'About CTA Button', value: 'যোগাযোগ করুন', fontSize: 15, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'CTA', page: 'about' },

  // ── CONTACT ──
  { key: 'contact_eyebrow', label: 'Contact Eyebrow', value: 'Get In Touch', fontSize: 11, fontWeight: '600', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'contact' },
  { key: 'contact_title', label: 'Contact Title', value: 'যোগাযোগ করুন', fontSize: 56, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'contact' },
  { key: 'contact_subtitle', label: 'Contact Subtitle', value: 'কোনো প্রজেক্ট মাথায় আছে? আলাপ করুন।', fontSize: 16, fontWeight: '400', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'contact' },
  { key: 'contact_email_label', label: 'Email Label', value: 'ইমেইল', fontSize: 12, fontWeight: '600', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif', section: 'Info', page: 'contact' },
  { key: 'contact_email', label: 'Email Address', value: 'sayeedfahad@gmail.com', fontSize: 15, fontWeight: '500', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Info', page: 'contact' },
  { key: 'contact_phone_label', label: 'Phone Label', value: 'ফোন', fontSize: 12, fontWeight: '600', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif', section: 'Info', page: 'contact' },
  { key: 'contact_phone', label: 'Phone Number', value: '+880 1700-000000', fontSize: 15, fontWeight: '500', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Info', page: 'contact' },
  { key: 'contact_form_title', label: 'Form Title', value: 'মেসেজ পাঠান', fontSize: 22, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Form', page: 'contact' },
  { key: 'contact_btn', label: 'Submit Button', value: 'পাঠান', fontSize: 15, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Form', page: 'contact' },

  // ── PORTFOLIO ──
  { key: 'portfolio_page_title', label: 'Page Title', value: 'Portfolio', fontSize: 56, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'portfolio' },
  { key: 'portfolio_page_subtitle', label: 'Page Subtitle', value: 'Video Editing ও Graphics Design-এর সংগ্রহ', fontSize: 15, fontWeight: '400', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'portfolio' },
  { key: 'portfolio_tab_video', label: 'Video Tab', value: 'Video Editing', fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Tabs', page: 'portfolio' },
  { key: 'portfolio_tab_graphics', label: 'Graphics Tab', value: 'Graphics', fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Tabs', page: 'portfolio' },

  // ── TUTORIAL ──
  { key: 'tutorial_title', label: 'Tutorial Title', value: 'Tutorial', fontSize: 56, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'tutorial' },
  { key: 'tutorial_subtitle', label: 'Tutorial Subtitle', value: 'ভিডিও এডিটিং শিখুন ধাপে ধাপে', fontSize: 16, fontWeight: '400', color: '#555555', fontFamily: 'Inter, system-ui, sans-serif', section: 'Header', page: 'tutorial' },
  { key: 'tutorial_coming', label: 'Coming Soon Text', value: 'শীঘ্রই আসছে...', fontSize: 24, fontWeight: '700', color: '#3b82f6', fontFamily: 'Inter, system-ui, sans-serif', section: 'Content', page: 'tutorial' },
];

export default function VisualEditor() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(ALL_BLOCKS);
  const [selected, setSelected] = useState<Block | null>(null);
  const [activePage, setActivePage] = useState('home');
  const [activeSection, setActiveSection] = useState('Hero');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  const [desktopHeroImage, setDesktopHeroImage] = useState('');
  const [mobileHeroImage, setMobileHeroImage] = useState('');
  const [aboutImage, setAboutImage] = useState('');

  async function upsertSetting(key: string, value: string) {
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value }).eq('key', key);
      return;
    }

    await supabase.from('site_settings').insert({ key, value });
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const map = toSettingMap(data as SettingRow[]);
        const heroImages = getStoredHeroImages(map);
        setDesktopHeroImage(heroImages.desktop);
        setMobileHeroImage(heroImages.mobile);
        if (map['about_image']) setAboutImage(map['about_image']);
        setBlocks(prev => prev.map(b => {
          const raw = map[b.key];
          if (!raw) return b;
          try { return { ...b, ...JSON.parse(raw) }; }
          catch { return { ...b, value: raw }; }
        }));
      }
      setLoading(false);
    }

    void load();
  }, []);

  async function saveAll() {
    setSaving(true);
    for (const b of blocks) {
      const val = JSON.stringify({ value: b.value, fontSize: b.fontSize, fontWeight: b.fontWeight, color: b.color, fontFamily: b.fontFamily });
      await upsertSetting(b.key, val);
    }
    for (const update of getHeroImageUpdates(desktopHeroImage, mobileHeroImage)) {
      await upsertSetting(update.key, update.value);
    }
    await upsertSetting('about_image', aboutImage);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function updateBlock(key: string, patch: Partial<Block>) {
    setBlocks(prev => prev.map(b => b.key === key ? { ...b, ...patch } : b));
    if (selected?.key === key) setSelected(prev => prev ? { ...prev, ...patch } : prev);
  }

  const b = (key: string) => blocks.find(x => x.key === key) || ALL_BLOCKS.find(x => x.key === key)!;
  const sel = (key: string) => {
    const block = blocks.find(x => x.key === key)!;
    setSelected(block);
  };

  const bs = (key: string, extra?: React.CSSProperties): React.CSSProperties => {
    const blk = b(key);
    return { fontSize: blk.fontSize, fontWeight: blk.fontWeight, color: blk.color, fontFamily: blk.fontFamily, cursor: 'pointer', outline: selected?.key === key ? '2px solid #3b82f6' : '2px solid transparent', outlineOffset: 3, borderRadius: 3, transition: 'outline 0.1s', ...extra };
  };

  const pageBlocks = blocks.filter(b => b.page === activePage);
  const sections = Array.from(new Set(pageBlocks.map(b => b.section)));
  const sectionBlocks = pageBlocks.filter(b => b.section === activeSection);

  if (loading) return <div style={{ minHeight: '100vh', background: '#030303', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>লোড হচ্ছে...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#030303', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: 52, borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', flexShrink: 0, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, padding: '4px 6px' }}>←</button>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#ddd' }}>Visual Editor</span>
          <span style={{ background: '#1a1a1a', color: '#3b82f6', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>BETA</span>
        </div>

        {/* Page switcher */}
        <div style={{ display: 'flex', background: '#0d0d0d', borderRadius: 8, padding: 3, gap: 2, border: '1px solid #111' }}>
          {PAGES.map(p => (
            <button key={p.key} onClick={() => { setActivePage(p.key); setSelected(null); setActiveSection(blocks.find(b => b.page === p.key)?.section || ''); }}
              style={{ background: activePage === p.key ? '#1e1e1e' : 'transparent', color: activePage === p.key ? '#fff' : '#444', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: activePage === p.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Desktop/Mobile toggle */}
          <div style={{ display: 'flex', background: '#111', borderRadius: 7, padding: 2, gap: 1 }}>
            {(['desktop', 'mobile'] as const).map(m => (
              <button key={m} onClick={() => setPreviewMode(m)}
                style={{ background: previewMode === m ? '#222' : 'transparent', border: 'none', color: previewMode === m ? '#fff' : '#444', padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>
                {m === 'desktop' ? '🖥' : '📱'}
              </button>
            ))}
          </div>
          <a href={PAGES.find(p => p.key === activePage)?.href} target="_blank"
            style={{ background: '#111', color: '#555', border: '1px solid #1a1a1a', padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 500, textDecoration: 'none' }}>
            লাইভ ↗
          </a>
          <button onClick={saveAll}
            style={{ background: saving ? '#1d4ed8' : saved ? '#15803d' : '#3b82f6', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'সেভ...' : saved ? '✓ সেভ' : '💾 সেভ করুন'}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: 260, borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Section tabs */}
          <div style={{ padding: '10px 10px 0', borderBottom: '1px solid #0a0a0a' }}>
            <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>SECTION</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 10 }}>
              {sections.map(s => (
                <button key={s} onClick={() => setActiveSection(s)}
                  style={{ background: activeSection === s ? '#3b82f6' : '#111', color: activeSection === s ? '#fff' : '#444', border: '1px solid', borderColor: activeSection === s ? '#3b82f6' : '#1a1a1a', padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Element list */}
          <div style={{ padding: '8px 10px 0', borderBottom: '1px solid #0a0a0a', maxHeight: 160, overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>ELEMENTS</div>
            {sectionBlocks.map(blk => (
              <button key={blk.key} onClick={() => setSelected(blk)}
                style={{ display: 'block', width: '100%', background: selected?.key === blk.key ? 'rgba(59,130,246,0.08)' : 'transparent', border: '1px solid', borderColor: selected?.key === blk.key ? 'rgba(59,130,246,0.25)' : 'transparent', padding: '6px 8px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', marginBottom: 3 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: selected?.key === blk.key ? '#93c5fd' : '#777' }}>{blk.label}</div>
                <div style={{ fontSize: 10, color: '#2a2a2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{blk.value}</div>
              </button>
            ))}
            <div style={{ height: 8 }} />
          </div>

          {/* Properties */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.1em' }}>PROPERTIES</div>

                {/* Text */}
                <div>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>টেক্সট</div>
                  <textarea value={selected.value} onChange={e => updateBlock(selected.key, { value: e.target.value })} rows={2}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: '7px 9px', color: '#fff', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Font */}
                <div>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>ফন্ট</div>
                  <select value={selected.fontFamily} onChange={e => updateBlock(selected.key, { fontFamily: e.target.value })}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: '7px 9px', color: '#fff', fontSize: 11, outline: 'none' }}>
                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>

                {/* Size */}
                <div>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>সাইজ</span><span style={{ color: '#3b82f6', fontWeight: 700 }}>{selected.fontSize}px</span>
                  </div>
                  <input type="range" min="9" max="100" step="1" value={selected.fontSize}
                    onChange={e => updateBlock(selected.key, { fontSize: parseInt(e.target.value) })} style={{ width: '100%' }} />
                </div>

                {/* Weight */}
                <div>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>ওজন</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {FONT_WEIGHTS.map(w => (
                      <button key={w.value} onClick={() => updateBlock(selected.key, { fontWeight: w.value })}
                        style={{ background: selected.fontWeight === w.value ? '#3b82f6' : '#111', color: selected.fontWeight === w.value ? '#fff' : '#444', border: '1px solid', borderColor: selected.fontWeight === w.value ? '#3b82f6' : '#1a1a1a', padding: '3px 7px', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: parseInt(w.value) }}>
                        {w.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>রঙ</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <input type="color" value={selected.color} onChange={e => updateBlock(selected.key, { color: e.target.value })}
                      style={{ width: 36, height: 32, border: '1px solid #1a1a1a', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                    <input type="text" value={selected.color} onChange={e => updateBlock(selected.key, { color: e.target.value })}
                      style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'monospace' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['#ffffff', '#000000', '#3b82f6', '#93c5fd', '#555', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#475569'].map(c => (
                      <button key={c} onClick={() => updateBlock(selected.key, { color: c })}
                        style={{ width: 20, height: 20, background: c, border: selected.color === c ? '2px solid #fff' : '1px solid #222', borderRadius: 3, cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                {/* Mini preview */}
                <div style={{ background: '#080808', border: '1px solid #111', borderRadius: 7, padding: '10px' }}>
                  <div style={{ fontSize: 9, color: '#2a2a2a', marginBottom: 6, fontWeight: 700 }}>PREVIEW</div>
                  <div style={{ fontSize: Math.min(selected.fontSize, 24), fontWeight: selected.fontWeight, color: selected.color, fontFamily: selected.fontFamily, lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {selected.value}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#222', paddingTop: 24, fontSize: 12 }}>
                উপরের list থেকে<br />element বেছে নিন
              </div>
            )}
          </div>

          {/* Image URLs */}
          {activePage === 'home' && (
            <div style={{ borderTop: '1px solid #0a0a0a', padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>DESKTOP HERO</div>
              <input value={desktopHeroImage} onChange={e => setDesktopHeroImage(e.target.value)} placeholder="https://i.imgur.com/desktop-hero.jpg"
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: '7px 9px', color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>MOBILE HERO</div>
              <input value={mobileHeroImage} onChange={e => setMobileHeroImage(e.target.value)} placeholder="https://i.imgur.com/mobile-hero.jpg"
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: '7px 9px', color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          {activePage === 'about' && (
            <div style={{ borderTop: '1px solid #0a0a0a', padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: '#2a2a2a', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>ABOUT IMAGE</div>
              <input value={aboutImage} onChange={e => setAboutImage(e.target.value)} placeholder="https://i.imgur.com/..."
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, padding: '7px 9px', color: '#fff', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
        </div>

        {/* ── PREVIEW AREA ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#111', display: 'flex', justifyContent: 'center', alignItems: previewMode === 'mobile' ? 'flex-start' : 'stretch', padding: previewMode === 'mobile' ? '20px' : '0' }}>
          <div style={{ width: previewMode === 'mobile' ? 390 : '100%', background: '#080808', minHeight: '100%', borderRadius: previewMode === 'mobile' ? 24 : 0, overflow: 'hidden', boxShadow: previewMode === 'mobile' ? '0 0 0 1px #222' : 'none' }}>

            {/* Edit bar */}
            <div style={{ background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid rgba(59,130,246,0.12)', padding: '5px 14px', fontSize: 10, color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, background: '#3b82f6', borderRadius: '50%' }} />
              EDIT MODE — {PAGES.find(p => p.key === activePage)?.label} পেজ
            </div>

            {/* Shared Navbar */}
            <div style={{ background: 'rgba(8,8,8,0.95)', borderBottom: '1px solid #0f0f0f', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span onClick={() => sel('nav_brand')} style={bs('nav_brand')}>
                {b('nav_brand').value}<span style={{ color: '#3b82f6' }}>.</span>
              </span>
              {previewMode === 'desktop' && (
                <div style={{ display: 'flex', gap: 22, fontSize: 13, color: '#555', alignItems: 'center' }}>
                  <span style={{ color: activePage === 'home' ? '#fff' : '#555' }}>Home</span>
                  <span style={{ color: activePage === 'portfolio' ? '#fff' : '#555' }}>Portfolio</span>
                  <span style={{ color: activePage === 'tutorial' ? '#fff' : '#555' }}>Tutorial</span>
                  <span style={{ color: activePage === 'about' ? '#fff' : '#555' }}>About</span>
                  <span style={{ color: activePage === 'contact' ? '#fff' : '#555' }}>Contact</span>
                  <span style={{ background: '#3b82f6', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Visit Portfolio →</span>
                </div>
              )}
            </div>

            {/* ══ HOME PAGE ══ */}
            {activePage === 'home' && (
              <div>
                <div style={{
                  minHeight: previewMode === 'mobile' ? 720 : 560,
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#020617',
                }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: (previewMode === 'mobile'
                        ? (mobileHeroImage || desktopHeroImage)
                        : (desktopHeroImage || mobileHeroImage))
                        ? `url(${previewMode === 'mobile' ? (mobileHeroImage || desktopHeroImage) : (desktopHeroImage || mobileHeroImage)}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #020617, #0f172a 55%, #1d4ed8)',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: previewMode === 'mobile'
                      ? 'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(2,6,23,0.6) 58%, rgba(2,6,23,0.96) 100%)'
                      : 'linear-gradient(90deg, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.72) 38%, rgba(15,23,42,0.22) 76%, rgba(2,6,23,0.7) 100%)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 75% 28%, rgba(59,130,246,0.26), transparent 32%), radial-gradient(circle at 12% 18%, rgba(14,165,233,0.14), transparent 26%)',
                  }} />
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    minHeight: previewMode === 'mobile' ? 720 : 560,
                    display: 'grid',
                    gridTemplateColumns: previewMode === 'mobile' ? '1fr' : 'minmax(0, 500px) minmax(0, 1fr)',
                    alignItems: previewMode === 'mobile' ? 'end' : 'center',
                    padding: previewMode === 'mobile' ? '36px 18px 22px' : '56px 48px',
                  }}>
                    <div style={{
                      maxWidth: 500,
                      padding: previewMode === 'mobile' ? '24px 20px 20px' : '30px 28px 26px',
                      borderRadius: previewMode === 'mobile' ? 24 : 28,
                      border: '1px solid rgba(148,163,184,0.2)',
                      background: 'linear-gradient(180deg, rgba(2,6,23,0.62) 0%, rgba(2,6,23,0.82) 100%)',
                      boxShadow: '0 24px 90px rgba(2,6,23,0.28)',
                      backdropFilter: 'blur(18px)',
                    }}>
                      <div onClick={() => sel('hero_badge')} style={{ ...bs('hero_badge'), display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(15,23,42,0.56)', border: '1px solid rgba(148,163,184,0.22)', padding: '6px 14px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                        <span style={{ width: 6, height: 6, background: '#38bdf8', borderRadius: '50%' }} />
                        {b('hero_badge').value}
                      </div>
                      <div onClick={() => sel('hero_title')} style={{ ...bs('hero_title'), lineHeight: 1.02, letterSpacing: '-2px', display: 'block', marginBottom: 16 }}>
                        {b('hero_title').value}
                      </div>
                      <div onClick={() => sel('hero_subtitle')} style={{ ...bs('hero_subtitle'), lineHeight: 1.8, display: 'block', maxWidth: 420, marginBottom: 24 }}>
                        {b('hero_subtitle').value}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                        <div onClick={() => sel('cta_button')} style={{ ...bs('cta_button'), background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', padding: '12px 22px', borderRadius: 12, color: '#fff', boxShadow: '0 16px 36px rgba(37,99,235,0.35)' }}>
                          {b('cta_button').value} →
                        </div>
                        <div style={{ border: '1px solid rgba(148,163,184,0.26)', color: '#f8fafc', padding: '12px 18px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(2,6,23,0.28)' }}>▶ Showreel</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                          { value: '120+', label: 'Projects' },
                          { value: '50+', label: 'Clients' },
                          { value: '3+', label: 'Years' },
                        ].map(item => (
                          <div key={item.label} style={{ minWidth: 92, padding: '10px 12px', borderRadius: 14, background: 'rgba(15,23,42,0.52)', border: '1px solid rgba(148,163,184,0.18)' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 3 }}>{item.value}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Stats */}
                <div style={{ margin: '0 32px 44px', background: '#0d0d0d', border: '1px solid #111', borderRadius: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', overflow: 'hidden' }}>
                  {[['stat1_label','0+'],['stat2_label','50+'],['stat3_label','3+']].map(([k,v],i) => (
                    <div key={k} style={{ padding: '28px 12px', textAlign: 'center', borderRight: i<2 ? '1px solid #111' : 'none' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 5 }}>{v}</div>
                      <div onClick={() => sel(k)} style={bs(k)}>{b(k).value}</div>
                    </div>
                  ))}
                </div>
                {/* Showreel */}
                <div style={{ margin: '0 32px 44px', textAlign: 'center' }}>
                  <div onClick={() => sel('showreel_eyebrow')} style={{ ...bs('showreel_eyebrow'), display: 'block', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{b('showreel_eyebrow').value}</div>
                  <div onClick={() => sel('showreel_title')} style={{ ...bs('showreel_title'), display: 'block', letterSpacing: '-1px', marginBottom: 20 }}>{b('showreel_title').value}</div>
                  <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, paddingBottom: '44%', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontSize: 12 }}>▶ Showreel</div>
                  </div>
                </div>
                {/* Portfolio section */}
                <div style={{ margin: '0 32px 44px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div onClick={() => sel('portfolio_eyebrow')} style={{ ...bs('portfolio_eyebrow'), display: 'block', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{b('portfolio_eyebrow').value}</div>
                      <div onClick={() => sel('portfolio_recent')} style={{ ...bs('portfolio_recent'), display: 'block', letterSpacing: '-0.5px' }}>{b('portfolio_recent').value}</div>
                    </div>
                    <span style={{ color: '#3b82f6', fontSize: 12 }}>সব দেখুন →</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[1,2,3].map(i => <div key={i} style={{ background: '#0d0d0d', border: '1px solid #111', borderRadius: 8, paddingBottom: '55%', position: 'relative' }}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontSize: 10 }}>Video {i}</div></div>)}
                  </div>
                </div>
                {/* CTA */}
                <div style={{ margin: '0 32px 44px', background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', border: '1px solid #1e3a8a', borderRadius: 16, padding: '40px 28px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>0+ প্রজেক্ট</div>
                  <div onClick={() => sel('cta_subtitle')} style={{ ...bs('cta_subtitle'), display: 'block', lineHeight: 1.6, marginBottom: 20 }}>{b('cta_subtitle').value}</div>
                  <div style={{ background: '#3b82f6', color: '#fff', display: 'inline-block', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Portfolio দেখুন →</div>
                </div>
                {/* Footer */}
                <div style={{ borderTop: '1px solid #0f0f0f', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Minhajul<span style={{ color: '#3b82f6' }}>.</span></div>
                  <div onClick={() => sel('footer_copy')} style={bs('footer_copy')}>{b('footer_copy').value}</div>
                </div>
              </div>
            )}

            {/* ══ ABOUT PAGE ══ */}
            {activePage === 'about' && (
              <div style={{ padding: previewMode === 'mobile' ? '48px 20px' : '60px 48px' }}>
                <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: previewMode === 'mobile' ? 'wrap' : 'nowrap', marginBottom: 48 }}>
                  {/* Image */}
                  <div style={{ width: 280, height: 340, flexShrink: 0, borderRadius: 16, overflow: 'hidden', background: aboutImage ? `url(${aboutImage}) center/cover` : '#0d0d0d', border: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!aboutImage && <div style={{ color: '#1a2a3a', fontSize: 11, textAlign: 'center' }}>About Image<br />(বাম থেকে URL দিন)</div>}
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div onClick={() => sel('about_eyebrow')} style={{ ...bs('about_eyebrow'), display: 'block', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{b('about_eyebrow').value}</div>
                    <div onClick={() => sel('about_title')} style={{ ...bs('about_title'), display: 'block', letterSpacing: '-1.5px', marginBottom: 20 }}>{b('about_title').value}</div>
                    <div onClick={() => sel('about_bio')} style={{ ...bs('about_bio'), display: 'block', lineHeight: 1.8, marginBottom: 28 }}>{b('about_bio').value}</div>
                    <div onClick={() => sel('about_cta')} style={{ ...bs('about_cta'), background: '#3b82f6', display: 'inline-block', padding: '10px 22px', borderRadius: 8 }}>{b('about_cta').value}</div>
                  </div>
                </div>
                {/* Skills */}
                <div style={{ background: '#0d0d0d', border: '1px solid #111', borderRadius: 14, padding: '28px' }}>
                  <div onClick={() => sel('about_skill_title')} style={{ ...bs('about_skill_title'), display: 'block', marginBottom: 20 }}>{b('about_skill_title').value}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['about_skill1','about_skill2','about_skill3','about_skill4'].map(k => (
                      <div key={k} onClick={() => sel(k)} style={{ ...bs(k), background: '#111', border: '1px solid #1a1a1a', padding: '8px 16px', borderRadius: 8 }}>{b(k).value}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ CONTACT PAGE ══ */}
            {activePage === 'contact' && (
              <div style={{ padding: previewMode === 'mobile' ? '48px 20px' : '60px 48px' }}>
                <div style={{ marginBottom: 40 }}>
                  <div onClick={() => sel('contact_eyebrow')} style={{ ...bs('contact_eyebrow'), display: 'block', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{b('contact_eyebrow').value}</div>
                  <div onClick={() => sel('contact_title')} style={{ ...bs('contact_title'), display: 'block', letterSpacing: '-1.5px', marginBottom: 14 }}>{b('contact_title').value}</div>
                  <div onClick={() => sel('contact_subtitle')} style={{ ...bs('contact_subtitle'), display: 'block', lineHeight: 1.7 }}>{b('contact_subtitle').value}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: previewMode === 'mobile' ? '1fr' : '1fr 1fr', gap: 24 }}>
                  {/* Contact info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[['contact_email_label','contact_email','✉'],['contact_phone_label','contact_phone','📞']].map(([lk,vk,icon]) => (
                      <div key={lk} style={{ background: '#0d0d0d', border: '1px solid #111', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, background: 'rgba(59,130,246,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
                        <div>
                          <div onClick={() => sel(lk)} style={{ ...bs(lk), display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{b(lk).value}</div>
                          <div onClick={() => sel(vk)} style={bs(vk)}>{b(vk).value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Form */}
                  <div style={{ background: '#0d0d0d', border: '1px solid #111', borderRadius: 14, padding: '22px' }}>
                    <div onClick={() => sel('contact_form_title')} style={{ ...bs('contact_form_title'), display: 'block', marginBottom: 16 }}>{b('contact_form_title').value}</div>
                    {['নাম', 'ইমেইল', 'বিষয়'].map(ph => (
                      <div key={ph} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 7, padding: '9px 12px', marginBottom: 10, fontSize: 13, color: '#333' }}>{ph}...</div>
                    ))}
                    <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 7, padding: '9px 12px', marginBottom: 14, fontSize: 13, color: '#333', height: 64 }}>মেসেজ...</div>
                    <div onClick={() => sel('contact_btn')} style={{ ...bs('contact_btn'), background: '#3b82f6', display: 'block', padding: '10px 0', borderRadius: 8, textAlign: 'center' }}>{b('contact_btn').value} →</div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ PORTFOLIO PAGE ══ */}
            {activePage === 'portfolio' && (
              <div style={{ padding: previewMode === 'mobile' ? '48px 20px' : '60px 48px' }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                  <div onClick={() => sel('portfolio_page_title')} style={{ ...bs('portfolio_page_title'), display: 'block', letterSpacing: '-1.5px', marginBottom: 12 }}>{b('portfolio_page_title').value}</div>
                  <div onClick={() => sel('portfolio_page_subtitle')} style={{ ...bs('portfolio_page_subtitle'), display: 'block' }}>{b('portfolio_page_subtitle').value}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
                  {['portfolio_tab_video','portfolio_tab_graphics'].map((k,i) => (
                    <div key={k} onClick={() => sel(k)} style={{ ...bs(k), background: i===0 ? '#fff' : 'transparent', color: i===0 ? '#000' : b(k).color, border: i===0 ? '1px solid #fff' : '1px solid #222', padding: '8px 20px', borderRadius: 100 }}>{b(k).value}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[1,2,3,4,5,6].map(i => <div key={i} style={{ background: '#0d0d0d', border: '1px solid #111', borderRadius: 10, paddingBottom: '56%', position: 'relative' }}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontSize: 10 }}>Video {i}</div></div>)}
                </div>
              </div>
            )}

            {/* ══ TUTORIAL PAGE ══ */}
            {activePage === 'tutorial' && (
              <div style={{ padding: previewMode === 'mobile' ? '48px 20px' : '60px 48px', textAlign: 'center' }}>
                <div onClick={() => sel('tutorial_title')} style={{ ...bs('tutorial_title'), display: 'block', letterSpacing: '-1.5px', marginBottom: 14 }}>{b('tutorial_title').value}</div>
                <div onClick={() => sel('tutorial_subtitle')} style={{ ...bs('tutorial_subtitle'), display: 'block', marginBottom: 48 }}>{b('tutorial_subtitle').value}</div>
                <div style={{ background: '#0d0d0d', border: '1px solid #111', borderRadius: 16, padding: '60px 24px' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
                  <div onClick={() => sel('tutorial_coming')} style={bs('tutorial_coming')}>{b('tutorial_coming').value}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
