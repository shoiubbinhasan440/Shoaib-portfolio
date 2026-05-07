'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import PortfolioPreviewModal from '@/components/portfolio/PortfolioPreviewModal';
import {
  getButtonAlignmentOverride,
  getButtonStyleOverrides,
  getCardSurfaceOverrides,
  getSectionPaddingOverride,
  getSectionSurfaceOverrides,
  getSectionWidthOverride,
  getTypographyStyleOverrides,
  resolveSectionThemeColor,
} from '@/lib/page-builder-styles';
import type {
  PortfolioPageBuilderConfig,
} from '@/lib/portfolio-page-content';
import {
  getPortfolioPageCategoryConfig,
  getPortfolioPageItemConfig,
} from '@/lib/portfolio-page-content';
import {
  getPortfolioItemDetailPath,
  getPortfolioItemMeta,
  DEFAULT_HOMEPAGE_PORTFOLIO_SETTINGS,
  getHomepageAllowedSourceTypes,
  getHomepageCategoryConfig,
  getHomepageConfigForItem,
  getPortfolioCategoriesForTab,
  getPortfolioItemsForTab,
  getPortfolioTabs,
  sortPortfolioItemsByOrder,
  type PortfolioCardInfoDensity,
  type HomepagePortfolioSectionSettings,
  type PortfolioCategory,
  type PortfolioItemMetaConfigMap,
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
  itemMetaConfig?: PortfolioItemMetaConfigMap;
  pageBuilder?: PortfolioPageBuilderConfig;
};

type ShowcaseCategory = PortfolioCategory & {
  displayName: string;
  displayOrder: number;
};

type HomepageCategoryPreviewGroup = {
  key: string;
  sourceType: PortfolioSourceType;
  slug: string;
  title: string;
  count: number;
  order: number;
  items: PortfolioPreviewItem[];
};

function getOrderedSourceTypes(order: PortfolioPageSettings['allTab']['order']) {
  return order === 'graphic-first'
    ? (['graphic', 'video'] as PortfolioSourceType[])
    : (['video', 'graphic'] as PortfolioSourceType[]);
}

function getItemKey(item: Pick<PortfolioPreviewItem, 'sourceType' | 'id'>) {
  return `${item.sourceType}:${item.id}`;
}

function getItemProjectKey(item: PortfolioPreviewItem, itemMetaConfig: PortfolioItemMetaConfigMap) {
  const meta = getPortfolioItemMeta(item, itemMetaConfig);
  return meta.projectVisible === false ? '' : meta.projectId.trim();
}

function toProjectDisplayItems(
  items: PortfolioPreviewItem[],
  itemMetaConfig: PortfolioItemMetaConfigMap
) {
  const grouped = new Map<string, PortfolioPreviewItem[]>();
  const ungrouped: PortfolioPreviewItem[] = [];

  items.forEach(item => {
    const projectKey = getItemProjectKey(item, itemMetaConfig);
    if (!projectKey) {
      const meta = getPortfolioItemMeta(item, itemMetaConfig);
      ungrouped.push({
        ...item,
        projectItems: [
          {
            id: getItemKey(item),
            title: item.title,
            imageUrl: item.imageUrl,
            sourceType: item.sourceType,
            youtube_url: item.youtube_url,
            description: item.description || '',
            categoryName: item.categoryName,
            formatLabel: meta.formatLabel,
          },
          ...meta.projectGallery,
        ],
      });
      return;
    }

    grouped.set(projectKey, [...(grouped.get(projectKey) || []), item]);
  });

  const projectItems = [...grouped.entries()].map(([projectKey, groupItems]) => {
    const sortedItems = [...groupItems].sort((leftItem, rightItem) => {
      const leftMeta = getPortfolioItemMeta(leftItem, itemMetaConfig);
      const rightMeta = getPortfolioItemMeta(rightItem, itemMetaConfig);
      const leftOrder = leftMeta.projectOrder || leftItem.order_num;
      const rightOrder = rightMeta.projectOrder || rightItem.order_num;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return leftItem.title.localeCompare(rightItem.title);
    });
    const coverItem = sortedItems[0];
    const coverMeta = getPortfolioItemMeta(coverItem, itemMetaConfig);
    const projectGallery = sortedItems.flatMap(groupItem => {
      const groupMeta = getPortfolioItemMeta(groupItem, itemMetaConfig);
      return [
        {
          id: getItemKey(groupItem),
          title: groupItem.title,
          imageUrl: groupItem.imageUrl,
          sourceType: groupItem.sourceType,
          youtube_url: groupItem.youtube_url,
          description: groupItem.description || '',
          categoryName: groupItem.categoryName,
          formatLabel: groupMeta.formatLabel,
        },
        ...groupMeta.projectGallery,
      ];
    });

    return {
      ...coverItem,
      id: coverItem.id,
      title: coverMeta.projectTitle || coverMeta.previewTitle || coverItem.title,
      description: coverMeta.projectDescription || coverItem.description,
      imageUrl: coverMeta.projectCoverImage || coverMeta.coverImage || coverItem.imageUrl,
      order_num: coverMeta.projectOrder || coverItem.order_num,
      projectId: projectKey,
      projectTitle: coverMeta.projectTitle || coverItem.title,
      projectCoverImage: coverMeta.projectCoverImage || coverItem.imageUrl,
      projectType: coverMeta.projectType,
      projectDescription: coverMeta.projectDescription,
      projectOrder: coverMeta.projectOrder,
      projectVisible: coverMeta.projectVisible,
      projectItems: projectGallery,
    } satisfies PortfolioPreviewItem;
  });

  return sortPortfolioItemsByOrder([...ungrouped, ...projectItems]);
}

function getCardInfoDensity(
  variant: PortfolioShowcaseProps['variant'],
  homepageConfig: HomepagePortfolioSectionSettings,
  pageBuilder?: PortfolioPageBuilderConfig
): PortfolioCardInfoDensity {
  return variant === 'homepage'
    ? homepageConfig.cardInfoDensity
    : pageBuilder?.showcase.cardInfoDensity || 'title-only';
}

