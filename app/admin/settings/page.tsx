'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  HERO_SETTING_KEYS,
  getHeroImageUpdates,
  getStoredHeroImages,
  parseStyledSetting,
  serializeStyledSetting,
  toSettingMap,
  type SettingMap,
} from '@/lib/hero-settings';
import {
  getHomepagePortfolioSettings,
  HOMEPAGE_PORTFOLIO_SETTING_KEYS,
} from '@/lib/portfolio-content';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminSettings() {
  const router = useRouter();
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<Record<string, string>>({
    hero_badge: 'Available for work',
    hero_title: 'Visual Storyteller & Creative Director',
    hero_subtitle: 'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।',
    desktopHeroImage: '',
    mobileHeroImage: '',
    showreel_url: '',
    stat_clients: '50',
    stat_years: '3',
    homepagePortfolioEnabled: 'true',
    homepagePortfolioBadge: 'Featured Work',
    homepagePortfolioTitle: 'সাম্প্রতিক কাজ',
    homepagePortfolioSubtitle: 'Main portfolio archive থেকে homepage-এর জন্য বাছাই করা কিছু কাজ।',
    homepagePortfolioItemLimit: '6',
    homepagePortfolioButtonText: 'সব Portfolio দেখুন',
    homepagePortfolioButtonLink: '/portfolio',
  });
  const [rawSettings, setRawSettings] = useState<SettingMap>({});

  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadSettings() {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) {
      throw error;
    }

    if (data) {
      const map = toSettingMap(data);
      const { desktop, mobile } = getStoredHeroImages(map);
      const badge = parseStyledSetting(map[HERO_SETTING_KEYS.badge], 'Available for work');
      const title = parseStyledSetting(map[HERO_SETTING_KEYS.title], 'Visual Storyteller & Creative Director');
      const subtitle = parseStyledSetting(
        map[HERO_SETTING_KEYS.subtitle],
        'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।'
      );
      const homepagePortfolio = getHomepagePortfolioSettings(map);

      setRawSettings(map);
      setSettings(current => ({
        ...current,
        hero_badge: badge.value,
        hero_title: title.value,
        hero_subtitle: subtitle.value,
        desktopHeroImage: desktop,
        mobileHeroImage: mobile,
        showreel_url: map[HERO_SETTING_KEYS.showreelUrl] || current.showreel_url,
        stat_clients: map[HERO_SETTING_KEYS.statClients] || current.stat_clients,
        stat_years: map[HERO_SETTING_KEYS.statYears] || current.stat_years,
        homepagePortfolioEnabled: String(homepagePortfolio.enabled),
        homepagePortfolioBadge: homepagePortfolio.badge,
        homepagePortfolioTitle: homepagePortfolio.title,
        homepagePortfolioSubtitle: homepagePortfolio.subtitle,
        homepagePortfolioItemLimit: String(homepagePortfolio.itemLimit),
        homepagePortfolioButtonText: homepagePortfolio.buttonText,
        homepagePortfolioButtonLink: homepagePortfolio.buttonLink,
      }));
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    async function load() {
      try {
        await loadSettings();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Settings load করা যায়নি।';
        setMsg(`❌ ${message}`);
      }
    }

    void load();
  }, [router]);

  async function upsert(key: string, value: string) {
    await writeSiteSetting(supabase, key, value);
  }

  async function handleSaveText() {
    setSaving(true);
    try {
      await Promise.all([
        upsert(
          HERO_SETTING_KEYS.badge,
          serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.badge], settings.hero_badge)
        ),
        upsert(
          HERO_SETTING_KEYS.title,
          serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.title], settings.hero_title)
        ),
        upsert(
          HERO_SETTING_KEYS.subtitle,
          serializeStyledSetting(rawSettings[HERO_SETTING_KEYS.subtitle], settings.hero_subtitle)
        ),
        upsert(HERO_SETTING_KEYS.showreelUrl, settings.showreel_url),
        upsert(HERO_SETTING_KEYS.statClients, settings.stat_clients),
        upsert(HERO_SETTING_KEYS.statYears, settings.stat_years),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.enabled, settings.homepagePortfolioEnabled),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.badge, settings.homepagePortfolioBadge),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.title, settings.homepagePortfolioTitle),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.subtitle, settings.homepagePortfolioSubtitle),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemLimit, settings.homepagePortfolioItemLimit),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.buttonText, settings.homepagePortfolioButtonText),
        upsert(HOMEPAGE_PORTFOLIO_SETTING_KEYS.buttonLink, settings.homepagePortfolioButtonLink),
        upsert(
          HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyBadge,
          serializeStyledSetting(
            rawSettings[HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyBadge],
            settings.homepagePortfolioBadge
          )
        ),
        upsert(
          HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyTitle,
          serializeStyledSetting(
            rawSettings[HOMEPAGE_PORTFOLIO_SETTING_KEYS.legacyTitle],
            settings.homepagePortfolioTitle
          )
        ),
      ]);

      await loadSettings();
      setMsg('✅ সেটিংস সেভ হয়েছে!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Settings save করা যায়নি।';
      setMsg(`❌ ${message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  async function handleImageUpload(file: File, type: 'desktop' | 'mobile') {
    setUploading(type);
    const ext = file.name.split('.').pop();
    const path = `hero/${type}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
    if (error) {
      setMsg('❌ আপলোড ব্যর্থ: ' + error.message);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const url = urlData.publicUrl;
    const key = type === 'desktop' ? HERO_SETTING_KEYS.desktopImage : HERO_SETTING_KEYS.mobileImage;
    const nextDesktopImage = type === 'desktop' ? url : settings.desktopHeroImage;
    const nextMobileImage = type === 'mobile' ? url : settings.mobileHeroImage;
    const updates = getHeroImageUpdates(nextDesktopImage, nextMobileImage);

    await Promise.all(updates.map(update => upsert(update.key, update.value)));
    setSettings(s => ({ ...s, [key]: url }));
    setRawSettings(current => ({
      ...current,
      ...Object.fromEntries(updates.map(update => [update.key, update.value])),
    }));
    setUploading(null);
    setMsg(`✅ ${type === 'desktop' ? 'Desktop' : 'Mobile'} ছবি আপলোড হয়েছে!`);
    setTimeout(() => setMsg(''), 3000);
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #333',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/admin/dashboard')}
          style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          ← ড্যাশবোর্ড
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚙️ সাইট সেটিংস</h1>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#0f2a1a' : '#2a0f0f', color: msg.startsWith('✅') ? '#4ade80' : '#f87171', border: '1px solid #333', padding: '12px 20px', borderRadius: 10, marginBottom: 24 }}>
            {msg}
          </div>
        )}

        {/* Hero Image Upload */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#4da6ff' }}>🖼️ Hero Section ছবি</h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 24px' }}>Desktop-এর জন্য cinematic landscape image আর Mobile-এর জন্য vertical portrait image ব্যবহার করুন। কোনো একটা না থাকলে অন্যটা fallback হিসেবে চলবে।</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Desktop Image */}
            <div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 12, fontWeight: 600 }}>
                🖥️ Desktop ছবি <span style={{ color: '#555', fontWeight: 400 }}>(16:9, min 1280×720)</span>
              </div>
              {settings.desktopHeroImage ? (
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <img src={settings.desktopHeroImage} alt="desktop hero"
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #333' }} />
                  <button
                    onClick={async () => {
                      const updates = getHeroImageUpdates('', settings.mobileHeroImage);
                      await Promise.all(updates.map(update => upsert(update.key, update.value)));
                      setSettings(s => ({ ...s, desktopHeroImage: '' }));
                      setRawSettings(current => ({
                        ...current,
                        ...Object.fromEntries(updates.map(update => [update.key, update.value])),
                      }));
                    }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: '#f87171', border: '1px solid #5c1a1a', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => desktopRef.current?.click()}
                  style={{ height: 140, border: '2px dashed #333', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#4da6ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#333'}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13, color: '#555' }}>ক্লিক করে আপলোড করুন</div>
                </div>
              )}
              <input ref={desktopRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'desktop')} />
              <button
                onClick={() => desktopRef.current?.click()}
                disabled={uploading === 'desktop'}
                style={{ width: '100%', background: uploading === 'desktop' ? '#1a1a1a' : '#1a2a3a', color: uploading === 'desktop' ? '#555' : '#4da6ff', border: '1px solid #1e3a5f', padding: '10px', borderRadius: 8, cursor: uploading === 'desktop' ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {uploading === 'desktop' ? '⏳ আপলোড হচ্ছে...' : '📤 Desktop ছবি আপলোড'}
              </button>
            </div>

            {/* Mobile Image */}
            <div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 12, fontWeight: 600 }}>
                📱 Mobile ছবি <span style={{ color: '#555', fontWeight: 400 }}>(9:16 বা 1:1, min 640×640)</span>
              </div>
              {settings.mobileHeroImage ? (
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <img src={settings.mobileHeroImage} alt="mobile hero"
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #333' }} />
                  <button
                    onClick={async () => {
                      const updates = getHeroImageUpdates(settings.desktopHeroImage, '');
                      await Promise.all(updates.map(update => upsert(update.key, update.value)));
                      setSettings(s => ({ ...s, mobileHeroImage: '' }));
                      setRawSettings(current => ({
                        ...current,
                        ...Object.fromEntries(updates.map(update => [update.key, update.value])),
                      }));
                    }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: '#f87171', border: '1px solid #5c1a1a', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => mobileRef.current?.click()}
                  style={{ height: 140, border: '2px dashed #333', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#4ade80'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#333'}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📱</div>
                  <div style={{ fontSize: 13, color: '#555' }}>ক্লিক করে আপলোড করুন</div>
                </div>
              )}
              <input ref={mobileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'mobile')} />
              <button
                onClick={() => mobileRef.current?.click()}
                disabled={uploading === 'mobile'}
                style={{ width: '100%', background: uploading === 'mobile' ? '#1a1a1a' : '#1a3a1a', color: uploading === 'mobile' ? '#555' : '#4ade80', border: '1px solid #1a5c33', padding: '10px', borderRadius: 8, cursor: uploading === 'mobile' ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {uploading === 'mobile' ? '⏳ আপলোড হচ্ছে...' : '📤 Mobile ছবি আপলোড'}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 24px', color: '#fbbf24' }}>✏️ Hero Section টেক্সট</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ছোট Badge Text</label>
              <input
                value={settings.hero_badge}
                onChange={e => setSettings(s => ({ ...s, hero_badge: e.target.value }))}
                placeholder="Available for work"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>মূল টাইটেল</label>
              <input value={settings.hero_title}
                onChange={e => setSettings(s => ({ ...s, hero_title: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>সাবটাইটেল</label>
              <textarea value={settings.hero_subtitle}
                onChange={e => setSettings(s => ({ ...s, hero_subtitle: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Showreel */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 24px', color: '#a78bfa' }}>🎬 Showreel URL</h2>
          <input
            value={settings.showreel_url}
            onChange={e => setSettings(s => ({ ...s, showreel_url: e.target.value }))}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
            YouTube embed URL দিন — যেমন: https://www.youtube.com/embed/dQw4w9WgXcQ
          </p>
        </div>

        {/* Stats */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 24px', color: '#4ade80' }}>📊 Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>ক্লায়েন্ট সংখ্যা</label>
              <input type="number" value={settings.stat_clients}
                onChange={e => setSettings(s => ({ ...s, stat_clients: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>অভিজ্ঞতার বছর</label>
              <input type="number" value={settings.stat_years}
                onChange={e => setSettings(s => ({ ...s, stat_years: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Homepage Portfolio Preview */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: '#38bdf8' }}>🎞️ Homepage Portfolio Preview</h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 24px' }}>
            এই section-এর text, CTA এবং item limit এখান থেকে control হবে। কোন video বা graphic homepage-এ দেখাবে সেটা Video Manager আর Graphics Manager দুই জায়গা থেকেই per-item basis-এ control করতে পারবেন।
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <input
              type="checkbox"
              id="homepagePortfolioEnabled"
              checked={settings.homepagePortfolioEnabled === 'true'}
              onChange={e => setSettings(current => ({ ...current, homepagePortfolioEnabled: String(e.target.checked) }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="homepagePortfolioEnabled" style={{ fontSize: 14, color: '#ccc', cursor: 'pointer' }}>
              Homepage-এ portfolio preview section চালু রাখুন
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Section Badge</label>
              <input
                value={settings.homepagePortfolioBadge}
                onChange={e => setSettings(current => ({ ...current, homepagePortfolioBadge: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Items দেখানোর সংখ্যা</label>
              <input
                type="number"
                min="1"
                max="12"
                value={settings.homepagePortfolioItemLimit}
                onChange={e => setSettings(current => ({ ...current, homepagePortfolioItemLimit: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Section Title</label>
              <input
                value={settings.homepagePortfolioTitle}
                onChange={e => setSettings(current => ({ ...current, homepagePortfolioTitle: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Section Subtitle</label>
              <textarea
                rows={3}
                value={settings.homepagePortfolioSubtitle}
                onChange={e => setSettings(current => ({ ...current, homepagePortfolioSubtitle: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Button Text</label>
              <input
                value={settings.homepagePortfolioButtonText}
                onChange={e => setSettings(current => ({ ...current, homepagePortfolioButtonText: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 8 }}>Button Link</label>
              <input
                value={settings.homepagePortfolioButtonLink}
                onChange={e => setSettings(current => ({ ...current, homepagePortfolioButtonLink: e.target.value }))}
                placeholder="/portfolio"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button onClick={handleSaveText} disabled={saving}
          style={{ width: '100%', background: saving ? '#1a1a1a' : '#3b82f6', color: saving ? '#555' : '#fff', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {saving ? '⏳ সেভ হচ্ছে...' : '✅ সব সেটিংস সেভ করুন'}
        </button>
      </div>
    </div>
  );
}
