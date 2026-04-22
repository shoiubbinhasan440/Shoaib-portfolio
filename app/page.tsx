'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/components/ThemeProvider';
import PortfolioShowcase from '@/components/portfolio/PortfolioShowcase';
import {
  HERO_SETTING_KEYS,
  getFirstSetting,
  getHeroImages,
  parseStyledSetting,
  toSettingMap,
} from '@/lib/hero-settings';
import {
  DEFAULT_PORTFOLIO_PAGE_SETTINGS,
  DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS,
  fetchPortfolioDataset,
  getHomepagePortfolioPreviewItems,
  getHomepagePortfolioSettings,
  getPortfolioPageSettings,
  toPortfolioPreviewItems,
  type PortfolioGraphic,
  type HomepagePortfolioSectionSettings,
  type PortfolioCategory,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
  type PortfolioVideo,
} from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TextStyleState = React.CSSProperties;

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const contactRef = useRef<HTMLDivElement>(null);

  const [showreel, setShowreel] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [heroBadge, setHeroBadge] = useState('Available for work');
  const [heroTitle, setHeroTitle] = useState('Visual Storyteller & Creative Director');
  const [heroSubtitle, setHeroSubtitle] = useState('ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।');
  const [desktopHeroImage, setDesktopHeroImage] = useState('');
  const [mobileHeroImage, setMobileHeroImage] = useState('');
  const [statClients, setStatClients] = useState(50);
  const [statYears, setStatYears] = useState(3);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [portfolioVideos, setPortfolioVideos] = useState<PortfolioVideo[]>([]);
  const [portfolioGraphics, setPortfolioGraphics] = useState<PortfolioGraphic[]>([]);
  const [portfolioCategories, setPortfolioCategories] = useState<PortfolioCategory[]>([]);
  const [homepagePortfolioSettings, setHomepagePortfolioSettings] = useState<HomepagePortfolioSectionSettings>(
    DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS
  );
  const [portfolioPageSettings, setPortfolioPageSettings] = useState<PortfolioPageSettings>(
    DEFAULT_PORTFOLIO_PAGE_SETTINGS
  );
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState('Portfolio দেখুন');
  const [statProjectsLabel, setStatProjectsLabel] = useState('Projects');
  const [statClientsLabel, setStatClientsLabel] = useState('Clients');
  const [statYearsLabel, setStatYearsLabel] = useState('Years Crafting');
  const [heroBadgeStyle, setHeroBadgeStyle] = useState<TextStyleState>({});
  const [heroTitleStyle, setHeroTitleStyle] = useState<TextStyleState>({});
  const [heroSubtitleStyle, setHeroSubtitleStyle] = useState<TextStyleState>({});

  const bg = dark ? '#080808' : '#f9f9f9';
  const text = dark ? '#fff' : '#111';
  const sub = dark ? '#555' : '#888';
  const card = dark ? '#0d0d0d' : '#fff';
  const border = dark ? '#1a1a1a' : '#e5e5e5';

  useEffect(() => {
    async function load() {
      const [{ data: settings }, { videos, categories, graphics }] = await Promise.all([
        supabase.from('site_settings').select('*'),
        fetchPortfolioDataset(supabase),
      ]);

      if (settings) {
        const map = toSettingMap(settings);
        const badge = parseStyledSetting(map[HERO_SETTING_KEYS.badge], 'Available for work');
        const title = parseStyledSetting(
          map[HERO_SETTING_KEYS.title],
          'Visual Storyteller & Creative Director'
        );
        const subtitle = parseStyledSetting(
          map[HERO_SETTING_KEYS.subtitle],
          'ভিডিও এডিটিং ও গ্রাফিক্স ডিজাইনের মাধ্যমে আপনার গল্প বলি।'
        );
        const primaryCta = parseStyledSetting(map[HERO_SETTING_KEYS.primaryCta], 'Portfolio দেখুন');
        const statProjects = parseStyledSetting(map.stat1_label, 'Projects');
        const statClientsLabelSetting = parseStyledSetting(map.stat2_label, 'Clients');
        const statYearsLabelSetting = parseStyledSetting(map.stat3_label, 'Years Crafting');
        const heroImages = getHeroImages(map);

        setHeroBadge(badge.value);
        setHeroBadgeStyle(badge.style);
        setHeroTitle(title.value);
        setHeroTitleStyle(title.style);
        setHeroSubtitle(subtitle.value);
        setHeroSubtitleStyle(subtitle.style);
        setPrimaryCtaLabel(primaryCta.value);
        setDesktopHeroImage(heroImages.desktop);
        setMobileHeroImage(heroImages.mobile);
        setHomepagePortfolioSettings(getHomepagePortfolioSettings(map));
        setPortfolioPageSettings(getPortfolioPageSettings(map));
        setStatProjectsLabel(statProjects.value);
        setStatClientsLabel(statClientsLabelSetting.value);
        setStatYearsLabel(statYearsLabelSetting.value);

        const savedShowreel = getFirstSetting(map, HERO_SETTING_KEYS.showreelUrl);
        if (savedShowreel) {
          setShowreel(savedShowreel);
        }

        const savedClients = getFirstSetting(map, HERO_SETTING_KEYS.statClients);
        if (savedClients) {
          setStatClients(parseInt(savedClients, 10) || 50);
        }

        const savedYears = getFirstSetting(map, HERO_SETTING_KEYS.statYears);
        if (savedYears) {
          setStatYears(parseInt(savedYears, 10) || 3);
        }
      }

      setPortfolioCount(videos.length + graphics.length);
      setPortfolioVideos(videos);
      setPortfolioGraphics(graphics);
      setPortfolioCategories(categories);
    }

    void load();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentHeroImage = isMobile
    ? mobileHeroImage || desktopHeroImage
    : desktopHeroImage || mobileHeroImage;
  const allPortfolioItems: PortfolioPreviewItem[] = toPortfolioPreviewItems(
    portfolioVideos,
    portfolioGraphics,
    portfolioCategories
  );
  const homepagePreviewItems = getHomepagePortfolioPreviewItems(
    allPortfolioItems,
    homepagePortfolioSettings
  );
  const heroShellBackground = '#020617';
  const heroPanelBackground = dark
    ? 'linear-gradient(180deg, rgba(2,6,23,0.62) 0%, rgba(2,6,23,0.82) 100%)'
    : 'linear-gradient(180deg, rgba(15,23,42,0.46) 0%, rgba(15,23,42,0.72) 100%)';
  const heroPanelBorder = dark ? 'rgba(148,163,184,0.16)' : 'rgba(255,255,255,0.22)';
  const heroEyebrowColor = dark ? '#bae6fd' : '#e0f2fe';
  const heroHeadingColor = dark ? '#f8fafc' : '#ffffff';
  const heroSubtitleColor = dark ? 'rgba(226,232,240,0.82)' : 'rgba(255,255,255,0.82)';
  const heroSecondaryButtonBorder = dark ? 'rgba(148,163,184,0.26)' : 'rgba(255,255,255,0.24)';
  const heroOverlay = isMobile
    ? 'linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(2,6,23,0.58) 50%, rgba(2,6,23,0.96) 100%)'
    : 'linear-gradient(96deg, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.76) 30%, rgba(15,23,42,0.34) 58%, rgba(14,165,233,0.16) 78%, rgba(2,6,23,0.76) 100%)';
  const heroBottomFade = isMobile
    ? 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.12) 24%, rgba(8,47,73,0.26) 52%, rgba(2,6,23,0.78) 78%, rgba(2,6,23,0.96) 100%)'
    : 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.08) 20%, rgba(8,47,73,0.2) 48%, rgba(2,6,23,0.6) 74%, rgba(2,6,23,0.84) 100%)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          minHeight: isMobile ? 'calc(100svh - 72px)' : 'calc(100vh - 74px)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'stretch',
          overflow: 'hidden',
          isolation: 'isolate',
          background: heroShellBackground,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#020617',
            backgroundImage: currentHeroImage
              ? `url(${currentHeroImage})`
              : 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1d4ed8 100%)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: isMobile ? 'scale(1.02)' : 'scale(1.01)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: heroOverlay,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 76% 28%, rgba(59,130,246,0.28), transparent 34%), radial-gradient(circle at 14% 18%, rgba(14,165,233,0.16), transparent 24%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 'auto 0 0 0',
            height: isMobile ? '48%' : '38%',
            background: heroBottomFade,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 1360,
            margin: '0 auto',
            minHeight: isMobile ? 'calc(100svh - 72px)' : 'calc(100vh - 74px)',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 560px) minmax(0, 1fr)',
            alignItems: isMobile ? 'end' : 'center',
            gap: isMobile ? 20 : 40,
            padding: isMobile ? '36px 14px calc(10px + env(safe-area-inset-bottom))' : '56px clamp(24px, 6vw, 72px) 60px',
          }}
        >
          <div
            style={{
              width: isMobile ? 'min(100%, 360px)' : '100%',
              maxWidth: isMobile ? 360 : 540,
              justifySelf: isMobile ? 'center' : 'start',
              alignSelf: isMobile ? 'end' : 'auto',
              padding: isMobile ? '18px 14px 16px' : '34px 32px 28px',
              borderRadius: isMobile ? 22 : 30,
              border: `1px solid ${heroPanelBorder}`,
              background: heroPanelBackground,
              backdropFilter: 'blur(18px)',
              boxShadow: dark
                ? '0 30px 90px rgba(2,6,23,0.38)'
                : '0 30px 90px rgba(15,23,42,0.22)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${heroPanelBorder}`,
                color: heroEyebrowColor,
                padding: isMobile ? '6px 13px' : '7px 16px',
                borderRadius: 999,
                marginBottom: isMobile ? 16 : 22,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  background: '#38bdf8',
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: '0 0 18px rgba(56,189,248,0.75)',
                }}
              />
              <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, ...heroBadgeStyle }}>
                {heroBadge}
              </span>
            </div>

            <h1
              style={{
                fontSize: isMobile ? 'clamp(2.1rem, 9.8vw, 3.15rem)' : 'clamp(3.5rem, 6vw, 5.4rem)',
                fontWeight: 800,
                letterSpacing: '-0.06em',
                lineHeight: isMobile ? 0.98 : 0.95,
                margin: isMobile ? '0 0 14px' : '0 0 18px',
                color: heroHeadingColor,
                maxWidth: isMobile ? '100%' : 520,
              }}
            >
              <span style={heroTitleStyle}>{heroTitle}</span>
            </h1>

            <p
              style={{
                fontSize: isMobile ? 14 : 17,
                color: heroSubtitleColor,
                maxWidth: 470,
                margin: isMobile ? '0 0 22px' : '0 0 28px',
                lineHeight: isMobile ? 1.62 : 1.78,
                ...heroSubtitleStyle,
              }}
            >
              {heroSubtitle}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'minmax(0, 1.12fr) minmax(0, 0.88fr) minmax(0, 1fr)' : 'repeat(3, max-content)',
                justifyContent: isMobile ? 'stretch' : 'flex-start',
                gap: isMobile ? 6 : 12,
                marginBottom: isMobile ? 16 : 22,
              }}
            >
              <button
                onClick={() => router.push('/portfolio')}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                  color: '#fff',
                  border: 'none',
                  width: isMobile ? '100%' : 'auto',
                  minWidth: 0,
                  padding: isMobile ? '10px 8px' : '14px 26px',
                  borderRadius: isMobile ? 12 : 14,
                  fontWeight: 700,
                  fontSize: isMobile ? 12 : 15,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  boxShadow: '0 18px 40px rgba(37,99,235,0.35)',
                }}
              >
                {isMobile ? primaryCtaLabel : `${primaryCtaLabel} →`}
              </button>
              <button
                onClick={scrollToContact}
                style={{
                  background: 'rgba(2,6,23,0.18)',
                  color: '#f8fafc',
                  border: `1px solid ${heroSecondaryButtonBorder}`,
                  width: isMobile ? '100%' : 'auto',
                  minWidth: 0,
                  padding: isMobile ? '10px 8px' : '14px 24px',
                  borderRadius: isMobile ? 12 : 14,
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 15,
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                }}
              >
                Hire Me
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'rgba(2,6,23,0.14)',
                  color: '#f8fafc',
                  border: `1px solid ${heroSecondaryButtonBorder}`,
                  width: isMobile ? '100%' : 'auto',
                  minWidth: 0,
                  padding: isMobile ? '10px 8px' : '14px 20px',
                  borderRadius: isMobile ? 12 : 14,
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 4 : 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span
                  style={{
                    width: isMobile ? 18 : 26,
                    height: isMobile ? 18 : 26,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.14)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: isMobile ? 7 : 10,
                  }}
                >
                  ▶
                </span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Showreel
                </span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, max-content)',
                gap: isMobile ? 6 : 10,
              }}
            >
              {[
                { value: `${portfolioCount}+`, label: statProjectsLabel },
                { value: `${statClients}+`, label: statClientsLabel },
                {
                  value: `${statYears}+`,
                  label: isMobile ? statYearsLabel.replace(/crafting/i, '').trim() || statYearsLabel : statYearsLabel,
                },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    minWidth: 0,
                    padding: isMobile ? '9px 8px' : '12px 14px',
                    borderRadius: isMobile ? 14 : 16,
                    background: dark ? 'rgba(15,23,42,0.52)' : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${heroPanelBorder}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#f8fafc', marginBottom: isMobile ? 2 : 4 }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: isMobile ? 9 : 11, color: 'rgba(226,232,240,0.72)', letterSpacing: isMobile ? '0.05em' : '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isMobile && (
            <div
              style={{
                minHeight: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                paddingBottom: 18,
              }}
            >
              <div
                style={{
                  maxWidth: 340,
                  padding: '18px 18px 16px',
                  borderRadius: 24,
                  border: `1px solid ${heroPanelBorder}`,
                  background: dark ? 'rgba(2,6,23,0.4)' : 'rgba(15,23,42,0.24)',
                  color: '#e2e8f0',
                  backdropFilter: 'blur(14px)',
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 10 }}>
                  Cinematic Editing
                </div>
                <div style={{ fontSize: 18, lineHeight: 1.55, fontWeight: 600 }}>
                  Strong visuals, layered motion, and premium storytelling in the first frame.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── PORTFOLIO PREVIEW ── */}
      {homepagePortfolioSettings.enabled && homepagePreviewItems.length > 0 && (
        <PortfolioShowcase
          variant="homepage"
          items={homepagePreviewItems}
          categories={portfolioCategories}
          pageSettings={portfolioPageSettings}
          badge={homepagePortfolioSettings.badge}
          title={homepagePortfolioSettings.title}
          subtitle={homepagePortfolioSettings.subtitle}
          buttonText={homepagePortfolioSettings.buttonText}
          buttonLink={homepagePortfolioSettings.buttonLink}
        />
      )}

      {/* ── ABOUT ── */}
      <section style={{ padding: isMobile ? '40px 20px' : '80px 40px', maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>About Me</div>
          <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(26px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 20px', color: text }}>
            আমি একজন<br /><span style={{ color: '#3b82f6' }}>Creative Designer</span>
          </h2>
          <p style={{ color: sub, fontSize: 15, lineHeight: 1.9, marginBottom: 28 }}>
            ভিডিও এডিটিং ও গ্রাফিক ডিজাইনে {statYears}+ বছরের অভিজ্ঞতা নিয়ে কাজ করছি।
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { skill: 'Premiere Pro', pct: 95 },
              { skill: 'After Effects', pct: 88 },
              { skill: 'Photoshop', pct: 90 },
            ].map(s => (
              <div key={s.skill}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: text }}>
                  <span>{s.skill}</span><span style={{ color: '#3b82f6', fontWeight: 700 }}>{s.pct}%</span>
                </div>
                <div style={{ height: 4, background: dark ? '#1a1a1a' : '#e5e5e5', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: s.pct + '%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/about')}
            style={{ marginTop: 28, background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            আরও জানুন →
          </button>
        </div>

        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: 320, flexShrink: 0 }}>
            {[
              { icon: '🎬', label: 'Video Editing', desc: 'Cinematic cuts & grading' },
              { icon: '🎨', label: 'Graphic Design', desc: 'Logos, posters & branding' },
              { icon: '✨', label: 'Motion Graphics', desc: 'Animations & effects' },
              { icon: '📱', label: 'Social Media', desc: 'Reels & content' },
            ].map(item => (
              <div key={item.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 18, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = border}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: text, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: sub }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SHOWREEL ── */}
      <section style={{ padding: isMobile ? '40px 20px' : '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Featured</div>
          <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-1px', margin: 0, color: text }}>আমার Showreel</h2>
        </div>
        <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}`, boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <iframe src={showreel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: isMobile ? '40px 20px' : '60px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', background: card, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
          {[
            { value: portfolioCount + '+', label: statProjectsLabel, icon: '🎬' },
            { value: statClients + '+', label: statClientsLabel, icon: '🤝' },
            { value: statYears + '+', label: statYearsLabel, icon: '⚡' },
            { value: '100%', label: 'ক্লায়েন্ট সন্তুষ্টি', icon: '⭐' },
          ].map((s, i) => (
            <div key={i} style={{ padding: isMobile ? '28px 16px' : '44px 24px', textAlign: 'center', borderRight: isMobile ? (i % 2 === 0 ? `1px solid ${border}` : 'none') : (i < 3 ? `1px solid ${border}` : 'none'), borderBottom: isMobile && i < 2 ? `1px solid ${border}` : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? '32px' : 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-2px', color: text, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: sub }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HIRE ME / CONTACT ── */}
      <section ref={contactRef} style={{ padding: isMobile ? '40px 20px 60px' : '60px 40px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', background: dark ? 'linear-gradient(135deg, #0f172a, #1e1b4b)' : 'linear-gradient(135deg, #eff6ff, #eef2ff)', border: `1px solid ${dark ? '#1e3a8a' : '#bfdbfe'}`, borderRadius: 24, padding: isMobile ? '40px 24px' : '56px 40px' }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>🤝</div>
          <h2 style={{ fontSize: isMobile ? '24px' : 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.5px', color: text }}>একসাথে কাজ করি?</h2>
          <p style={{ color: sub, fontSize: 15, margin: '0 0 32px', lineHeight: 1.7 }}>
            Video Editing, Graphics Design বা যেকোনো Creative প্রজেক্টের জন্য যোগাযোগ করুন।
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/contact')}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              যোগাযোগ করুন →
            </button>
            <a href="https://wa.me/8801885080118" target="_blank" rel="noopener noreferrer"
              style={{ background: '#25d366', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              📱 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: isMobile ? '40px 20px 28px' : '48px 40px 32px', background: dark ? '#050505' : '#fff' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 28 : 40, marginBottom: 40 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 10 }}>
                <span style={{ color: text }}>Minhajul</span><span style={{ color: '#3b82f6' }}>.</span>
              </div>
              <p style={{ color: sub, fontSize: 14, lineHeight: 1.7 }}>Video Editor & Graphic Designer</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>Quick Links</div>
              {[{ label: 'Portfolio', href: '/portfolio' }, { label: 'Tutorial', href: '/tutorial' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }].map(l => (
                <a key={l.label} href={l.href} style={{ display: 'block', color: sub, textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>{l.label}</a>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>যোগাযোগ</div>
              <div style={{ color: sub, fontSize: 13, lineHeight: 2 }}>
                <div>📧 sayeedfahaad@gmail.com</div>
                <div>📱 +880 1885 080118</div>
                <div>📍 Mirpur 10, Dhaka</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: text, marginBottom: 14 }}>Social</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Facebook', href: 'https://facebook.com', icon: '📘' },
                  { label: 'YouTube', href: 'https://youtube.com', icon: '▶️' },
                  { label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: sub, textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.icon} {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: sub }}>© 2025 Md. Minhajul Hoque. All rights reserved.</div>
            <div style={{ fontSize: 13, color: sub }}>Made with ❤️ in Bangladesh</div>
          </div>
        </div>
      </footer>

      {/* ── SHOWREEL MODAL ── */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: dark ? '#0d0d0d' : '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <span style={{ fontWeight: 700, color: text }}>🎬 Showreel</span>
              <button onClick={() => setShowModal(false)} style={{ background: dark ? '#111' : '#f5f5f5', border: `1px solid ${border}`, color: sub, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe src={showreel + '?autoplay=1'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
