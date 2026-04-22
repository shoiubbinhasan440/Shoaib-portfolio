'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type S = { value: string; fontSize: number; fontWeight: string; color: string; fontFamily: string };
type SettingRow = { key: string; value: string };

const DEF: Record<string, S> = {
  about_eyebrow:     { value: 'About Me',           fontSize: 11, fontWeight: '600', color: '#444444', fontFamily: 'Inter, system-ui, sans-serif' },
  about_title:       { value: 'আমি কে?',             fontSize: 56, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  about_bio:         { value: 'আমি একজন পেশাদার ভিডিও এডিটর ও গ্রাফিক্স ডিজাইনার। বিভিন্ন ব্র্যান্ড ও ব্যক্তিত্বের জন্য কাজ করেছি।', fontSize: 16, fontWeight: '400', color: '#666666', fontFamily: 'Inter, system-ui, sans-serif' },
  about_skill_title: { value: 'আমার দক্ষতা',         fontSize: 28, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  about_skill1:      { value: 'Video Editing',       fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  about_skill2:      { value: 'Motion Graphics',     fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  about_skill3:      { value: 'Poster Design',       fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  about_skill4:      { value: 'Logo Design',         fontSize: 14, fontWeight: '600', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
  about_cta:         { value: 'যোগাযোগ করুন',        fontSize: 15, fontWeight: '700', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' },
};

export default function AboutPage() {
  const [settings, setSettings] = useState<Record<string, S>>(DEF);
  const [aboutImage, setAboutImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const saved = localStorage.getItem('about_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: SettingRow) => {
          map[row.key] = row.value;
        });

        if (map['about_image']) {
          setAboutImage(map['about_image']);
        }

        const merged: Record<string, S> = { ...DEF };
        Object.keys(DEF).forEach(key => {
          if (map[key]) {
            try {
              merged[key] = { ...DEF[key], ...JSON.parse(map[key]) };
            } catch {
              merged[key] = { ...DEF[key], value: map[key] };
            }
          }
        });

        setSettings(merged);
      }

      setLoading(false);
    }

    void load();
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('about_theme', next ? 'dark' : 'light');
  }

  const s = (key: string) => settings[key] || DEF[key];

  // theme tokens
  const bg       = dark ? '#080808' : '#f0f4f8';
  const cardBg   = dark ? '#0d0d0d' : '#ffffff';
  const border   = dark ? '#1a1a1a' : '#e2e8f0';
  const textPri  = dark ? '#ffffff' : '#0f172a';
  const textSec  = dark ? '#888888' : '#475569';
  const textMut  = dark ? '#444444' : '#94a3b8';
  const accent   = '#3b82f6';
  const tagBg    = dark ? '#111111' : '#e8f0fe';
  const tagColor = dark ? '#888888' : '#3b5bdb';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMut, fontFamily: 'Inter, system-ui, sans-serif' }}>
      লোড হচ্ছে...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textPri, fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.3s, color 0.3s' }}>

      {/* Floating theme toggle */}
      <button onClick={toggleTheme}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 50,
          width: 48, height: 48, borderRadius: '50%',
          background: dark ? '#1e1e1e' : '#ffffff',
          border: `1px solid ${border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
        }}>
        {dark ? '☀️' : '🌙'}
      </button>

      {/* ── About Hero ── */}
      <section style={{ padding: 'clamp(80px,10vw,120px) clamp(20px,6vw,80px) 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <p style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 40, textAlign: 'center' }}>
            {s('about_eyebrow').value}
          </p>

          {/* Two-column */}
          <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Photo */}
            <div style={{ flexShrink: 0, width: 'clamp(200px, 28vw, 280px)' }}>
              <div style={{
                width: '100%', aspectRatio: '4/5', borderRadius: 20,
                overflow: 'hidden', border: `1px solid ${border}`,
                background: aboutImage
                  ? `url(${aboutImage}) center/cover no-repeat`
                  : (dark ? '#111' : '#e2e8f0'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.1)',
              }}>
                {!aboutImage && <span style={{ fontSize: 64 }}>👨‍🎨</span>}
              </div>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 240, paddingTop: 8 }}>
              <h1 style={{
                fontSize: `clamp(30px, 5vw, ${s('about_title').fontSize}px)`,
                fontWeight: s('about_title').fontWeight,
                fontFamily: s('about_title').fontFamily,
                color: textPri, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 10,
              }}>
                {s('about_title').value}
              </h1>

              <p style={{ color: accent, fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
                Video Editor &amp; Graphic Designer
              </p>

              <p style={{
                fontSize: s('about_bio').fontSize,
                fontWeight: s('about_bio').fontWeight,
                fontFamily: s('about_bio').fontFamily,
                color: textSec, lineHeight: 1.85, marginBottom: 32,
              }}>
                {s('about_bio').value}
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 28, marginBottom: 32, flexWrap: 'wrap' }}>
                {[['5+','বছরের অভিজ্ঞতা'],['100+','প্রজেক্ট'],['50+','ক্লায়েন্ট']].map(([v,l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: accent }}>{v}</div>
                    <div style={{ fontSize: 12, color: textMut, marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/contact" style={{
                  display: 'inline-block', padding: '11px 26px',
                  background: accent, color: '#fff',
                  borderRadius: 8, fontWeight: 700, fontSize: 14,
                  textDecoration: 'none',
                }}>
                  {s('about_cta').value} →
                </Link>
                <Link href="/portfolio" style={{
                  display: 'inline-block', padding: '11px 26px',
                  background: 'transparent', border: `1px solid ${border}`,
                  color: textSec, borderRadius: 8, fontWeight: 600, fontSize: 14,
                  textDecoration: 'none',
                }}>
                  কাজ দেখুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section style={{ background: dark ? 'rgba(255,255,255,0.02)' : '#e8edf2', padding: '60px clamp(20px,6vw,80px)', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: s('about_skill_title').fontSize, fontWeight: s('about_skill_title').fontWeight, color: textPri, marginBottom: 24 }}>
            {s('about_skill_title').value}
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['about_skill1','about_skill2','about_skill3','about_skill4'].map(key => (
              <span key={key} style={{
                fontSize: s(key).fontSize, fontWeight: s(key).fontWeight,
                color: tagColor, background: tagBg,
                border: `1px solid ${border}`,
                padding: '9px 20px', borderRadius: 8, transition: 'all 0.3s',
              }}>
                {s(key).value}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section style={{ padding: '60px clamp(20px,6vw,80px)', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>টুলস</p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: textPri, marginBottom: 24 }}>যে সফটওয়্যার ব্যবহার করি</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {['Adobe Premiere Pro','After Effects','Photoshop','Illustrator','DaVinci Resolve','Canva','Figma','CapCut'].map(tool => (
              <span key={tool} style={{
                padding: '8px 18px', background: cardBg,
                border: `1px solid ${border}`, borderRadius: 100,
                fontSize: 13, color: textSec, transition: 'all 0.3s',
              }}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '56px clamp(20px,6vw,80px) 80px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          background: dark ? 'linear-gradient(135deg,#0f172a,#1e1b4b)' : 'linear-gradient(135deg,#dbeafe,#ede9fe)',
          border: `1px solid ${dark ? '#1e3a8a' : '#bfdbfe'}`,
          borderRadius: 20, padding: '48px 32px',
        }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: textPri, marginBottom: 10 }}>
            কাজ করতে <span style={{ color: accent }}>আগ্রহী?</span>
          </h2>
          <p style={{ color: textSec, marginBottom: 24, fontSize: 15 }}>আপনার প্রজেক্ট নিয়ে আলোচনা করতে যোগাযোগ করুন</p>
          <Link href="/contact" style={{
            display: 'inline-block', padding: '12px 28px',
            background: accent, color: '#fff',
            borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15,
          }}>
            যোগাযোগ করুন →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${dark ? '#111' : '#e2e8f0'}`, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: textPri }}>
          Minhajul<span style={{ color: accent }}>.</span>
        </div>
        <p style={{ fontSize: 13, color: dark ? '#333' : '#94a3b8' }}>© 2025 Md. Minhajul Hoque. All rights reserved.</p>
      </footer>
    </div>
  );
}
