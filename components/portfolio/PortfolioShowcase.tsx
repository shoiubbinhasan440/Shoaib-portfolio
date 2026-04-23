'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import type {
  PortfolioPageBuilderConfig,
} from '@/lib/portfolio-page-content';
import {
  getPortfolioPageCategoryConfig,
  getPortfolioPageItemConfig,
} from '@/lib/portfolio-page-content';
import {
  DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS,
  getHomepageAllowedSourceTypes,
  getHomepageCategoryConfig,
  getHomepageConfigForItem,
  getPortfolioCategoriesForTab,
  getPortfolioItemsForTab,
  getPortfolioTabs,
  sortPortfolioItemsByOrder,
  type HomepagePortfolioSectionSettings,
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
  homepageSettings?: HomepagePortfolioSectionSettings;
  pageBuilder?: PortfolioPageBuilderConfig;
};

type ShowcaseCategory = PortfolioCategory & {
  displayName: string;
  displayOrder: number;
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

function getGapValue(variant: PortfolioShowcaseProps['variant'], settings: HomepagePortfolioSectionSettings) {
  if (variant === 'page') {
    return 18;
  }

  switch (settings.gap) {
    case 'small':
      return 14;
    case 'large':
      return 24;
    default:
      return 18;
  }
}

function getPageGapValue(config: PortfolioPageBuilderConfig | undefined) {
  if (!config) {
    return 18;
  }

  switch (config.showcase.gap) {
    case 'small':
      return 14;
    case 'large':
      return 24;
    default:
      return 18;
  }
}

function getColumnsForViewport(width: number, settings: HomepagePortfolioSectionSettings) {
  const mobileColumns =
    settings.responsivePreset === 'showcase'
      ? Math.max(1, settings.mobileColumns)
      : settings.responsivePreset === 'compact'
        ? Math.min(2, Math.max(1, settings.mobileColumns))
        : Math.max(1, settings.mobileColumns);
  const tabletColumns =
    settings.responsivePreset === 'showcase'
      ? Math.max(2, settings.tabletColumns)
      : Math.max(1, settings.tabletColumns);
  const desktopColumns =
    settings.layoutType === 'compact-preview'
      ? Math.min(4, Math.max(1, settings.desktopColumns + 1))
      : Math.max(1, settings.desktopColumns);

  if (width < 700) {
    return mobileColumns;
  }

  if (width < 1080) {
    return tabletColumns;
  }

  return desktopColumns;
}

function getPageColumnsForViewport(width: number, config: PortfolioPageBuilderConfig | undefined) {
  if (!config) {
    if (width < 700) {
      return 1;
    }

    if (width < 1080) {
      return 2;
    }

    return 3;
  }

  if (width < 700) {
    return config.showcase.mobileColumns;
  }

  if (width < 1080) {
    return config.showcase.tabletColumns;
  }

  return config.showcase.desktopColumns;
}

function getSectionMaxWidth(
  variant: PortfolioShowcaseProps['variant'],
  settings: HomepagePortfolioSectionSettings,
  pageBuilder?: PortfolioPageBuilderConfig
) {
  if (variant === 'page') {
    switch (pageBuilder?.showcase.width) {
      case 'normal':
        return 1100;
      case 'full':
        return 1360;
      case 'wide':
      default:
        return 1240;
    }
  }

  if (settings.containerWidth === 'full') {
    return 1440;
  }

  if (settings.containerWidth === 'wide') {
    return 1360;
  }

  return 1180;
}

function getCardSurface(
  dark: boolean,
  variant: PortfolioShowcaseProps['variant'],
  settings: HomepagePortfolioSectionSettings,
  pageBuilder?: PortfolioPageBuilderConfig
) {
  if (variant === 'page') {
    switch (pageBuilder?.showcase.cardStyle) {
      case 'glass':
        return dark
          ? 'linear-gradient(180deg, rgba(15,23,42,0.72) 0%, rgba(2,6,23,0.88) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(239,246,255,0.88) 100%)';
      case 'editorial':
        return dark
          ? 'linear-gradient(180deg, rgba(3,7,18,0.96) 0%, rgba(2,6,23,1) 100%)'
          : 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(226,232,240,0.98) 100%)';
      case 'light':
        return dark
          ? 'linear-gradient(180deg, rgba(10,15,31,0.96) 0%, rgba(2,6,23,1) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(241,245,249,0.98) 100%)';
      case 'cinematic':
      default:
        return dark
          ? 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.98) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)';
    }
  }

  switch (settings.cardStyle) {
    case 'minimal-premium':
      return dark
        ? 'linear-gradient(180deg, rgba(6,10,24,0.9) 0%, rgba(2,6,23,0.98) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)';
    case 'glass-bordered':
      return dark
        ? 'linear-gradient(180deg, rgba(15,23,42,0.62) 0%, rgba(2,6,23,0.84) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(241,245,249,0.84) 100%)';
    case 'dark-editorial':
      return 'linear-gradient(180deg, rgba(4,8,20,0.94) 0%, rgba(1,3,10,0.98) 100%)';
    case 'light-polished':
      return dark
        ? 'linear-gradient(180deg, rgba(8,15,32,0.94) 0%, rgba(2,6,23,0.98) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(237,242,247,0.96) 100%)';
    default:
      return dark
        ? 'linear-gradient(180deg, rgba(8,15,32,0.96) 0%, rgba(2,6,23,0.98) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(241,245,249,0.98) 100%)';
  }
}