function getSortedDisplayItems(items: PortfolioPreviewItem[], variant: PortfolioShowcaseProps['variant']) {
  if (variant === 'homepage') {
    return items;
  }

  return sortPortfolioItemsByOrder(items);
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
    return Math.min(2, mobileColumns);
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

  const mobileColumns =
    config.showcase.responsivePreset === 'compact'
      ? 1
      : Math.min(2, Math.max(1, config.showcase.mobileColumns));
  const tabletColumns =
    config.showcase.responsivePreset === 'showcase'
      ? Math.max(2, config.showcase.tabletColumns)
      : Math.max(1, config.showcase.tabletColumns);
  const desktopColumns = Math.max(1, config.showcase.desktopColumns);

  if (width < 700) {
    return mobileColumns;
  }

  if (width < 1080) {
    return tabletColumns;
  }

  return desktopColumns;
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
  itemMetaConfig = {},
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
  const [focusItemKey, setFocusItemKey] = useState('');
  const [hoverPreviewKey, setHoverPreviewKey] = useState('');
  const [smartShowcaseMode, setSmartShowcaseMode] = useState(false);

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
  const categoryPreviewMode =
    variant === 'homepage' && homepageConfig.displayMode === 'category-preview';
  const layoutMode =
    variant === 'homepage'
      ? homepageConfig.layoutMode
      : pageBuilder?.showcase.layoutMode || 'grid';
  const useMasonryLayout = layoutMode === 'masonry';

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

  const tabItems = (() => {
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
  })();

  const categoriesForTab: ShowcaseCategory[] = (() => {
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
      .filter(
        category =>
          (category.visibility_status ?? category.active ?? true) &&
          category.show_on_homepage !== false &&
          category.show_filter_chip !== false
      )
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
  })();

  const requestedCategory = activeCategoryByTab[activeTab] || 'all';
  const fallbackCategory =
    ((variant === 'homepage' && !homepageConfig.showAllChip) ||
      (variant === 'page' && pageBuilder?.showcase.showAllChip === false)) &&
    categoriesForTab.length > 0
      ? categoriesForTab[0].slug
      : 'all';
  const activeCategory =
    requestedCategory === 'all'
      ? fallbackCategory
      : categoriesForTab.some(category => category.slug === requestedCategory)
        ? requestedCategory
        : fallbackCategory;

  const filteredItems = (() => {
    const nextItems =
      activeCategory === 'all'
        ? tabItems
        : tabItems.filter(item => item.categorySlug === activeCategory);

    if (variant === 'homepage' && homepageConfig.maxRows > 0) {
      return nextItems.slice(0, columns * homepageConfig.maxRows);
    }

    return nextItems;
  })();

  const showcaseItems = (() => {
    if (variant !== 'page' || !smartShowcaseMode) {
      return filteredItems;
    }

    return [...filteredItems].sort((leftItem, rightItem) => {
      const leftMeta = getPortfolioItemMeta(leftItem, itemMetaConfig);
      const rightMeta = getPortfolioItemMeta(rightItem, itemMetaConfig);
      const leftScore =
        (leftMeta.smartShowcase ? 100 : 0) + (leftMeta.featuredPriority || 0);
      const rightScore =
        (rightMeta.smartShowcase ? 100 : 0) + (rightMeta.featuredPriority || 0);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (leftItem.order_num !== rightItem.order_num) {
        return leftItem.order_num - rightItem.order_num;
      }

      return leftItem.title.localeCompare(rightItem.title);
    });
  })();

  const projectDisplayItems = toProjectDisplayItems(showcaseItems, itemMetaConfig);

  const shouldGroupAll =
    activeTab === 'all' &&
    projectDisplayItems.some(item => item.sourceType === 'video') &&
    projectDisplayItems.some(item => item.sourceType === 'graphic');
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
          items: projectDisplayItems.filter(item => item.sourceType === sourceType),
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
          items: projectDisplayItems,
        },
      ];
  const displayItems = groupedSections.flatMap(section => section.items);
  const categoryPreviewGroups: HomepageCategoryPreviewGroup[] = useMemo(() => {
    if (!categoryPreviewMode) {
      return [];
    }

    const allowedSourceTypes = getHomepageAllowedSourceTypes(homepageConfig);
    const grouped = new Map<string, HomepageCategoryPreviewGroup>();

    items
      .filter(
        item =>
          item.visible &&
          item.categoryActive &&
          item.categoryShowOnHomepage &&
          item.categoryShowFilterChip &&
          item.categorySlug
      )
      .filter(item => allowedSourceTypes.includes(item.sourceType))
      .forEach(item => {
        const categorySlug = item.categorySlug || '';
        const category =
          categories.find(
            candidate =>
              candidate.slug === categorySlug &&
              candidate.type === item.sourceType &&
              candidate.show_on_homepage !== false
          ) ||
          categories.find(
            candidate =>
              candidate.slug === categorySlug &&
              candidate.type === 'both' &&
              candidate.show_on_homepage !== false
          );
        const categoryConfig = getHomepageCategoryConfig(
          {
            categorySlug,
            categoryType: category?.type || item.categoryType || item.sourceType,
            categoryName: category?.name || item.categoryName,
            order_num: category?.order_num || item.order_num,
          },
          homepageConfig.categoryConfig
        );

        if (!categoryConfig.enabled) {
          return;
        }

        const key = `${item.sourceType}:${categorySlug}`;
        const current = grouped.get(key);
        if (current) {
          current.items.push(item);
          current.count += 1;
          return;
        }

        grouped.set(key, {
          key,
          sourceType: item.sourceType,
          slug: categorySlug,
          title: categoryConfig.label,
          count: 1,
          order: categoryConfig.order,
          items: [item],
        });
      });

    const typeOrder = new Map(
      getHomepageAllowedSourceTypes(homepageConfig).map((sourceType, index) => [
        sourceType,
        index,
      ])
    );

    return [...grouped.values()]
      .map(group => ({
        ...group,
        items: sortPortfolioItemsByOrder(group.items),
      }))
      .sort((leftGroup, rightGroup) => {
        const leftTypeOrder = typeOrder.get(leftGroup.sourceType) ?? 99;
        const rightTypeOrder = typeOrder.get(rightGroup.sourceType) ?? 99;

        if (leftTypeOrder !== rightTypeOrder) {
          return leftTypeOrder - rightTypeOrder;
        }

        if (leftGroup.order !== rightGroup.order) {
          return leftGroup.order - rightGroup.order;
        }

        return leftGroup.title.localeCompare(rightGroup.title);
      })
      .slice(0, homepageConfig.maxCategories);
  }, [categories, categoryPreviewMode, homepageConfig, items]);
  const activeSelectedItem =
    selectedItem && displayItems.some(item => getItemKey(item) === getItemKey(selectedItem))
      ? selectedItem
      : null;
  const focusedItem = displayItems.find(item => getItemKey(item) === focusItemKey) || null;

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const reportOverflow = () => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;

      console.log('[portfolio-overflow]', { scrollWidth, innerWidth });

      if (scrollWidth <= innerWidth) {
        return;
      }

      let widestElement: HTMLElement | null = null;
      let widestOverflow = 0;

      document.querySelectorAll<HTMLElement>('body *').forEach(element => {
        const rect = element.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
          return;
        }

        const overflowAmount = Math.max(
          rect.right - innerWidth,
          -rect.left,
          rect.width - innerWidth,
          0
        );

        if (overflowAmount > widestOverflow) {
          widestOverflow = overflowAmount;
          widestElement = element;
        }
      });

      if (widestElement) {
        const elementForLog = widestElement as HTMLElement;
        console.log('[portfolio-overflow] widest overflowing element', widestElement, {
          overflowAmount: widestOverflow,
          rect: elementForLog.getBoundingClientRect(),
        });
      }
    };

    const timeoutId = window.setTimeout(reportOverflow, 0);
    window.addEventListener('resize', reportOverflow);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', reportOverflow);
    };
  }, [
    activeCategory,
    activeTab,
    categoryPreviewGroups.length,
    displayItems.length,
    smartShowcaseMode,
  ]);

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
      : !categoryPreviewMode &&
        homepageConfig.showCategoryFilters &&
        categoriesForTab.length > 0 &&
        (!isMobile || homepageConfig.mobileFilterVisibility);
  const tabsVisible =
    variant === 'page'
      ? (pageBuilder?.showcase.showTabs ?? true) && tabs.length > 1
      : !categoryPreviewMode &&
        homepageConfig.showTabs &&
        tabs.length > 1 &&
        (!isMobile || homepageConfig.mobileFilterVisibility);
  const previewFooterLink =
    variant === 'homepage'
      ? homepageConfig.viewAllButtonLink || homepageConfig.buttonLink || '/portfolio'
      : '/portfolio';
  const showPreviewFooterLink =
    variant === 'homepage' &&
    homepageConfig.clickAction === 'preview-with-link' &&
    homepageConfig.showViewAllButton;
  const heroStyles = variant === 'page' ? pageBuilder?.hero.styles : homepageConfig.styles;
  const showcaseStyles =
    variant === 'page' ? pageBuilder?.showcase.styles : homepageConfig.styles;
  const ctaStyles = variant === 'page' ? pageBuilder?.cta.styles : homepageConfig.styles;
  const heroButtonStyle = getButtonStyleOverrides(heroStyles, {
    dark,
    fallbackBackground: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
    fallbackColor: '#fff',
    fallbackBorder: soft,
    fallbackShadow: '0 18px 40px rgba(37,99,235,0.22)',
  });
  const secondaryButtonStyle = getButtonStyleOverrides(ctaStyles, {
    dark,
    fallbackBackground: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.82)',
    fallbackColor: text,
    fallbackBorder: soft,
    fallbackShadow: 'none',
  });
  const cardStyleOverrides = getCardSurfaceOverrides(showcaseStyles, {
    dark,
    fallbackBackground: cardSurface,
    fallbackBorder: soft,
    fallbackShadow: dark
      ? '0 24px 44px rgba(2,6,23,0.24)'
      : '0 18px 32px rgba(15,23,42,0.08)',
  });
  const pageShowcaseConfig = pageBuilder?.showcase;
  const showcaseGap = isMobile ? 12 : showcaseStyles?.card.gap || cardGap;
  const cardInfoDensity = getCardInfoDensity(variant, homepageConfig, pageBuilder);
  const showCardMeta = cardInfoDensity !== 'title-only';
  const showFullCardDetails = cardInfoDensity === 'full';
  const safeColumnCount = isMobile
    ? viewportWidth < 390
      ? 1
      : Math.min(2, Math.max(1, columns))
    : Math.max(1, columns);
  const safeGridTemplate = `repeat(${safeColumnCount}, minmax(0, 1fr))`;
  const useDesktopMasonry = useMasonryLayout;
  const masonryColumns = useDesktopMasonry ? safeColumnCount : undefined;
  const showcaseFilterAlignment =
    variant === 'page'
      ? pageShowcaseConfig?.filterAlignment || 'center'
      : homepageConfig.filterAlignment;
  const showcaseFilterChipStyle =
    variant === 'page'
      ? pageShowcaseConfig?.filterChipStyle || 'glass'
      : homepageConfig.filterChipStyle;
  const showAllCategoryChip =
    variant === 'page' ? pageShowcaseConfig?.showAllChip ?? true : homepageConfig.showAllChip;
  const showGroupingLabels =
    variant === 'page'
      ? pageShowcaseConfig?.showGroupingLabels ?? false
      : homepageConfig.showGroupingLabels;
  const showCardThumbnail =
    variant === 'page' ? pageShowcaseConfig?.showThumbnail ?? true : homepageConfig.showThumbnail;
  const showCardTitle =
    variant === 'page' ? pageShowcaseConfig?.showTitle ?? true : homepageConfig.showTitle;
  const showCardCategory =
    variant === 'page' ? pageShowcaseConfig?.showCategory ?? true : homepageConfig.showCategory;
  const showCardDescription =
    variant === 'page'
      ? pageShowcaseConfig?.showDescription ?? false
      : homepageConfig.showDescription;
  const showCardTypeBadge =
    variant === 'page' ? pageShowcaseConfig?.showTypeBadge ?? true : homepageConfig.showTypeBadge;
  const showCardCta =
    variant === 'page' ? pageShowcaseConfig?.showCardCta ?? true : homepageConfig.showCardCta;
  const cardCtaText =
    variant === 'page'
      ? pageShowcaseConfig?.cardCtaText || 'Open Preview'
      : homepageConfig.cardCtaText;
  const showPreviewIcon =
    variant === 'page'
      ? pageShowcaseConfig?.showPreviewIcon ?? true
      : homepageConfig.showPreviewIcon;
  const showFeaturedBadge =
    variant === 'page'
      ? pageShowcaseConfig?.showFeaturedBadge ?? true
      : homepageConfig.showFeaturedBadge;
  const showHoverOverlay =
    variant === 'page'
      ? pageShowcaseConfig?.showHoverOverlay ?? true
      : homepageConfig.showHoverOverlay;
  const mobileChipScrollerStyle = isMobile
    ? ({
        contain: 'inline-size' as const,
        boxSizing: 'border-box' as const,
        width: '100%',
        maxWidth: '100%',
        maxInlineSize: '100%',
        minWidth: 0,
        overflowX: 'auto' as const,
        overflowY: 'hidden' as const,
        overscrollBehaviorX: 'contain' as const,
        WebkitOverflowScrolling: 'touch' as const,
        scrollbarWidth: 'none' as const,
        flexWrap: 'nowrap' as const,
        justifyContent: 'flex-start',
        whiteSpace: 'nowrap' as const,
        paddingBottom: 4,
      })
    : {};
  const mobileChipButtonStyle = isMobile
    ? ({
        flex: '0 0 auto',
        boxSizing: 'border-box' as const,
        maxWidth: 'min(100%, calc(100vw - 32px))',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      })
    : {};

  function handleItemAction(item: PortfolioPreviewItem) {
    if (variant === 'page') {
      if (pageShowcaseConfig?.enablePreviewModal === false) {
        router.push(getPortfolioItemDetailPath(item, getPortfolioItemMeta(item, itemMetaConfig)));
        return;
      }

      setSelectedItem(item);
      return;
    }

    const itemConfig = getHomepageConfigForItem(item, homepageConfig.itemConfig);
    const canPreview = homepageConfig.enablePreviewModal && itemConfig.previewEnabled;

    if (canPreview) {
      setSelectedItem(item);
      return;
    }

    router.push(previewFooterLink);
  }

  return (
    <>
      <section
        className="portfolio-showcase-section"
        style={{
          boxSizing: 'border-box',
          maxWidth: isMobile
            ? '100%'
            : getSectionWidthOverride(
                heroStyles?.layout.width || 'default',
                getSectionMaxWidth(variant, homepageConfig, pageBuilder)
              ),
          margin: '0 auto',
          padding: isMobile
            ? variant === 'page'
              ? '36px 12px 110px'
              : '30px 12px 20px'
            : getSectionPaddingOverride(
                heroStyles?.layout.padding || 'default',
                isMobile,
                variant === 'page'
                  ? pageBuilder?.hero.spacing === 'compact'
                    ? '56px 24px 72px'
                    : pageBuilder?.hero.spacing === 'spacious'
                      ? '88px 24px 104px'
                      : '72px 24px 88px'
                  : '44px 24px 20px'
              ),
          width: '100%',
          maxInlineSize: '100%',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            borderRadius: isMobile ? 22 : variant === 'page' ? 34 : 30,
            border: `1px solid ${border}`,
            background:
              variant === 'page' && pageBuilder?.hero.showBannerImage && pageBuilder.hero.bannerImage
                ? `linear-gradient(180deg, rgba(2,6,23,0.68), rgba(2,6,23,0.9)), url(${pageBuilder.hero.bannerImage}) center/cover no-repeat`
                : panel,
            boxShadow: dark
              ? '0 30px 100px rgba(2,6,23,0.32)'
              : '0 30px 100px rgba(15,23,42,0.12)',
            ...getSectionSurfaceOverrides(heroStyles, {
              dark,
              fallbackBackground:
                variant === 'page' && pageBuilder?.hero.showBannerImage && pageBuilder.hero.bannerImage
                  ? `linear-gradient(180deg, rgba(2,6,23,0.68), rgba(2,6,23,0.9)), url(${pageBuilder.hero.bannerImage}) center/cover no-repeat`
                  : panel,
              fallbackBorder: border,
            }),
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
          {focusedItem ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, rgba(2,6,23,0.78), rgba(2,6,23,0.42)), url(${focusedItem.imageUrl}) center/cover no-repeat`,
                opacity: 0.22,
                filter: 'blur(18px)',
                transform: 'scale(1.08)',
                pointerEvents: 'none',
              }}
            />
          ) : null}

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              padding: isMobile
                ? '22px 14px 18px'
                : variant === 'page'
                  ? '44px 34px 34px'
                  : '30px 24px 24px',
              display: 'grid',
              gap: variant === 'page' ? 24 : 0,
            }}
            className="portfolio-showcase-content"
          >
            <div
              style={{
                order: variant === 'page' ? pageBuilder?.hero.order || 10 : 10,
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflowX: 'hidden',
              }}
            >
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
                    minWidth: 0,
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: variant === 'page' ? 760 : 760,
                      minWidth: 0,
                      width: '100%',
                      overflowWrap: 'anywhere',
                    }}
                  >
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
                          ...getTypographyStyleOverrides(
                            'label',
                            heroStyles?.typography.label,
                            {
                              dark,
                              isMobile,
                              fallbackColor: resolveSectionThemeColor(
                                heroStyles?.colors.accentLight || '',
                                heroStyles?.colors.accentDark || '',
                                dark,
                                '#38bdf8'
                              ),
                              fallbackTextAlign:
                                variant === 'page'
                                  ? pageBuilder?.hero.alignment || 'center'
                                  : headerAlignment,
                              fallbackFontWeight: 700,
                              fallbackLetterSpacing: '0.12em',
                            }
                          ),
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
                        maxWidth: '100%',
                        overflowWrap: 'anywhere',
                        ...getTypographyStyleOverrides(
                          'title',
                          heroStyles?.typography.title,
                          {
                            dark,
                            isMobile,
                            fallbackColor: text,
                            fallbackTextAlign:
                              variant === 'page'
                                ? pageBuilder?.hero.alignment || 'center'
                                : headerAlignment,
                            fallbackFontWeight: 800,
                            fallbackLineHeight: 1.05,
                            fallbackLetterSpacing: '-0.05em',
                          }
                        ),
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
                        overflowWrap: 'anywhere',
                        ...getTypographyStyleOverrides(
                          'subtitle',
                          heroStyles?.typography.subtitle,
                          {
                            dark,
                            isMobile,
                            fallbackColor: muted,
                            fallbackTextAlign:
                              variant === 'page'
                                ? pageBuilder?.hero.alignment || 'center'
                                : headerAlignment,
                            fallbackLineHeight: 1.85,
                          }
                        ),
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
                          overflowWrap: 'anywhere',
                          ...getTypographyStyleOverrides(
                            'body',
                            heroStyles?.typography.body,
                            {
                              dark,
                              isMobile,
                              fallbackColor: dark ? 'rgba(226,232,240,0.76)' : '#475569',
                              fallbackTextAlign: pageBuilder?.hero.alignment || 'center',
                              fallbackLineHeight: 1.8,
                            }
                          ),
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
                        boxSizing: 'border-box',
                        minHeight: 48,
                        width: isMobile ? '100%' : undefined,
                        maxWidth: '100%',
                        padding: '13px 22px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 700,
                        boxShadow: '0 18px 40px rgba(37,99,235,0.22)',
                        flexShrink: 0,
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        ...heroButtonStyle,
                        ...getTypographyStyleOverrides(
                          'button',
                          heroStyles?.typography.button,
                          {
                            dark,
                            isMobile,
                            fallbackColor: '#fff',
                            fallbackFontWeight: 700,
                          }
                        ),
                      }}
                    >
                      {variant === 'page'
                        ? pageBuilder?.hero.buttonText || 'Contact Me'
                        : buttonText}
                      {heroStyles?.buttons.showIcon !== false ? <span>→</span> : null}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div
              style={{
                order: variant === 'page' ? pageBuilder?.showcase.order || 20 : 20,
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflowX: 'hidden',
              }}
            >
              {tabsVisible ? (
                <div
                  className="portfolio-chip-scroller"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent:
                      variant === 'page'
                        ? showcaseFilterAlignment === 'center'
                          ? 'center'
                          : 'flex-start'
                        : headerAlignment === 'center'
                          ? 'center'
                          : 'flex-start',
                    gap: 10,
                    marginBottom: 18,
                    ...mobileChipScrollerStyle,
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
                      ...mobileChipButtonStyle,
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
                  className="portfolio-chip-scroller"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent:
                      showcaseFilterAlignment === 'center'
                          ? 'center'
                          : 'flex-start',
                    gap: 10,
                    marginBottom: 28,
                    ...mobileChipScrollerStyle,
                  }}
                >
                {showAllCategoryChip ? (
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
                          : showcaseFilterChipStyle === 'editorial'
                            ? dark
                              ? 'rgba(15,23,42,0.4)'
                              : 'rgba(255,255,255,0.7)'
                            : 'transparent',
                      border: `1px solid ${
                        activeCategory === 'all' ? 'rgba(56,189,248,0.36)' : soft
                      }`,
                      padding: viewportWidth < 700 ? '9px 13px' : '10px 16px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        activeCategory === 'all'
                          ? resolveSectionThemeColor(
                              showcaseStyles?.colors.accentLight || '',
                              showcaseStyles?.colors.accentDark || '',
                              dark,
                              '#38bdf8'
                            )
                          : muted,
                      ...mobileChipButtonStyle,
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
                            : showcaseFilterChipStyle === 'editorial'
                              ? dark
                                ? 'rgba(15,23,42,0.4)'
                                : 'rgba(255,255,255,0.7)'
                              : 'transparent',
                        border: `1px solid ${
                          activeCategory === category.slug ? 'rgba(56,189,248,0.36)' : soft
                        }`,
                        padding: viewportWidth < 700 ? '9px 13px' : '10px 16px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          activeCategory === category.slug
                            ? resolveSectionThemeColor(
                                showcaseStyles?.colors.accentLight || '',
                                showcaseStyles?.colors.accentDark || '',
                                dark,
                                '#38bdf8'
                              )
                            : muted,
                        ...mobileChipButtonStyle,
                      }}
                    >
                      {category.displayName} ({count})
                    </button>
                  );
                })}
                </div>
              ) : null}

              {variant === 'page' ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    flexDirection: isMobile ? 'column' : 'row',
                    marginBottom: 22,
                    minWidth: 0,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      color: muted,
                      fontSize: 13,
                      minWidth: 0,
                      width: isMobile ? '100%' : undefined,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    Smart showcase highlights curated work with larger cards and smoother browsing.
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmartShowcaseMode(current => !current)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 999,
                      border: `1px solid ${
                        smartShowcaseMode ? 'rgba(56,189,248,0.36)' : soft
                      }`,
                      background: smartShowcaseMode
                        ? 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.18))'
                        : dark
                          ? 'rgba(15,23,42,0.5)'
                          : 'rgba(255,255,255,0.76)',
                      color: smartShowcaseMode ? '#38bdf8' : text,
                      cursor: 'pointer',
                      fontWeight: 700,
                      maxWidth: '100%',
                      width: isMobile ? '100%' : undefined,
                      justifyContent: 'center',
                      whiteSpace: 'normal',
                    }}
                  >
                    <span>{smartShowcaseMode ? 'Smart Showcase On' : 'Smart Showcase Off'}</span>
                    <span>{smartShowcaseMode ? '●' : '○'}</span>
                  </button>
                </div>
              ) : null}

              {loading ? (
                <div
                  className={`portfolio-showcase-grid ${useDesktopMasonry ? 'portfolio-showcase-masonry' : ''}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: safeGridTemplate,
                    gap: showcaseGap,
                    boxSizing: 'border-box',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflowX: 'clip',
                  }}
                >
                {Array.from({ length: variant === 'page' ? 6 : Math.max(3, safeColumnCount) }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      borderRadius: 24,
                      minHeight: variant === 'homepage' && homepageConfig.cardDensity === 'compact' ? 220 : 280,
                      minWidth: 0,
                      border: `1px solid ${soft}`,
                      background: cardSurface,
                    }}
                  />
                ))}
                </div>
              ) : categoryPreviewMode ? (
                categoryPreviewGroups.length === 0 ? (
                  <div
                    style={{
                      padding: '54px 24px',
                      borderRadius: 24,
                      border: `1px dashed ${soft}`,
                      background: dark ? 'rgba(2,6,23,0.28)' : 'rgba(255,255,255,0.78)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: text,
                        marginBottom: 8,
                      }}
                    >
                      Homepage category preview-র জন্য কোনো category পাওয়া যায়নি
                    </div>
                    <div style={{ fontSize: 14, color: muted }}>
                      Category visibility, content type, বা item visibility settings চেক করুন।
                    </div>
                  </div>
                ) : (
                  <div
                    className={`portfolio-showcase-grid ${useDesktopMasonry ? 'portfolio-showcase-masonry' : ''}`}
                    style={{
                      display: useDesktopMasonry ? 'block' : 'grid',
                      gridTemplateColumns: useDesktopMasonry
                        ? undefined
                        : safeGridTemplate,
                      gridAutoRows: !useDesktopMasonry && isMobile ? '1fr' : undefined,
                      gap: useDesktopMasonry ? undefined : showcaseGap,
                      columnCount: useDesktopMasonry ? masonryColumns : undefined,
                      columnGap: useDesktopMasonry ? showcaseGap : undefined,
                      columnFill: useDesktopMasonry ? 'balance' : undefined,
                      boxSizing: 'border-box',
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      overflowX: 'clip',
                    }}
                  >
                    {categoryPreviewGroups.map(group => {
                      const previewItems = group.items.slice(0, homepageConfig.thumbnailsPerCategory);
                      const typeLabel = group.sourceType === 'video' ? 'Video' : 'Graphics';
                      const accentColor = resolveSectionThemeColor(
                        showcaseStyles?.colors.accentLight || '',
                        showcaseStyles?.colors.accentDark || '',
                        dark,
                        '#38bdf8'
                      );
                      return (
                        <Link
                          className="portfolio-showcase-card"
                          key={group.key}
                          href={`/portfolio/category/${group.sourceType === 'graphic' ? 'graphics' : group.sourceType}/${encodeURIComponent(group.slug)}`}
                          style={{
                            position: 'relative',
                            display: 'grid',
                            gap: 16,
                            boxSizing: 'border-box',
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                            minHeight: homepageConfig.cardDensity === 'compact' ? 300 : 360,
                            breakInside: useDesktopMasonry ? 'avoid' : undefined,
                            pageBreakInside: useDesktopMasonry ? 'avoid' : undefined,
                            marginBottom: useDesktopMasonry ? showcaseGap : undefined,
                            padding: isMobile ? 16 : 18,
                            borderRadius: 24,
                            overflow: 'hidden',
                            textDecoration: 'none',
                            color: text,
                            border: `1px solid ${soft}`,
                            background: cardSurface,
                            boxShadow: dark
                              ? '0 24px 44px rgba(2,6,23,0.24)'
                              : '0 18px 32px rgba(15,23,42,0.08)',
                            transition:
                              'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
                            ...cardStyleOverrides,
                          }}
                          onMouseEnter={() => setFocusItemKey(group.key)}
                          onMouseLeave={() =>
                            setFocusItemKey(currentKey =>
                              currentKey === group.key ? '' : currentKey
                            )
                          }
                          onFocus={() => setFocusItemKey(group.key)}
                          onBlur={() =>
                            setFocusItemKey(currentKey =>
                              currentKey === group.key ? '' : currentKey
                            )
                          }
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                previewItems.length > 1
                                  ? 'minmax(0, 1.15fr) minmax(0, 0.85fr)'
                                  : 'minmax(0, 1fr)',
                              gap: 8,
                              minHeight: isMobile ? 170 : 210,
                              width: '100%',
                              minWidth: 0,
                              maxWidth: '100%',
                            }}
                          >
                            {previewItems[0] ? (
                              <div
                                className="portfolio-showcase-media"
                                style={{
                                  position: 'relative',
                                  overflow: 'hidden',
                                  width: '100%',
                                  maxWidth: '100%',
                                  minWidth: 0,
                                  borderRadius: 18,
                                  background: previewItems[0].sourceType === 'graphic'
                                    ? dark
                                      ? '#020617'
                                      : '#e2e8f0'
                                    : dark
                                      ? '#0f172a'
                                      : '#dbeafe',
                                }}
                              >
                                {previewItems[0].sourceType === 'graphic' ? (
                                  <img
                                    src={previewItems[0].imageUrl}
                                    alt={previewItems[0].title}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'block',
                                      width: '100%',
                                      height: '100%',
                                      maxWidth: '100%',
                                      objectFit: 'contain',
                                      objectPosition: 'center',
                                      padding: isMobile ? 6 : 10,
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={previewItems[0].imageUrl}
                                    alt={previewItems[0].title}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'block',
                                      width: '100%',
                                      height: '100%',
                                      maxWidth: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                )}
                              </div>
                            ) : null}
                            {previewItems.length > 1 ? (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    previewItems.length > 3
                                      ? 'repeat(2, minmax(0, 1fr))'
                                      : 'minmax(0, 1fr)',
                                  gap: 8,
                                  width: '100%',
                                  minWidth: 0,
                                  maxWidth: '100%',
                                }}
                              >
                                {previewItems.slice(1, 6).map(item => (
                                  <div
                                    key={getItemKey(item)}
                                    style={{
                                      position: 'relative',
                                      minHeight: 0,
                                      width: '100%',
                                      maxWidth: '100%',
                                      minWidth: 0,
                                      borderRadius: 16,
                                      overflow: 'hidden',
                                      background: item.sourceType === 'graphic'
                                        ? dark
                                          ? '#020617'
                                          : '#e2e8f0'
                                        : dark
                                          ? '#0f172a'
                                          : '#dbeafe',
                                    }}
                                  >
                                    {item.sourceType === 'graphic' ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'block',
                                          width: '100%',
                                          height: '100%',
                                          maxWidth: '100%',
                                          objectFit: 'contain',
                                          objectPosition: 'center',
                                          padding: 6,
                                        }}
                                      />
                                    ) : (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'block',
                                          width: '100%',
                                          height: '100%',
                                          maxWidth: '100%',
                                          objectFit: 'cover',
                                        }}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
                            <div
                              style={{
                                display: showCardMeta ? 'flex' : 'none',
                                gap: 8,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderRadius: 999,
                                  background:
                                    group.sourceType === 'video'
                                      ? 'rgba(59,130,246,0.16)'
                                      : 'rgba(16,185,129,0.16)',
                                  color:
                                    group.sourceType === 'video' ? '#93c5fd' : '#6ee7b7',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {typeLabel}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderRadius: 999,
                                  background: dark
                                    ? 'rgba(15,23,42,0.58)'
                                    : 'rgba(226,232,240,0.82)',
                                  color: muted,
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                {group.count} item{group.count > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: homepageConfig.cardDensity === 'compact' ? 20 : 24,
                                fontWeight: 900,
                                color: text,
                                lineHeight: 1.1,
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                              }}
                            >
                              {group.title}
                            </div>
                            <div
                              style={{
                                display: showCardMeta ? 'flex' : 'none',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 12,
                                color: accentColor,
                                fontSize: 12,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                              }}
                            >
                              <span>সব দেখুন</span>
                              <span>↗</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )
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
                <div
                  style={{
                    display: 'grid',
                    gap: isMobile ? 16 : 24,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                  }}
                >
                {groupedSections.map(section => (
                  <div
                    key={section.label}
                    style={{
                      display: 'grid',
                      gap: isMobile ? 12 : 16,
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    {shouldGroupAll && showGroupingLabels ? (
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
                      className={`portfolio-showcase-grid ${useDesktopMasonry ? 'portfolio-showcase-masonry' : ''}`}
                      style={{
                        display: useDesktopMasonry ? 'block' : 'grid',
                        gridTemplateColumns: useDesktopMasonry
                          ? undefined
                          : safeGridTemplate,
                        gridAutoRows: !useDesktopMasonry && isMobile ? '1fr' : undefined,
                        gap: useDesktopMasonry ? undefined : showcaseGap,
                        columnCount: useDesktopMasonry ? masonryColumns : undefined,
                        columnGap: useDesktopMasonry ? showcaseGap : undefined,
                        columnFill: useDesktopMasonry ? 'balance' : undefined,
                        boxSizing: 'border-box',
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        overflowX: 'clip',
                      }}
                    >
                      {section.items.map((item, index) => {
                        const itemConfig =
                          variant === 'homepage'
                            ? getHomepageConfigForItem(item, homepageConfig.itemConfig)
                            : null;
                        const pageItemConfig =
                          variant === 'page'
                            ? getPortfolioPageItemConfig(item, pageBuilder?.itemConfig || {})
                            : null;
                        const itemMeta = getPortfolioItemMeta(item, itemMetaConfig);
                        const denseCard =
                          variant === 'homepage'
                            ? homepageConfig.cardDensity === 'compact' ||
                              (homepageConfig.mobileCompactMode && isMobile)
                            : pageBuilder?.showcase.density === 'compact' ||
                              Boolean(pageShowcaseConfig?.mobileCompactMode && isMobile);
                        const spaciousCard =
                          variant === 'homepage'
                            ? homepageConfig.cardDensity === 'spacious'
                            : pageBuilder?.showcase.density === 'spacious';
                        const featuredCard =
                          variant === 'homepage' &&
                          homepageConfig.layoutType === 'featured-first' &&
                          index === 0 &&
                          safeColumnCount > 1;
                        const smartLeadCard =
                          variant === 'page' &&
                          smartShowcaseMode &&
                          safeColumnCount > 1 &&
                          index === 0 &&
                          (itemMeta.smartShowcase || itemMeta.featuredPriority > 0);
                        const focusKey = getItemKey(item);
                        const focusMatch = focusItemKey === focusKey;
                        const dimmed = showHoverOverlay && Boolean(focusedItem) && !focusMatch;
                        const hasStoryView = Object.values(itemMeta.story || {}).some(value =>
                          Boolean(value?.trim())
                        );
                        const itemPreviewEnabled =
                          variant === 'page'
                            ? (pageShowcaseConfig?.enablePreviewModal ?? true) &&
                              (pageItemConfig?.previewEnabled ?? true)
                            : (itemConfig?.previewEnabled ?? true);
                        const previewLabel =
                          itemMeta.cardCtaLabel ||
                          (variant === 'homepage'
                            ? homepageConfig.previewButtonLabel
                            : itemPreviewEnabled
                              ? item.sourceType === 'video'
                                ? 'Play preview'
                                : 'Open preview'
                              : item.sourceType === 'video'
                                ? 'Open video'
                                : 'Open artwork');
                        const displayPreviewLabel =
                          variant === 'page'
                            ? pageShowcaseConfig?.previewButtonLabel || previewLabel
                            : previewLabel;
                        const leadCard = featuredCard || smartLeadCard;
                        const imagePadding =
                          variant === 'homepage' && homepageConfig.layoutType === 'compact-preview'
                            ? item.sourceType === 'graphic'
                              ? '66%'
                              : '52%'
                            : variant === 'homepage' && homepageConfig.layoutType === 'cinematic'
                              ? item.sourceType === 'graphic'
                                ? '82%'
                                : '64%'
                              : leadCard
                                ? item.sourceType === 'graphic'
                                  ? '90%'
                                  : '72%'
                                : item.sourceType === 'graphic'
                                  ? '72%'
                                  : '60%';
                        const mobileMediaHeight =
                          viewportWidth <= 640 ? (leadCard ? 240 : 220) : leadCard ? 180 : 170;
                        const masonryVideoHeight =
                          variant === 'homepage'
                            ? isMobile
                              ? index % 3 === 1
                                ? 156
                                : 178
                              : [210, 250, 190, 230][index % 4]
                            : isMobile
                              ? 190
                              : [260, 320, 230, 290][index % 4];
                        const graphicFrameBackground = dark ? '#020617' : '#e2e8f0';
                        const masonryGraphicMaxHeight = isMobile ? 260 : 440;
                        const mediaObjectFit =
                          item.sourceType === 'graphic'
                            ? isMobile ||
                              (variant === 'homepage' &&
                                homepageConfig.layoutType === 'simple-preview')
                              ? 'contain'
                              : 'cover'
                            : 'cover';
                        const accentColor = resolveSectionThemeColor(
                          showcaseStyles?.colors.accentLight || '',
                          showcaseStyles?.colors.accentDark || '',
                          dark,
                          '#38bdf8'
                        );
                        const visibleTags: string[] = itemMeta.showTags
                          ? itemMeta.tags.slice(0, 3)
                          : [];
                        const showHoverVideoPreview =
                          showHoverOverlay &&
                          !isMobile &&
                          focusMatch &&
                          item.sourceType === 'video' &&
                          Boolean(item.youtube_url);

                        return (
                          <button
                            className="portfolio-showcase-card"
                            key={focusKey}
                            type="button"
                            aria-label={`Open preview for ${item.title}`}
                            onClick={() => handleItemAction(item)}
                            onMouseEnter={() => {
                              setFocusItemKey(focusKey);
                              setHoverPreviewKey(focusKey);
                            }}
                            onMouseLeave={() =>
                              {
                                setHoverPreviewKey(currentKey =>
                                  currentKey === focusKey ? '' : currentKey
                                );
                                setFocusItemKey(currentKey =>
                                  currentKey === focusKey ? '' : currentKey
                                );
                              }
                            }
                            onFocus={() => setFocusItemKey(focusKey)}
                            onBlur={() =>
                              setFocusItemKey(currentKey =>
                                currentKey === focusKey ? '' : currentKey
                              )
                            }
                            style={{
                              textAlign: 'left',
                              padding: 0,
                              borderRadius: isMobile
                                ? 22
                                : variant === 'homepage' && homepageConfig.layoutType === 'simple-preview'
                                  ? 18
                                  : 24,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: `1px solid ${
                                focusMatch ? 'rgba(56,189,248,0.34)' : soft
                              }`,
                              background: cardSurface,
                              display: 'flex',
                              flexDirection: 'column',
                              boxSizing: 'border-box',
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: 0,
                              breakInside: useDesktopMasonry ? 'avoid' : undefined,
                              pageBreakInside: useDesktopMasonry ? 'avoid' : undefined,
                              marginBottom: useDesktopMasonry ? showcaseGap : undefined,
                              height: isMobile ? '100%' : undefined,
                              boxShadow: dark
                                ? '0 24px 44px rgba(2,6,23,0.24)'
                                : '0 18px 32px rgba(15,23,42,0.08)',
                              transition:
                                'transform 0.22s ease, border-color 0.22s ease, opacity 0.22s ease, box-shadow 0.22s ease',
                              gridColumn:
                                !useMasonryLayout && leadCard && safeColumnCount > 1
                                  ? `span ${Math.min(2, safeColumnCount)}`
                                  : undefined,
                              opacity: dimmed ? 0.56 : 1,
                              transform:
                                showHoverOverlay && focusMatch
                                  ? 'translateY(-6px)'
                                  : 'translateY(0)',
                              ...cardStyleOverrides,
                            }}
                          >
                            {showCardThumbnail ? (
                              <div
                                className="portfolio-showcase-media"
                                style={{
                                  position: 'relative',
                                  height:
                                    useDesktopMasonry && item.sourceType === 'graphic'
                                      ? undefined
                                      : useDesktopMasonry
                                        ? masonryVideoHeight
                                      : isMobile
                                        ? mobileMediaHeight
                                        : undefined,
                                  paddingBottom:
                                    useDesktopMasonry && item.sourceType === 'graphic'
                                      ? 0
                                      : useDesktopMasonry
                                        ? 0
                                      : isMobile
                                        ? 0
                                        : imagePadding,
                                  flexShrink: 0,
                                  width: '100%',
                                  maxWidth: '100%',
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  background:
                                    item.sourceType === 'graphic'
                                      ? graphicFrameBackground
                                      : dark
                                        ? '#0f172a'
                                        : '#dbeafe',
                                }}
                              >
                                {item.imageUrl && item.sourceType === 'graphic' ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                      position: useDesktopMasonry ? 'relative' : 'absolute',
                                      inset: useDesktopMasonry ? undefined : 0,
                                      display: 'block',
                                      width: '100%',
                                      height: useDesktopMasonry ? 'auto' : '100%',
                                      maxWidth: '100%',
                                      maxHeight: useDesktopMasonry
                                        ? masonryGraphicMaxHeight
                                        : '100%',
                                      objectFit: 'contain',
                                      objectPosition: 'center',
                                      padding: isMobile ? 6 : 10,
                                      margin: '0 auto',
                                      transform: isMobile
                                        ? 'scale(1)'
                                        : showHoverOverlay && focusMatch
                                          ? 'scale(1.025)'
                                          : 'scale(1)',
                                      transition: 'transform 0.32s ease',
                                    }}
                                  />
                                ) : item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'block',
                                      width: '100%',
                                      height: '100%',
                                      maxWidth: '100%',
                                      objectFit: mediaObjectFit,
                                      objectPosition: 'center',
                                      transform:
                                        isMobile
                                          ? 'scale(1)'
                                          : showHoverOverlay && focusMatch
                                            ? 'scale(1.04)'
                                            : 'scale(1)',
                                      transition: 'transform 0.32s ease',
                                    }}
                                  />
                                ) : null}
                                {showHoverVideoPreview && hoverPreviewKey === focusKey ? (
                                  <iframe
                                    title={`${item.title} hover video preview`}
                                    src={`${(item.youtube_url || '').replace('https://www.youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/')}${(item.youtube_url || '').includes('?') ? '&' : '?'}autoplay=1&mute=1&controls=0&playsinline=1&rel=0`}
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      pointerEvents: 'none',
                                    }}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                  />
                                ) : null}
                              </div>
                            ) : null}

                            <div
                              style={{
                                padding:
                                  isMobile
                                    ? '9px 10px 10px'
                                    : denseCard
                                    ? '16px 16px 15px'
                                    : spaciousCard
                                      ? '24px 22px 22px'
                                      : '20px 18px 18px',
                                display: 'flex',
                                flex: isMobile ? 1 : undefined,
                                flexDirection: 'column',
                                minWidth: 0,
                                maxWidth: '100%',
                              }}
                            >
                              {showCardTitle && (
                                <div
                                  style={{
                                    ...getTypographyStyleOverrides(
                                      'title',
                                      showcaseStyles?.typography.title,
                                      {
                                        dark,
                                        isMobile,
                                        fallbackColor: text,
                                        fallbackFontWeight: 800,
                                        fallbackLineHeight: 1.15,
                                      }
                                    ),
                                    fontSize: isMobile ? 14 : denseCard ? 17 : 20,
                                    fontWeight: 800,
                                    color: text,
                                    lineHeight: isMobile ? 1.12 : 1.15,
                                    marginBottom: showCardMeta ? (isMobile ? 8 : 10) : 0,
                                    ...(isMobile
                                      ? {
                                          display: '-webkit-box',
                                          WebkitBoxOrient: 'vertical',
                                          WebkitLineClamp: 2,
                                          overflow: 'hidden',
                                          maxWidth: '100%',
                                          overflowWrap: 'anywhere',
                                          wordBreak: 'break-word',
                                        }
                                      : {
                                          overflowWrap: 'anywhere',
                                          wordBreak: 'break-word',
                                        }),
                                  }}
                                >
                                  {item.title}
                                </div>
                              )}

                              <div
                                style={{
                                  display: showCardMeta ? 'flex' : 'none',
                                  alignItems: 'center',
                                  gap: isMobile ? 5 : 8,
                                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                                  overflow: isMobile ? 'hidden' : undefined,
                                  marginBottom:
                                    item.description || visibleTags.length > 0
                                      ? isMobile
                                        ? 7
                                        : 10
                                      : isMobile
                                        ? 8
                                        : 14,
                                }}
                              >
                                {showCardTypeBadge ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: isMobile ? 5 : 8,
                                    padding: isMobile ? '4px 7px' : '6px 10px',
                                    flexShrink: 0,
                                    borderRadius: 999,
                                    background: dark
                                      ? 'rgba(15,23,42,0.56)'
                                      : 'rgba(226,232,240,0.8)',
                                    color: text,
                                    fontSize: isMobile ? 9.5 : 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.sourceType === 'video' ? 'Video' : 'Graphic'}
                                </span>
                                ) : null}
                                {showCardCategory &&
                                itemMeta.showCategoryBadge ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: isMobile ? 5 : 8,
                                      maxWidth: isMobile ? '56%' : '100%',
                                      padding: isMobile ? '4px 7px' : '6px 10px',
                                      overflow: isMobile ? 'hidden' : undefined,
                                      textOverflow: isMobile ? 'ellipsis' : undefined,
                                      whiteSpace: isMobile ? 'nowrap' : undefined,
                                      flexShrink: isMobile ? 1 : 0,
                                      borderRadius: 999,
                                      background: dark
                                        ? 'rgba(15,23,42,0.56)'
                                        : 'rgba(226,232,240,0.8)',
                                      color: muted,
                                      fontSize: isMobile ? 9.5 : 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {item.categoryName}
                                  </span>
                                ) : null}
                                {itemMeta.cardBadge ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: isMobile ? 5 : 8,
                                      padding: isMobile ? '4px 7px' : '6px 10px',
                                      flexShrink: 0,
                                      borderRadius: 999,
                                      background: 'rgba(14,165,233,0.1)',
                                      color: accentColor,
                                      fontSize: isMobile ? 9.5 : 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {itemMeta.cardBadge}
                                  </span>
                                ) : null}
                                {variant === 'homepage' &&
                                showFeaturedBadge &&
                                itemConfig?.homepageFeatured &&
                                itemMeta.showHomepageBadge ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      padding: isMobile ? '4px 7px' : '6px 10px',
                                      flexShrink: 0,
                                      borderRadius: 999,
                                      background: 'rgba(37,99,235,0.12)',
                                      color: accentColor,
                                      fontSize: isMobile ? 9.5 : 11,
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    Featured
                                  </span>
                                ) : null}
                                {smartLeadCard ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      padding: isMobile ? '4px 7px' : '6px 10px',
                                      borderRadius: 999,
                                      background: 'rgba(37,99,235,0.12)',
                                      color: accentColor,
                                      fontSize: isMobile ? 9.5 : 11,
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    Showcase
                                  </span>
                                ) : null}
                                {!isMobile && itemMeta.formatLabel ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: isMobile ? 5 : 8,
                                      padding: isMobile ? '4px 7px' : '6px 10px',
                                      borderRadius: 999,
                                      background: 'rgba(14,165,233,0.1)',
                                      color: accentColor,
                                      fontSize: isMobile ? 9.5 : 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {itemMeta.formatLabel}
                                  </span>
                                ) : null}
                                {!isMobile && hasStoryView ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: isMobile ? 5 : 8,
                                      padding: isMobile ? '4px 7px' : '6px 10px',
                                      borderRadius: 999,
                                      background: dark
                                        ? 'rgba(59,130,246,0.16)'
                                        : 'rgba(219,234,254,0.88)',
                                      color: accentColor,
                                      fontSize: isMobile ? 9.5 : 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Story View
                                  </span>
                                ) : null}
                              </div>

                              {!isMobile &&
                              showFullCardDetails &&
                              showCardDescription &&
                              item.description ? (
                                <p
                                  style={{
                                    margin: '0 0 14px',
                                    color: muted,
                                    fontSize: denseCard ? 13 : 14,
                                    lineHeight: 1.7,
                                    ...getTypographyStyleOverrides(
                                      'body',
                                      showcaseStyles?.typography.body,
                                      {
                                        dark,
                                        isMobile,
                                        fallbackColor: muted,
                                        fallbackLineHeight: 1.7,
                                      }
                                    ),
                                  }}
                                >
                                  {item.description}
                                </p>
                              ) : null}

                              {!isMobile && showFullCardDetails && visibleTags.length > 0 ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                    marginBottom: 14,
                                  }}
                                >
                                  {visibleTags.map(tag => (
                                    <span
                                      key={tag}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        border: `1px solid ${soft}`,
                                        background: dark
                                          ? 'rgba(2,6,23,0.52)'
                                          : 'rgba(248,250,252,0.94)',
                                        color: muted,
                                        fontSize: 11,
                                        fontWeight: 700,
                                      }}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}

                              <div
                                style={{
                                  display: showCardMeta ? 'flex' : 'none',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: isMobile ? 6 : 12,
                                  marginTop: isMobile ? 'auto' : undefined,
                                  minHeight: isMobile ? 18 : undefined,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: isMobile ? 4 : 8,
                                    minWidth: 0,
                                    flex: isMobile ? 1 : undefined,
                                    overflow: isMobile ? 'hidden' : undefined,
                                    whiteSpace: isMobile ? 'nowrap' : undefined,
                                    textOverflow: isMobile ? 'ellipsis' : undefined,
                                    color: resolveSectionThemeColor(
                                      showcaseStyles?.colors.accentLight || '',
                                      showcaseStyles?.colors.accentDark || '',
                                      dark,
                                      '#38bdf8'
                                    ),
                                    fontSize: isMobile ? 10.5 : 12,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: isMobile ? 0 : '0.08em',
                                    ...getTypographyStyleOverrides(
                                      'button',
                                      showcaseStyles?.typography.button,
                                      {
                                        dark,
                                        isMobile,
                                        fallbackColor: accentColor,
                                        fallbackFontWeight: 700,
                                      }
                                    ),
                                    ...(isMobile
                                      ? {
                                          fontSize: 10,
                                          letterSpacing: 0,
                                          textTransform: 'none',
                                        }
                                      : {}),
                                  }}
                                >
                                  {itemMeta.showPreviewButton ? displayPreviewLabel : 'View details'}
                                </div>

                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: isMobile ? 4 : 8,
                                    color: text,
                                    fontSize: isMobile ? 10.5 : 13,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {showCardCta
                                    ? cardCtaText
                                    : focusMatch
                                      ? 'Selected'
                                      : 'Preview'}
                                  {itemMeta.showPreviewButton || showPreviewIcon ? (
                                    <span>↗</span>
                                  ) : null}
                                </div>
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
                    justifyContent: getButtonAlignmentOverride(
                      showcaseStyles?.layout.buttonAlign || 'default',
                      homepageConfig.alignment === 'center' ? 'center' : 'flex-start'
                    ),
                    marginTop: 28,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                  }}
                >
                <Link
                  href={homepageConfig.viewAllButtonLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxSizing: 'border-box',
                    minHeight: 46,
                    width: isMobile ? '100%' : undefined,
                    maxWidth: '100%',
                    padding: '12px 20px',
                    borderRadius: 14,
                    border: `1px solid ${soft}`,
                    background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.82)',
                    color: text,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: 'center',
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    ...secondaryButtonStyle,
                  }}
                >
                  {homepageConfig.viewAllButtonText}
                  {showcaseStyles?.buttons.showIcon !== false ? <span>→</span> : null}
                </Link>
                </div>
              ) : null}
            </div>

            <div
              style={{
                order: variant === 'page' ? pageBuilder?.cta.order || 30 : 30,
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflowX: 'hidden',
              }}
            >
              {variant === 'page' && pageBuilder?.cta.enabled ? (
                <div
                  style={{
                    marginTop: 30,
                    paddingTop: 26,
                    borderTop: `1px solid ${soft}`,
                    display: 'grid',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    justifyItems:
                      pageBuilder.cta.alignment === 'center' ? 'center' : 'stretch',
                    textAlign: pageBuilder.cta.alignment,
                    ...getSectionSurfaceOverrides(ctaStyles, {
                      dark,
                      fallbackBackground: 'transparent',
                      fallbackBorder: soft,
                    }),
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
                      ...getTypographyStyleOverrides(
                        'label',
                        ctaStyles?.typography.label,
                        {
                          dark,
                          isMobile,
                          fallbackColor: resolveSectionThemeColor(
                            ctaStyles?.colors.accentLight || '',
                            ctaStyles?.colors.accentDark || '',
                            dark,
                            '#38bdf8'
                          ),
                          fallbackTextAlign: pageBuilder.cta.alignment,
                        }
                      ),
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
                    maxWidth: '100%',
                    overflowWrap: 'anywhere',
                    ...getTypographyStyleOverrides(
                      'title',
                      ctaStyles?.typography.title,
                      {
                        dark,
                        isMobile,
                        fallbackColor: text,
                        fallbackTextAlign: pageBuilder.cta.alignment,
                        fallbackFontWeight: 800,
                        fallbackLetterSpacing: '-0.04em',
                      }
                    ),
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
                      overflowWrap: 'anywhere',
                      ...getTypographyStyleOverrides(
                        'body',
                        ctaStyles?.typography.body,
                        {
                          dark,
                          isMobile,
                          fallbackColor: muted,
                          fallbackTextAlign: pageBuilder.cta.alignment,
                          fallbackLineHeight: 1.8,
                        }
                      ),
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
                    width: '100%',
                    maxWidth: '100%',
                    justifyContent: getButtonAlignmentOverride(
                      ctaStyles?.layout.buttonAlign || 'default',
                      pageBuilder.cta.alignment === 'center'
                        ? 'center'
                        : 'flex-start'
                    ),
                  }}
                >
                  {pageBuilder.cta.showPrimaryButton ? (
                    <Link
                      href={pageBuilder.cta.primaryButtonLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxSizing: 'border-box',
                        width: isMobile ? '100%' : undefined,
                        maxWidth: '100%',
                        padding: '13px 20px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: 'none',
                        textAlign: 'center',
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        ...getButtonStyleOverrides(ctaStyles, {
                          dark,
                          fallbackBackground: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                          fallbackColor: '#fff',
                          fallbackBorder: soft,
                        }),
                      }}
                    >
                      {pageBuilder.cta.primaryButtonText}
                      {ctaStyles?.buttons.showIcon !== false ? <span>→</span> : null}
                    </Link>
                  ) : null}
                  {pageBuilder.cta.showSecondaryButton ? (
                    <Link
                      href={pageBuilder.cta.secondaryButtonLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxSizing: 'border-box',
                        width: isMobile ? '100%' : undefined,
                        maxWidth: '100%',
                        padding: '13px 20px',
                        borderRadius: 14,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.54)' : 'rgba(255,255,255,0.82)',
                        color: text,
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: 'none',
                        textAlign: 'center',
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        ...secondaryButtonStyle,
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

      <PortfolioPreviewModal
        dark={dark}
        footerAction={
          showPreviewFooterLink
            ? {
                href: previewFooterLink,
                label: homepageConfig.viewAllButtonText || 'Portfolio Page',
              }
            : undefined
        }
        item={activeSelectedItem}
        itemMetaConfig={itemMetaConfig}
        items={displayItems}
        onClose={() => setSelectedItem(null)}
        onSelect={setSelectedItem}
      />
    </>
  );
}
