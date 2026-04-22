'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import {
  getPortfolioCategoriesForTab,
  getPortfolioItemsForTab,
  getPortfolioTabs,
  sortPortfolioItemsByOrder,
  type PortfolioCategory,
  type PortfolioPageSettings,
  type PortfolioPreviewItem,
  type PortfolioSourceType,
  type PortfolioTabKey,
} from '@/lib/portfolio-content';

type PortfolioShowcaseProps = {
  items: PortfolioPreviewItem[];
  categories: PortfolioCategory[];
  pageSettings: PortfolioPageSettings;
  loading?: boolean;
  variant: 'page' | 'homepage';
  badge?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
};

function getOrderedSourceTypes(order: PortfolioPageSettings['allTab']['order']) {
  return order === 'graphic-first'
    ? (['graphic', 'video'] as PortfolioSourceType[])
    : (['video', 'graphic'] as PortfolioSourceType[]);
}

function getItemKey(item: Pick<PortfolioPreviewItem, 'sourceType' | 'id'>) {
  return `${item.sourceType}:${item.id}`;
}

function getSortedDisplayItems(items: PortfolioPreviewItem[], variant: PortfolioShowcaseProps['variant']) {
  if (variant === 'homepage') {
    return items;
  }

  return sortPortfolioItemsByOrder(items);
}

function getVideoPreviewUrl(url: string | undefined) {
  if (!url) {
    return '';
  }

  return url.includes('?') ? `${url}&autoplay=1&rel=0` : `${url}?autoplay=1&rel=0`;
}