function getCardOverlay(
  dark: boolean,
  settings: HomepagePortfolioSectionSettings,
  item: PortfolioPreviewItem,
  pageBuilder?: PortfolioPageBuilderConfig,
  variant?: PortfolioShowcaseProps['variant']
) {
  if (variant === 'page') {
    switch (pageBuilder?.showcase.cardStyle) {
      case 'glass':
        return 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(2,6,23,0.46) 100%)';
      case 'editorial':
        return 'linear-gradient(180deg, rgba(1,4,12,0.08) 0%, rgba(1,4,12,0.86) 100%)';
      case 'light':
        return dark
          ? 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.72) 100%)'
          : 'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.54) 100%)';
      case 'cinematic':
      default:
        return item.sourceType === 'graphic'
          ? 'linear-gradient(180deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.76) 100%)'
          : 'linear-gradient(180deg, rgba(2,6,23,0.1) 0%, rgba(2,6,23,0.82) 100%)';
    }
  }

  if (!settings.showHoverOverlay) {
    return 'transparent';
  }

  switch (settings.cardStyle) {
    case 'minimal-premium':
      return 'linear-gradient(180deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.56) 100%)';
    case 'glass-bordered':
      return 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(2,6,23,0.42) 100%)';
    case 'dark-editorial':
      return 'linear-gradient(180deg, rgba(1,4,12,0.1) 0%, rgba(1,4,12,0.82) 100%)';
    case 'light-polished':
      return dark
        ? 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.68) 100%)'
        : 'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.52) 100%)';
    default:
      return item.sourceType === 'graphic'
        ? 'linear-gradient(180deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.74) 100%)'
        : 'linear-gradient(180deg, rgba(2,6,23,0.1) 0%, rgba(2,6,23,0.78) 100%)';
  }
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
  homepageSettings,
  pageBuilder,
}: PortfolioShowcaseProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const homepageConfig = homepageSettings || DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS;
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [activeTabState, setActiveTabState] = useState<PortfolioTabKey>('all');
  const [activeCategoryByTab, setActiveCategoryByTab] = useState<Record<PortfolioTabKey, string>>({
    all: 'all',
    video: 'all',
    graphic: 'all',
  });
  const [selectedItem, setSelectedItem] = useState<PortfolioPreviewItem | null>(null);

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const sectionTitle =
    variant === 'page'
      ? pageBuilder?.hero.title || pageSettings.title
      : title || homepageConfig.title;
  const sectionSubtitle =
    variant === 'page'
      ? pageBuilder?.hero.subtitle || pageSettings.subtitle
      : subtitle || homepageConfig.subtitle;
  const badgeText =
    variant === 'page'
      ? pageBuilder?.hero.badge || 'Portfolio Showcase'
      : badge || homepageConfig.badge;
  const introText = variant === 'page' ? pageBuilder?.hero.introText || '' : '';
  const cardGap =
    variant === 'page' ? getPageGapValue(pageBuilder) : getGapValue(variant, homepageConfig);
  const columns =
    variant === 'homepage'
      ? getColumnsForViewport(viewportWidth, homepageConfig)
      : getPageColumnsForViewport(viewportWidth, pageBuilder);
  const isMobile = viewportWidth < 700;

  const homepageTabs = useMemo(() => {
    if (variant !== 'homepage') {
      return [];
    }

    const videoCount = items.filter(item => item.sourceType === 'video').length;
    const graphicCount = items.filter(item => item.sourceType === 'graphic').length;
    const tabs: Array<{ key: PortfolioTabKey; label: string; count: number }> = [];
    const hasMixedContent = videoCount > 0 && graphicCount > 0;

    if (homepageConfig.showTabs && hasMixedContent) {
      tabs.push({
        key: 'all',
        label: pageSettings.tabs.all.label,
        count: items.length,
      });
    }

    if (homepageConfig.showVideos && videoCount > 0) {
      tabs.push({
        key: 'video',
        label: pageSettings.tabs.video.label,
        count: videoCount,
      });
    }

    if (homepageConfig.showGraphics && graphicCount > 0) {
      tabs.push({
        key: 'graphic',
        label: pageSettings.tabs.graphic.label,
        count: graphicCount,
      });
    }

    return tabs;
  }, [homepageConfig.showGraphics, homepageConfig.showTabs, homepageConfig.showVideos, items, pageSettings.tabs, variant]);

  const tabs = variant === 'page' ? getPortfolioTabs(items, pageSettings) : homepageTabs;
  const defaultTab = tabs[0]?.key || 'all';
  const activeTab = tabs.some(tab => tab.key === activeTabState) ? activeTabState : defaultTab;

  const tabItems = useMemo(() => {
    if (variant === 'page') {
      return getSortedDisplayItems(
        getPortfolioItemsForTab(items, pageSettings, activeTab),
        variant
      );
    }

    const tabFilteredItems =
      activeTab === 'video'
        ? items.filter(item => item.sourceType === 'video')
        : activeTab === 'graphic'
          ? items.filter(item => item.sourceType === 'graphic')
          : items;

    return getSortedDisplayItems(tabFilteredItems, variant);
  }, [activeTab, items, pageSettings, variant]);

  const categoriesForTab: ShowcaseCategory[] = useMemo(() => {
    if (variant === 'page') {
      return getPortfolioCategoriesForTab(items, categories, pageSettings, activeTab)
        .map(category => {
          const config = getPortfolioPageCategoryConfig(
            category,
            pageBuilder?.categoryConfig || {}
          );
          return {
            ...category,
            displayName: config.label,
            displayOrder: config.order,
            enabled: config.enabled,
          };
        })
        .filter(category => category.enabled);
    }

    const allowedSourceTypes =
      activeTab === 'video'
        ? (['video'] as PortfolioSourceType[])
        : activeTab === 'graphic'
          ? (['graphic'] as PortfolioSourceType[])
          : getHomepageAllowedSourceTypes(homepageConfig);

    return categories
      .filter(category => category.active)
      .filter(category => {
        if (category.type === 'both') {
          return allowedSourceTypes.length > 0;
        }

        return allowedSourceTypes.includes(category.type as PortfolioSourceType);
      })
      .filter(category => {
        const categoryConfig = getHomepageCategoryConfig(category, homepageConfig.categoryConfig);
        if (!categoryConfig.enabled) {
          return false;
        }

        return tabItems.some(item => item.categorySlug === category.slug);
      })
      .map(category => {
        const categoryConfig = getHomepageCategoryConfig(category, homepageConfig.categoryConfig);
        return {
          ...category,
          displayName: categoryConfig.label,
          displayOrder: categoryConfig.order,
        };
      })
      .sort((leftCategory, rightCategory) => {
        if (leftCategory.displayOrder !== rightCategory.displayOrder) {
          return leftCategory.displayOrder - rightCategory.displayOrder;
        }

        return leftCategory.displayName.localeCompare(rightCategory.displayName);
      });
  }, [activeTab, categories, homepageConfig, items, pageBuilder?.categoryConfig, pageSettings, tabItems, variant]);

  const requestedCategory = activeCategoryByTab[activeTab] || 'all';
  const fallbackCategory =
    variant === 'homepage' && !homepageConfig.showAllChip && categoriesForTab.length > 0
      ? categoriesForTab[0].slug
      : 'all';
  const activeCategory =
    requestedCategory === 'all'
      ? fallbackCategory
      : categoriesForTab.some(category => category.slug === requestedCategory)
        ? requestedCategory
        : fallbackCategory;

  const filteredItems = useMemo(() => {
    const nextItems =
      activeCategory === 'all'
        ? tabItems
        : tabItems.filter(item => item.categorySlug === activeCategory);

    if (variant === 'homepage' && homepageConfig.maxRows > 0) {
      return nextItems.slice(0, columns * homepageConfig.maxRows);
    }

    return nextItems;
  }, [activeCategory, columns, homepageConfig.maxRows, tabItems, variant]);

  const shouldGroupAll =
    activeTab === 'all' &&
    filteredItems.some(item => item.sourceType === 'video') &&
    filteredItems.some(item => item.sourceType === 'graphic');
  const sectionSourceTypes = shouldGroupAll
    ? variant === 'homepage'
      ? getHomepageAllowedSourceTypes(homepageConfig)
      : getOrderedSourceTypes(pageSettings.allTab.order)
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
          sourceType:
            activeTab === 'graphic'
              ? ('graphic' as const)
              : ('video' as const),
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
  const activeSelectedItem =
    selectedItem && displayItems.some(item => getItemKey(item) === getItemKey(selectedItem))
      ? selectedItem
      : null;
  const selectedIndex = activeSelectedItem
    ? displayItems.findIndex(item => getItemKey(item) === getItemKey(activeSelectedItem))
    : -1;

  const panel = dark
    ? 'linear-gradient(180deg, rgba(8,15,32,0.96) 0%, rgba(2,6,23,0.98) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(241,245,249,0.98) 100%)';
  const cardSurface = getCardSurface(dark, variant, homepageConfig, pageBuilder);
  const border = dark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.24)';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#64748b';
  const soft = dark ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.18)';
  const headerAlignment =
    variant === 'homepage'
      ? homepageConfig.alignment
      : pageBuilder?.hero.alignment || 'center';
  const filtersVisible =
    variant === 'page'
      ? (pageBuilder?.showcase.showCategoryFilters ?? true) && categoriesForTab.length > 0
      : homepageConfig.showCategoryFilters &&
        categoriesForTab.length > 0 &&
        (!isMobile || homepageConfig.mobileFilterVisibility);
  const tabsVisible =
    variant === 'page'
      ? (pageBuilder?.showcase.showTabs ?? true) && tabs.length > 1
      : homepageConfig.showTabs && tabs.length > 1 && (!isMobile || homepageConfig.mobileFilterVisibility);
  const previewFooterLink =
    variant === 'homepage'
      ? homepageConfig.viewAllButtonLink || homepageConfig.buttonLink || '/portfolio'
      : '/portfolio';
  const showPreviewFooterLink =
    variant === 'homepage' &&
    homepageConfig.clickAction === 'preview-with-link' &&
    homepageConfig.showViewAllButton;

  function handleItemAction(item: PortfolioPreviewItem) {
    if (variant === 'page') {
      const itemConfig = getPortfolioPageItemConfig(item, pageBuilder?.itemConfig || {});
      if (!itemConfig.previewEnabled) {
        if (item.sourceType === 'video' && item.youtube_url) {
          window.open(item.youtube_url, '_blank', 'noopener,noreferrer');
          return;
        }

        if (item.imageUrl) {
          window.open(item.imageUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      setSelectedItem(item);
      return;
    }

    const itemConfig = getHomepageConfigForItem(item, homepageConfig.itemConfig);
    const canPreview = homepageConfig.enablePreviewModal && itemConfig.previewEnabled;

    if (homepageConfig.clickAction === 'portfolio') {
      router.push(previewFooterLink);
      return;
    }

    if (canPreview) {
      setSelectedItem(item);
      return;
    }

    router.push(previewFooterLink);
  }

  function goToSibling(direction: 'prev' | 'next') {
    if (selectedIndex < 0) {
      return;
    }

    const nextIndex =
      direction === 'prev'
        ? (selectedIndex - 1 + displayItems.length) % displayItems.length
        : (selectedIndex + 1) % displayItems.length;
    setSelectedItem(displayItems[nextIndex] || null);
  }

  return (
    <>
      <section
        style={{
          maxWidth: getSectionMaxWidth(variant, homepageConfig, pageBuilder),
          margin: '0 auto',
          padding:
            variant === 'page'
              ? pageBuilder?.hero.spacing === 'compact'
                ? '56px 24px 72px'
                : pageBuilder?.hero.spacing === 'spacious'
                  ? '88px 24px 104px'
                  : '72px 24px 88px'
              : viewportWidth < 700
                ? '34px 16px 18px'
                : '44px 24px 20px',
          width: '100%',
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: variant === 'page' ? 34 : 30,
            border: `1px solid ${border}`,
            background:
              variant === 'page' && pageBuilder?.hero.showBannerImage && pageBuilder.hero.bannerImage
                ? `linear-gradient(180deg, rgba(2,6,23,0.68), rgba(2,6,23,0.9)), url(${pageBuilder.hero.bannerImage}) center/cover no-repeat`
                : panel,
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
              padding: variant === 'page' ? '44px 34px 34px' : viewportWidth < 700 ? '24px 18px 20px' : '30px 24px 24px',
              display: 'grid',
              gap: variant === 'page' ? 24 : 0,
            }}
          >
            <div style={{ order: variant === 'page' ? pageBuilder?.hero.order || 10 : 10 }}>
              {(variant === 'page' ? pageBuilder?.hero.enabled ?? true : homepageConfig.showHeader) ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection:
                      variant === 'page'
                        ? isMobile || pageBuilder?.hero.layout !== 'split'
                          ? 'column'
                          : 'row'
                        : headerAlignment === 'center'
                          ? 'column'
                          : viewportWidth < 860
                            ? 'column'
                            : 'row',
                    alignItems:
                      variant === 'page'
                        ? pageBuilder?.hero.alignment === 'left'
                          ? 'flex-start'
                          : 'center'
                        : headerAlignment === 'center'
                          ? 'center'
                          : 'flex-end',
                    justifyContent: 'space-between',
                    gap: 20,
                    textAlign: variant === 'page' ? pageBuilder?.hero.alignment || 'center' : headerAlignment,
                    marginBottom: 28,
                  }}
                >
                  <div style={{ maxWidth: variant === 'page' ? 760 : 760 }}>
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
                            : 'clamp(1.9rem, 3vw, 3rem)',
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
                        maxWidth: variant === 'page' ? 680 : headerAlignment === 'center' ? 720 : 620,
                      }}
                    >
                      {sectionSubtitle}
                    </p>

                    {variant === 'page' && pageBuilder?.hero.showIntro && introText ? (
                      <p
                        style={{
                          margin: '14px 0 0',
                          color: dark ? 'rgba(226,232,240,0.76)' : '#475569',
                          fontSize: 15,
                          lineHeight: 1.8,
                          maxWidth: 720,
                        }}
                      >
                        {introText}
                      </p>
                    ) : null}
                  </div>

                  {(variant === 'homepage' && homepageConfig.showButton && buttonText && buttonLink) ||
                  (variant === 'page' &&
                    pageBuilder?.hero.showButton &&
                    pageBuilder.hero.buttonText &&
                    pageBuilder.hero.buttonLink) ? (
                    <Link
                      href={
                        variant === 'page'
                          ? pageBuilder?.hero.buttonLink || '/contact'
                          : buttonLink || '/portfolio'
                      }
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
                      {variant === 'page'
                        ? pageBuilder?.hero.buttonText || 'Contact Me'
                        : buttonText}
                      <span>→</span>
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div style={{ order: variant === 'page' ? pageBuilder?.showcase.order || 20 : 20 }}>
              {tabsVisible ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent:
                      variant === 'page'
                        ? 'center'
                        : headerAlignment === 'center'
                          ? 'center'
                          : 'flex-start',
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTabState(tab.key)}
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
                      padding: variant === 'page' ? '12px 18px' : viewportWidth < 700 ? '9px 13px' : '10px 16px',
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

              {filtersVisible ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent:
                      variant === 'page'
                        ? 'center'
                        : homepageConfig.filterAlignment === 'center'
                          ? 'center'
                          : 'flex-start',
                    gap: 10,
                    marginBottom: 28,
                  }}
                >
                {variant === 'page' || homepageConfig.showAllChip ? (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCategoryByTab(current => ({ ...current, [activeTab]: 'all' }))
                    }
                    style={{
                      background:
                        activeCategory === 'all'
                          ? dark
                            ? 'rgba(56,189,248,0.16)'
                            : 'rgba(14,165,233,0.14)'
                          : homepageConfig.filterChipStyle === 'editorial'
                            ? dark
                              ? 'rgba(15,23,42,0.4)'
                              : 'rgba(255,255,255,0.7)'
                            : 'transparent',
                      color: activeCategory === 'all' ? '#38bdf8' : muted,
                      border: `1px solid ${
                        activeCategory === 'all' ? 'rgba(56,189,248,0.36)' : soft
                      }`,
                      padding: viewportWidth < 700 ? '9px 13px' : '10px 16px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    সব ({tabItems.length})
                  </button>
                ) : null}
                {categoriesForTab.map(category => {
                  const count = tabItems.filter(item => item.categorySlug === category.slug).length;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setActiveCategoryByTab(current => ({
                          ...current,
                          [activeTab]: category.slug,
                        }))
                      }
                      style={{
                        background:
                          activeCategory === category.slug
                            ? dark
                              ? 'rgba(56,189,248,0.16)'
                              : 'rgba(14,165,233,0.14)'
                            : homepageConfig.filterChipStyle === 'editorial'
                              ? dark
                                ? 'rgba(15,23,42,0.4)'
                                : 'rgba(255,255,255,0.7)'
                              : 'transparent',
                        color: activeCategory === category.slug ? '#38bdf8' : muted,
                        border: `1px solid ${
                          activeCategory === category.slug ? 'rgba(56,189,248,0.36)' : soft
                        }`,
                        padding: viewportWidth < 700 ? '9px 13px' : '10px 16px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {category.displayName} ({count})
                    </button>
                  );
                })}
                </div>
              ) : null}

              {loading ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      variant === 'page'
                        ? `repeat(${columns}, minmax(0, 1fr))`
                        : `repeat(${columns}, minmax(0, 1fr))`,
                    gap: cardGap,
                  }}
                >
                {Array.from({ length: variant === 'page' ? 6 : Math.max(3, columns) }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      borderRadius: 24,
                      minHeight: variant === 'homepage' && homepageConfig.cardDensity === 'compact' ? 220 : 280,
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
                    : 'Homepage Portfolio Builder, Video Manager বা Graphics Manager থেকে selection control করুন।'}
                </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 24 }}>
                {groupedSections.map(section => (
                  <div key={section.label} style={{ display: 'grid', gap: 16 }}>
                    {shouldGroupAll && (variant === 'page' || homepageConfig.showGroupingLabels) ? (
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
                            ? `repeat(${columns}, minmax(0, 1fr))`
                            : `repeat(${columns}, minmax(0, 1fr))`,
                        gap: cardGap,
                      }}
                    >
                      {section.items.map((item, index) => {
                        const itemConfig =
                          variant === 'homepage'
                            ? getHomepageConfigForItem(item, homepageConfig.itemConfig)
                            : null;
                        const denseCard =
                          variant === 'homepage'
                            ? homepageConfig.cardDensity === 'compact' ||
                              (homepageConfig.mobileCompactMode && isMobile)
                            : pageBuilder?.showcase.density === 'compact';
                        const spaciousCard =
                          variant === 'homepage'
                            ? homepageConfig.cardDensity === 'spacious'
                            : pageBuilder?.showcase.density === 'spacious';
                        const featuredCard =
                          variant === 'homepage' &&
                          homepageConfig.layoutType === 'featured-first' &&
                          index === 0 &&
                          columns > 1;
                        const imagePadding =
                          variant === 'homepage' && homepageConfig.layoutType === 'compact-preview'
                            ? item.sourceType === 'graphic'
                              ? '66%'
                              : '52%'
                            : variant === 'homepage' && homepageConfig.layoutType === 'cinematic'
                              ? item.sourceType === 'graphic'
                                ? '82%'
                                : '64%'
                              : featuredCard
                                ? item.sourceType === 'graphic'
                                  ? '90%'
                                  : '72%'
                                : item.sourceType === 'graphic'
                                  ? '72%'
                                  : '60%';

                        return (
                          <button
                            key={getItemKey(item)}
                            type="button"
                            onClick={() => handleItemAction(item)}
                            style={{
                              textAlign: 'left',
                              padding: 0,
                              borderRadius: variant === 'homepage' && homepageConfig.layoutType === 'simple-preview' ? 18 : 24,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: `1px solid ${soft}`,
                              background: cardSurface,
                              boxShadow: dark
                                ? '0 24px 44px rgba(2,6,23,0.24)'
                                : '0 18px 32px rgba(15,23,42,0.08)',
                              transition: 'transform 0.2s ease, border-color 0.2s ease',
                              gridColumn:
                                featuredCard && variant === 'homepage'
                                  ? `span ${Math.min(2, columns)}`
                                  : undefined,
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
                            {variant === 'page' || homepageConfig.showThumbnail ? (
                              <div
                                style={{
                                  position: 'relative',
                                  paddingBottom: imagePadding,
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
                                      objectFit:
                                        item.sourceType === 'graphic' &&
                                        variant === 'homepage' &&
                                        homepageConfig.layoutType === 'simple-preview'
                                          ? 'contain'
                                          : 'cover',
                                    }}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: getCardOverlay(
                                      dark,
                                      homepageConfig,
                                      item,
                                      pageBuilder,
                                      variant
                                    ),
                                  }}
                                />
                                {(variant === 'page' || homepageConfig.showCategory) && (
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
                                )}
                                {(variant === 'page' || homepageConfig.showTypeBadge) && (
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
                                )}
                                {variant === 'homepage' &&
                                homepageConfig.showFeaturedBadge &&
                                itemConfig?.homepageFeatured ? (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: 14,
                                      bottom: 14,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 10px',
                                      borderRadius: 999,
                                      background: 'rgba(37,99,235,0.85)',
                                      color: '#fff',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: '0.06em',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    ✨ Featured
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            <div
                              style={{
                                padding:
                                  denseCard
                                    ? '16px 16px 15px'
                                    : spaciousCard
                                      ? '24px 22px 22px'
                                      : '20px 18px 18px',
                              }}
                            >
                              {(variant === 'page' || homepageConfig.showTitle) && (
                                <div
                                  style={{
                                    fontSize: denseCard ? 17 : 20,
                                    fontWeight: 800,
                                    color: text,
                                    lineHeight: 1.15,
                                    marginBottom: 10,
                                  }}
                                >
                                  {item.title}
                                </div>
                              )}

                              {(variant === 'page' || homepageConfig.showDescription) && item.description ? (
                                <p
                                  style={{
                                    margin: '0 0 14px',
                                    color: muted,
                                    fontSize: denseCard ? 13 : 14,
                                    lineHeight: 1.7,
                                  }}
                                >
                                  {item.description}
                                </p>
                              ) : null}

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: '#38bdf8',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                  }}
                                >
                                  {variant === 'homepage'
                                    ? homepageConfig.previewButtonLabel
                                    : item.sourceType === 'video'
                                      ? 'Play preview'
                                      : 'Open preview'}
                                </div>

                                {variant === 'homepage' && homepageConfig.showCardCta ? (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      color: text,
                                      fontSize: 13,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {homepageConfig.cardCtaText}
                                    {homepageConfig.showPreviewIcon ? <span>↗</span> : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                </div>
              )}

              {variant === 'homepage' &&
              homepageConfig.showViewAllButton &&
              homepageConfig.viewAllButtonText &&
              homepageConfig.viewAllButtonLink ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: homepageConfig.alignment === 'center' ? 'center' : 'flex-start',
                    marginTop: 28,
                  }}
                >
                <Link
                  href={homepageConfig.viewAllButtonLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    minHeight: 46,
                    padding: '12px 20px',
                    borderRadius: 14,
                    border: `1px solid ${soft}`,
                    background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.82)',
                    color: text,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {homepageConfig.viewAllButtonText}
                  <span>→</span>
                </Link>
                </div>
              ) : null}
            </div>

            <div style={{ order: variant === 'page' ? pageBuilder?.cta.order || 30 : 30 }}>
              {variant === 'page' && pageBuilder?.cta.enabled ? (
                <div
                  style={{
                    marginTop: 30,
                    paddingTop: 26,
                    borderTop: `1px solid ${soft}`,
                    display: 'grid',
                    justifyItems:
                      pageBuilder.cta.alignment === 'center' ? 'center' : 'stretch',
                    textAlign: pageBuilder.cta.alignment,
                  }}
                >
                {pageBuilder.cta.label ? (
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
                      }}
                    />
                    {pageBuilder.cta.label}
                  </div>
                ) : null}
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: isMobile ? 28 : 36,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: text,
                  }}
                >
                  {pageBuilder.cta.title}
                </h3>
                {pageBuilder.cta.description ? (
                  <p
                    style={{
                      margin: '0 0 20px',
                      maxWidth: 720,
                      color: muted,
                      fontSize: 15,
                      lineHeight: 1.8,
                    }}
                  >
                    {pageBuilder.cta.description}
                  </p>
                ) : null}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    justifyContent:
                      pageBuilder.cta.alignment === 'center'
                        ? 'center'
                        : 'flex-start',
                  }}
                >
                  {pageBuilder.cta.showPrimaryButton ? (
                    <Link
                      href={pageBuilder.cta.primaryButtonLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '13px 20px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      {pageBuilder.cta.primaryButtonText}
                      <span>→</span>
                    </Link>
                  ) : null}
                  {pageBuilder.cta.showSecondaryButton ? (
                    <Link
                      href={pageBuilder.cta.secondaryButtonLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '13px 20px',
                        borderRadius: 14,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.82)',
                        color: text,
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      {pageBuilder.cta.secondaryButtonText}
                    </Link>
                  ) : null}
                </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {activeSelectedItem ? (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.92)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: viewportWidth < 700 ? 14 : 24,
          }}
        >
          <div
            onClick={event => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: activeSelectedItem.sourceType === 'graphic' ? 1140 : 1080,
              background: dark
                ? 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,1) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.98) 100%)',
              borderRadius: 28,
              overflow: 'hidden',
              border: `1px solid ${border}`,
              boxShadow: dark
                ? '0 30px 90px rgba(0,0,0,0.55)'
                : '0 30px 90px rgba(15,23,42,0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: viewportWidth < 700 ? '14px 16px' : '18px 22px',
                borderBottom: `1px solid ${soft}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#38bdf8',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  {activeSelectedItem.sourceType === 'video' ? 'ভিডিও প্রিভিউ' : 'গ্রাফিক্স প্রিভিউ'}
                </div>
                <div style={{ fontSize: viewportWidth < 700 ? 18 : 20, fontWeight: 800, color: text }}>
                  {activeSelectedItem.title}
                </div>
                <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
                  {activeSelectedItem.categoryName}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {displayItems.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => goToSibling('prev')}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                      }}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => goToSibling('next')}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                      }}
                    >
                      →
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: `1px solid ${soft}`,
                    background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.84)',
                    color: text,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: viewportWidth < 700 ? 14 : 22 }}>
              {activeSelectedItem.sourceType === 'video' ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    borderRadius: 22,
                    overflow: 'hidden',
                    background: '#020617',
                  }}
                >
                  <iframe
                    src={getVideoPreviewUrl(activeSelectedItem.youtube_url)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
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
                    minHeight: viewportWidth < 700 ? 320 : 520,
                    maxHeight: '80vh',
                    borderRadius: 24,
                    overflow: 'hidden',
                    background: dark ? 'rgba(2,6,23,0.84)' : 'rgba(226,232,240,0.7)',
                    border: `1px solid ${soft}`,
                    padding: viewportWidth < 700 ? 12 : 18,
                  }}
                >
                  <img
                    src={activeSelectedItem.imageUrl}
                    alt={activeSelectedItem.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '72vh',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: 18,
                    }}
                  />
                </div>
              )}

              {activeSelectedItem.description ? (
                <p
                  style={{
                    margin: '16px 0 0',
                    color: muted,
                    fontSize: 14,
                    lineHeight: 1.75,
                  }}
                >
                  {activeSelectedItem.description}
                </p>
              ) : null}

              {showPreviewFooterLink ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                  <Link
                    href={previewFooterLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 18px',
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {homepageConfig.viewAllButtonText || 'Portfolio Page'}
                    <span>→</span>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