export default function PortfolioShowcase({
  items,
  categories,
  pageSettings,
  loading = false,
  variant,
  badge,
  title,
  subtitle,
  buttonText,
  buttonLink,
}: PortfolioShowcaseProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const tabs = getPortfolioTabs(items, pageSettings);
  const defaultTab = tabs[0]?.key || 'all';
  const [activeTab, setActiveTab] = useState<PortfolioTabKey>(defaultTab);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioPreviewItem | null>(null);

  useEffect(() => {
    if (!tabs.some(tab => tab.key === activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, defaultTab, tabs]);

  useEffect(() => {
    setActiveCategory('all');
  }, [activeTab]);

  const sectionTitle = variant === 'page' ? pageSettings.title : title || pageSettings.title;
  const sectionSubtitle =
    variant === 'page' ? pageSettings.subtitle : subtitle || pageSettings.subtitle;
  const badgeText = variant === 'page' ? 'Portfolio Showcase' : badge;
  const tabItems = getSortedDisplayItems(
    getPortfolioItemsForTab(items, pageSettings, activeTab),
    variant
  );
  const categoriesForTab = getPortfolioCategoriesForTab(items, categories, pageSettings, activeTab);
  const filteredItems =
    activeCategory === 'all'
      ? tabItems
      : tabItems.filter(item => item.categorySlug === activeCategory);
  const shouldGroupAll =
    activeTab === 'all' &&
    pageSettings.allTab.showVideos &&
    pageSettings.allTab.showGraphics &&
    filteredItems.some(item => item.sourceType === 'video') &&
    filteredItems.some(item => item.sourceType === 'graphic');
  const sectionSourceTypes = shouldGroupAll
    ? getOrderedSourceTypes(pageSettings.allTab.order)
    : [];
  const groupedSections = shouldGroupAll
    ? sectionSourceTypes
        .map(sourceType => ({
          sourceType,
          label:
            sourceType === 'video'
              ? pageSettings.tabs.video.label
              : pageSettings.tabs.graphic.label,
          items: filteredItems.filter(item => item.sourceType === sourceType),
        }))
        .filter(section => section.items.length > 0)
    : [
        {
          sourceType: activeTab === 'graphic' ? 'graphic' : 'video',
          label:
            activeTab === 'graphic'
              ? pageSettings.tabs.graphic.label
              : activeTab === 'video'
                ? pageSettings.tabs.video.label
                : pageSettings.tabs.all.label,
          items: filteredItems,
        },
      ];
  const displayItems = groupedSections.flatMap(section => section.items);
  const selectedIndex = selectedItem
    ? displayItems.findIndex(item => getItemKey(item) === getItemKey(selectedItem))
    : -1;

  useEffect(() => {
    if (selectedItem && !displayItems.some(item => getItemKey(item) === getItemKey(selectedItem))) {
      setSelectedItem(null);
    }
  }, [displayItems, selectedItem]);

  const surface = dark ? '#020617' : '#f7fafc';
  const panel = dark
    ? 'linear-gradient(180deg, rgba(8,15,32,0.96) 0%, rgba(2,6,23,0.98) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)';
  const cardSurface = dark
    ? 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.98) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)';
  const border = dark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.24)';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#64748b';
  const soft = dark ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.18)';

  const showTabs = tabs.length > 1;
  const showCategories = variant === 'page' && categoriesForTab.length > 0;

  return (
    <>
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding:
            variant === 'page'
              ? '72px 24px 88px'
              : '42px 20px 16px',
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: variant === 'page' ? 34 : 30,
            border: `1px solid ${border}`,
            background: panel,
            boxShadow: dark
              ? '0 30px 100px rgba(2,6,23,0.32)'
              : '0 30px 100px rgba(15,23,42,0.12)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 16% 14%, rgba(14,165,233,0.14), transparent 28%), radial-gradient(circle at 84% 12%, rgba(37,99,235,0.18), transparent 28%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: variant === 'page' ? '44px 34px 34px' : '28px 20px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: variant === 'page' ? 'column' : 'row',
                alignItems: variant === 'page' ? 'center' : 'flex-end',
                justifyContent: 'space-between',
                gap: 20,
                textAlign: variant === 'page' ? 'center' : 'left',
                marginBottom: 28,
              }}
            >
              <div style={{ maxWidth: variant === 'page' ? 760 : 680 }}>
                {badgeText ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 14px',
                      borderRadius: 999,
                      marginBottom: 14,
                      background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.8)',
                      border: `1px solid ${soft}`,
                      color: '#38bdf8',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 18px rgba(56,189,248,0.65)',
                      }}
                    />
                    {badgeText}
                  </div>
                ) : null}

                <h2
                  style={{
                    margin: '0 0 12px',
                    fontSize:
                      variant === 'page'
                        ? 'clamp(2.4rem, 4vw, 3.75rem)'
                        : 'clamp(2rem, 3vw, 3.1rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.05em',
                    color: text,
                    lineHeight: 1.05,
                  }}
                >
                  {sectionTitle}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: muted,
                    fontSize: variant === 'page' ? 16 : 15,
                    lineHeight: 1.85,
                    maxWidth: variant === 'page' ? 680 : 580,
                  }}
                >
                  {sectionSubtitle}
                </p>
              </div>

              {variant === 'homepage' && buttonText && buttonLink ? (
                <Link
                  href={buttonLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    minHeight: 48,
                    padding: '13px 22px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: '0 18px 40px rgba(37,99,235,0.22)',
                    flexShrink: 0,
                  }}
                >
                  {buttonText}
                  <span>→</span>
                </Link>
              ) : null}
            </div>

            {showTabs ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: variant === 'page' ? 'center' : 'flex-start',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      background:
                        activeTab === tab.key
                          ? 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)'
                          : dark
                            ? 'rgba(15,23,42,0.62)'
                            : 'rgba(255,255,255,0.84)',
                      color: activeTab === tab.key ? '#fff' : text,
                      border: `1px solid ${
                        activeTab === tab.key ? 'rgba(96,165,250,0.5)' : soft
                      }`,
                      padding: variant === 'page' ? '12px 18px' : '10px 16px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow:
                        activeTab === tab.key
                          ? '0 18px 34px rgba(37,99,235,0.24)'
                          : 'none',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 999,
                        background:
                          activeTab === tab.key
                            ? 'rgba(255,255,255,0.16)'
                            : dark
                              ? 'rgba(2,6,23,0.65)'
                              : 'rgba(226,232,240,0.8)',
                        fontSize: 11,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {showCategories ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  style={{
                    background:
                      activeCategory === 'all'
                        ? dark
                          ? 'rgba(56,189,248,0.16)'
                          : 'rgba(14,165,233,0.14)'
                        : 'transparent',
                    color: activeCategory === 'all' ? '#38bdf8' : muted,
                    border: `1px solid ${
                      activeCategory === 'all' ? 'rgba(56,189,248,0.36)' : soft
                    }`,
                    padding: '10px 16px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  সব ({tabItems.length})
                </button>
                {categoriesForTab.map(category => {
                  const count = tabItems.filter(item => item.categorySlug === category.slug).length;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.slug)}
                      style={{
                        background:
                          activeCategory === category.slug
                            ? dark
                              ? 'rgba(56,189,248,0.16)'
                              : 'rgba(14,165,233,0.14)'
                            : 'transparent',
                        color: activeCategory === category.slug ? '#38bdf8' : muted,
                        border: `1px solid ${
                          activeCategory === category.slug ? 'rgba(56,189,248,0.36)' : soft
                        }`,
                        padding: '10px 16px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {category.name} ({count})
                    </button>
                  );
                })}
              </div>
            ) : null}

            {loading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 18,
                }}
              >
                {Array.from({ length: variant === 'page' ? 6 : 3 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      borderRadius: 24,
                      minHeight: 280,
                      border: `1px solid ${soft}`,
                      background: cardSurface,
                    }}
                  />
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <div
                style={{
                  padding: '54px 24px',
                  borderRadius: 24,
                  border: `1px dashed ${soft}`,
                  background: dark ? 'rgba(2,6,23,0.28)' : 'rgba(255,255,255,0.78)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>
                  {variant === 'page' ? '🎞️' : '🏠'}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: text,
                    marginBottom: 8,
                  }}
                >
                  {variant === 'page'
                    ? 'এই ফিল্টারে কোনো কাজ পাওয়া যায়নি'
                    : 'Homepage preview-র জন্য এখনো কোনো কাজ নির্বাচিত হয়নি'}
                </div>
                <div style={{ fontSize: 14, color: muted }}>
                  {variant === 'page'
                    ? 'ক্যাটাগরি বা tab বদলে আবার দেখুন।'
                    : 'Video Manager বা Graphics Manager থেকে homepage visibility চালু করুন।'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 24 }}>
                {groupedSections.map(section => (
                  <div key={section.label} style={{ display: 'grid', gap: 16 }}>
                    {shouldGroupAll ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: text,
                          }}
                        >
                          {section.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: muted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {section.items.length} item
                          {section.items.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          variant === 'page'
                            ? 'repeat(auto-fit, minmax(280px, 1fr))'
                            : 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 18,
                      }}
                    >
                      {section.items.map(item => (
                        <button
                          key={getItemKey(item)}
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          style={{
                            textAlign: 'left',
                            padding: 0,
                            borderRadius: 24,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `1px solid ${soft}`,
                            background: cardSurface,
                            boxShadow: dark
                              ? '0 24px 44px rgba(2,6,23,0.24)'
                              : '0 18px 32px rgba(15,23,42,0.08)',
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                          }}
                          onMouseEnter={event => {
                            (event.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                            (event.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb';
                          }}
                          onMouseLeave={event => {
                            (event.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                            (event.currentTarget as HTMLButtonElement).style.borderColor = soft;
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              paddingBottom: item.sourceType === 'graphic' ? '72%' : '60%',
                              background: dark ? '#0f172a' : '#dbeafe',
                            }}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                  'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.72) 100%)',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: 14,
                                left: 14,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                borderRadius: 999,
                                background: 'rgba(2,6,23,0.72)',
                                border: '1px solid rgba(148,163,184,0.16)',
                                color: '#e2e8f0',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {item.categoryName}
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                top: 14,
                                right: 14,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 10px',
                                borderRadius: 999,
                                background: 'rgba(2,6,23,0.72)',
                                border: '1px solid rgba(148,163,184,0.16)',
                                color: '#cbd5e1',
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                              }}
                            >
                              {item.sourceType === 'video' ? 'ভিডিও' : 'গ্রাফিক্স'}
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: 58,
                                  height: 58,
                                  borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.14)',
                                  border: '1px solid rgba(255,255,255,0.24)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 22,
                                  backdropFilter: 'blur(12px)',
                                }}
                              >
                                {item.sourceType === 'video' ? '▶' : '⌕'}
                              </div>
                            </div>
                          </div>

                          <div style={{ padding: '18px 18px 20px' }}>
                            <div
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                lineHeight: 1.35,
                                color: text,
                                marginBottom: 8,
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                color: muted,
                                fontSize: 13,
                              }}
                            >
                              <span>{item.categoryName}</span>
                              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                                {item.sourceType === 'video' ? 'Preview video ↗' : 'Preview artwork ↗'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedItem ? (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(2,6,23,0.88)',
            backdropFilter: 'blur(22px)',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={event => event.stopPropagation()}
            style={{
              width: 'min(1100px, 100%)',
              maxHeight: 'calc(100vh - 40px)',
              display: 'grid',
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 22,
                border: `1px solid ${soft}`,
                background: dark
                  ? 'rgba(15,23,42,0.72)'
                  : 'rgba(255,255,255,0.92)',
                boxShadow: dark
                  ? '0 20px 60px rgba(2,6,23,0.28)'
                  : '0 20px 60px rgba(15,23,42,0.12)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#38bdf8',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {selectedItem.sourceType === 'video'
                    ? pageSettings.tabs.video.label
                    : pageSettings.tabs.graphic.label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: text,
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {selectedItem.title}
                </div>
                <div style={{ color: muted, fontSize: 14 }}>{selectedItem.categoryName}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedItem(displayItems[selectedIndex - 1])}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: `1px solid ${soft}`,
                      background: dark ? 'rgba(2,6,23,0.58)' : 'rgba(255,255,255,0.84)',
                      color: text,
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >
                    ←
                  </button>
                ) : null}
                {selectedIndex >= 0 && selectedIndex < displayItems.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedItem(displayItems[selectedIndex + 1])}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: `1px solid ${soft}`,
                      background: dark ? 'rgba(2,6,23,0.58)' : 'rgba(255,255,255,0.84)',
                      color: text,
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >
                    →
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: `1px solid ${soft}`,
                    background: dark ? 'rgba(2,6,23,0.58)' : 'rgba(255,255,255,0.84)',
                    color: text,
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              style={{
                borderRadius: 26,
                border: `1px solid ${soft}`,
                background: dark
                  ? 'linear-gradient(180deg, rgba(8,15,32,0.94) 0%, rgba(2,6,23,0.98) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)',
                boxShadow: dark
                  ? '0 28px 70px rgba(2,6,23,0.28)'
                  : '0 28px 70px rgba(15,23,42,0.12)',
                overflow: 'hidden',
              }}
            >
              {selectedItem.sourceType === 'video' ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#020617' }}>
                  <iframe
                    src={getVideoPreviewUrl(selectedItem.youtube_url)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 420,
                    maxHeight: '72vh',
                    padding: 22,
                    overflow: 'auto',
                    background:
                      dark
                        ? 'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.14), transparent 24%), #020617'
                        : 'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.14), transparent 24%), #eff6ff',
                  }}
                >
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 'calc(72vh - 44px)',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: 18,
                      boxShadow: dark
                        ? '0 24px 60px rgba(2,6,23,0.4)'
                        : '0 20px 50px rgba(15,23,42,0.16)',
                      background: '#fff',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
