'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PortfolioManagerWorkspace, {
  type PortfolioManagerCategoryOption,
  type PortfolioManagerItem,
} from '@/components/admin/PortfolioManagerWorkspace';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import {
  adminDeleteRows,
  adminFetchPortfolioDataset,
  adminInsertRowsWithSchemaFallback,
  adminSelectRows,
  adminUpdateRowsWithSchemaFallback,
} from '@/lib/admin-data-client';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { toSettingMap } from '@/lib/hero-settings';
import {
  findHomepageOrderConflict,
  getHomepageConfigForItem,
  getHomepagePortfolioItemKey,
  getPortfolioItemDefaultTypeLabel,
  getPortfolioItemMeta,
  HOMEPAGE_PORTFOLIO_SETTING_KEYS,
  parseHomepagePortfolioItemConfig,
  parsePortfolioItemMetaConfig,
  PORTFOLIO_ITEM_META_SETTING_KEY,
  serializeHomepagePortfolioItemConfig,
  serializePortfolioItemMetaConfig,
  slugifyPortfolioValue,
  toPortfolioPreviewItems,
  type HomepagePortfolioConfigMap,
  type PortfolioGraphic,
  type PortfolioItemMetaConfigMap,
} from '@/lib/portfolio-content';
import {
  getPortfolioPageBuilderConfig,
  getPortfolioPageItemConfig,
  getPortfolioPageItemKey,
  PORTFOLIO_PAGE_BUILDER_SETTING_KEY,
  serializePortfolioPageBuilderConfig,
  type PortfolioPageBuilderConfig,
} from '@/lib/portfolio-page-content';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function extractYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || '';
}

function toEmbedUrl(url: string) {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function toAutoThumbnail(url: string) {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

function createMetaEntry(item: PortfolioManagerItem) {
  return {
    tags: item.tags,
    typeLabel: item.typeLabel || getPortfolioItemDefaultTypeLabel('video'),
    formatLabel: item.formatLabel,
    aspectRatio: item.aspectRatio,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    ogImage: item.ogImage,
    coverImage: item.coverImage,
    socialImage: item.socialImage,
    slug: item.slug,
    robots: item.robots,
    structuredDataType: item.structuredDataType,
    status: item.status,
    altText: item.altText,
    externalPreviewUrl: item.externalPreviewUrl,
    cardBadge: item.cardBadge,
    cardCtaLabel: item.cardCtaLabel,
    previewTitle: item.previewTitle,
    previewSubtitle: item.previewSubtitle,
    previewDescription: item.previewDescription,
    previewCtaLabel: item.previewCtaLabel,
    previewCtaLink: item.previewCtaLink,
    showCategoryBadge: item.showCategoryBadge,
    showTags: item.showTags,
    showPreviewButton: item.showPreviewButton,
    showHomepageBadge: item.showHomepageBadge,
    smartShowcase: item.smartShowcase,
    featuredPriority: item.featuredPriority,
    story: {
      challenge: item.storyChallenge,
      solution: item.storySolution,
      tools: item.storyTools,
      result: item.storyResult,
    },
    projectId: item.projectId,
    projectTitle: item.projectTitle,
    projectCoverImage: item.projectCoverImage,
    projectType: item.projectType,
    projectDescription: item.projectDescription,
    projectOrder: item.projectOrder,
    projectVisible: item.projectVisible,
    projectGallery: item.projectGallery,
  };
}

export default function AdminVideos() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioManagerItem[]>([]);
  const [categories, setCategories] = useState<PortfolioManagerCategoryOption[]>([]);
  const [homepageConfig, setHomepageConfig] = useState<HomepagePortfolioConfigMap>({});
  const [itemMetaConfig, setItemMetaConfig] = useState<PortfolioItemMetaConfigMap>({});
  const [pageBuilder, setPageBuilder] = useState<PortfolioPageBuilderConfig>(() =>
    getPortfolioPageBuilderConfig({})
  );
  const [homepageItems, setHomepageItems] = useState(
    [] as ReturnType<typeof toPortfolioPreviewItems>
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function verifyAndRefresh() {
      const ok = await verifyAdminSessionClient();
      if (!active) {
        return;
      }
      if (!ok) {
        router.replace('/admin/login');
        return;
      }
      await refreshData();
    }

    void verifyAndRefresh();

    return () => {
      active = false;
    };
  }, [router]);

  async function upsertSetting(key: string, value: string) {
    await writeSiteSetting(supabase, key, value);
  }

  async function refreshData() {
    setLoading(true);

    try {
      const [settingsRows, dataset] = await Promise.all([
        adminSelectRows<Array<{ key: string; value: string }>>('site_settings'),
        adminFetchPortfolioDataset(),
      ]);

      const map = toSettingMap(settingsRows || []);
      const nextHomepageConfig = parseHomepagePortfolioItemConfig(
        map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig]
      );
      const nextMetaConfig = parsePortfolioItemMetaConfig(
        map[PORTFOLIO_ITEM_META_SETTING_KEY]
      );
      const nextPageBuilder = getPortfolioPageBuilderConfig(map);
      const videoCategories = dataset.categories
        .filter(category => category.type === 'video' || category.type === 'both')
        .map(category => ({
          label: category.name,
          value: category.slug,
        }));

      const managerItems = dataset.videos.map(video => {
        const homepageState = getHomepageConfigForItem(
          {
            sourceType: 'video',
            id: String(video.id),
            order_num: video.order_num,
          },
          nextHomepageConfig
        );
        const itemMeta = getPortfolioItemMeta(
          { sourceType: 'video', id: String(video.id) },
          nextMetaConfig
        );
        const previewState = getPortfolioPageItemConfig(
          { sourceType: 'video', id: String(video.id) },
          nextPageBuilder.itemConfig
        );

        return {
          id: String(video.id),
          title: video.title,
          category: video.category || '',
          description: video.description || '',
          tags: itemMeta.tags,
          order_num: video.order_num,
          visible: video.visible,
          homepageVisible: homepageState.showOnHomepage,
          homepageOrder: homepageState.homepageOrder,
          homepageFeatured: homepageState.homepageFeatured,
          featuredPriority: itemMeta.featuredPriority,
          previewEnabled: previewState.previewEnabled,
          imageUrl: video.thumbnail || toAutoThumbnail(video.youtube_url),
          youtubeUrl: video.youtube_url,
          externalPreviewUrl: itemMeta.externalPreviewUrl,
          typeLabel: itemMeta.typeLabel || getPortfolioItemDefaultTypeLabel('video'),
          formatLabel: itemMeta.formatLabel,
          aspectRatio: itemMeta.aspectRatio,
          seoTitle: itemMeta.seoTitle,
          seoDescription: itemMeta.seoDescription,
          canonicalUrl: itemMeta.canonicalUrl,
          ogImage: itemMeta.ogImage,
          coverImage: itemMeta.coverImage,
          socialImage: itemMeta.socialImage,
          slug: video.slug || itemMeta.slug,
          robots: itemMeta.robots,
          structuredDataType: itemMeta.structuredDataType,
          status: itemMeta.status,
          altText: itemMeta.altText,
          cardBadge: itemMeta.cardBadge,
          cardCtaLabel: itemMeta.cardCtaLabel,
          previewTitle: itemMeta.previewTitle,
          previewSubtitle: itemMeta.previewSubtitle,
          previewDescription: itemMeta.previewDescription,
          previewCtaLabel: itemMeta.previewCtaLabel,
          previewCtaLink: itemMeta.previewCtaLink,
          showCategoryBadge: itemMeta.showCategoryBadge,
          showTags: itemMeta.showTags,
          showPreviewButton: itemMeta.showPreviewButton,
          showHomepageBadge: itemMeta.showHomepageBadge,
          smartShowcase: itemMeta.smartShowcase,
          storyChallenge: itemMeta.story.challenge || '',
          storySolution: itemMeta.story.solution || '',
          storyTools: itemMeta.story.tools || '',
          storyResult: itemMeta.story.result || '',
          projectId: itemMeta.projectId,
          projectTitle: itemMeta.projectTitle,
          projectCoverImage: itemMeta.projectCoverImage,
          projectType: itemMeta.projectType,
          projectDescription: itemMeta.projectDescription,
          projectOrder: itemMeta.projectOrder || video.order_num,
          projectVisible: itemMeta.projectVisible,
          projectGallery: itemMeta.projectGallery,
          createdAt: String(video.id),
          tier: video.tier || 'standard',
        } satisfies PortfolioManagerItem;
      });

      const missingCategoryOptions = Array.from(
        new Set(managerItems.map(item => item.category).filter(Boolean))
      )
        .filter(categoryValue => !videoCategories.some(option => option.value === categoryValue))
        .map(categoryValue => ({
          label: categoryValue,
          value: categoryValue,
        }));

      setItems(managerItems);
      setCategories([...videoCategories, ...missingCategoryOptions]);
      setHomepageConfig(nextHomepageConfig);
      setItemMetaConfig(nextMetaConfig);
      setPageBuilder(nextPageBuilder);
      setHomepageItems(
        toPortfolioPreviewItems(
          dataset.videos,
          dataset.graphics as PortfolioGraphic[],
          dataset.categories
        )
      );
      setLoading(false);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Video manager data load failed.';
      setMessage(nextMessage);
      setLoading(false);
    }
  }

  function nextHomepageOrder() {
    const usedOrders = homepageItems
      .map(item => getHomepageConfigForItem(item, homepageConfig))
      .filter(config => config.showOnHomepage)
      .map(config => config.homepageOrder);

    return usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 1;
  }

  function getConflictMessage(title: string, type: string, homepageOrder: number) {
    return `❌ Homepage order ${homepageOrder} is already used by "${title}" (${type}). Choose another order.`;
  }

  async function persistConfigs(itemId: string, item: PortfolioManagerItem) {
    const homepageKey = getHomepagePortfolioItemKey('video', itemId);
    const nextHomepageConfig = {
      ...homepageConfig,
      [homepageKey]: {
        showOnHomepage: item.homepageVisible,
        homepageOrder: item.homepageOrder,
        homepageFeatured: item.homepageFeatured,
        previewEnabled: item.previewEnabled,
      },
    };
    const nextMetaConfig = {
      ...itemMetaConfig,
      [homepageKey]: createMetaEntry(item),
    };
    const nextPageBuilder = {
      ...pageBuilder,
      itemConfig: {
        ...pageBuilder.itemConfig,
        [getPortfolioPageItemKey('video', itemId)]: {
          previewEnabled: item.previewEnabled,
        },
      },
    };

    await Promise.all([
      upsertSetting(
        HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig,
        serializeHomepagePortfolioItemConfig(nextHomepageConfig)
      ),
      upsertSetting(
        PORTFOLIO_ITEM_META_SETTING_KEY,
        serializePortfolioItemMetaConfig(nextMetaConfig)
      ),
      upsertSetting(
        PORTFOLIO_PAGE_BUILDER_SETTING_KEY,
        serializePortfolioPageBuilderConfig(nextPageBuilder)
      ),
    ]);

    setHomepageConfig(nextHomepageConfig);
    setItemMetaConfig(nextMetaConfig);
    setPageBuilder(nextPageBuilder);
  }

  async function saveItem(
    draft: PortfolioManagerItem,
    options: { mode: 'create' | 'update'; original: PortfolioManagerItem | null },
    successMessage: string
  ) {
    if (!draft.title.trim()) {
      throw new Error('Video title is required.');
    }

    if (!draft.category.trim()) {
      throw new Error('Category is required.');
    }

    if (!draft.youtubeUrl.trim()) {
      throw new Error('YouTube URL is required.');
    }

    const normalizedHomepageOrder = draft.homepageVisible
      ? draft.homepageOrder > 0
        ? draft.homepageOrder
        : nextHomepageOrder()
      : draft.homepageOrder || nextHomepageOrder();
    const targetId =
      options.mode === 'update' ? draft.id : `new-video-${Date.now()}`;
    const conflict = findHomepageOrderConflict(
      homepageItems,
      homepageConfig,
      {
        sourceType: 'video',
        id: targetId,
        order_num: draft.order_num,
      },
      normalizedHomepageOrder,
      draft.homepageVisible
    );

    if (conflict) {
      throw new Error(
        getConflictMessage(
          conflict.title,
          conflict.sourceType === 'video' ? 'video' : 'graphic',
          normalizedHomepageOrder
        )
      );
    }

    const normalizedSlug = slugifyPortfolioValue(draft.slug || draft.title);
    const embedUrl = toEmbedUrl(draft.youtubeUrl);
    const thumbnailUrl = draft.imageUrl || toAutoThumbnail(draft.youtubeUrl);
    const payload = {
      title: draft.title.trim(),
      slug: normalizedSlug,
      category: draft.category.trim(),
      description: draft.description.trim() || null,
      youtube_url: embedUrl,
      thumbnail: thumbnailUrl,
      tier: draft.tier || options.original?.tier || 'standard',
      order_num: draft.order_num,
      visible: draft.visible,
    };

    let savedId = draft.id;
    if (options.mode === 'update') {
      await adminUpdateRowsWithSchemaFallback('videos', payload, { id: draft.id });
    } else {
      const data = await adminInsertRowsWithSchemaFallback<Array<{ id: number }>>(
        'videos',
        [payload],
        'id'
      );
      savedId = String(data?.[0]?.id || '');
    }

    await persistConfigs(savedId, {
      ...draft,
      id: savedId,
      slug: normalizedSlug,
      imageUrl: thumbnailUrl,
      youtubeUrl: embedUrl,
      homepageOrder: normalizedHomepageOrder,
    });
    await refreshData();
    setMessage(`✅ ${successMessage}`);
    window.setTimeout(() => setMessage(''), 3000);
    return savedId;
  }

  async function handleSaveItem(
    draft: PortfolioManagerItem,
    options: { mode: 'create' | 'update'; original: PortfolioManagerItem | null }
  ) {
    setSaving(true);
    try {
      return await saveItem(
        draft,
        options,
        options.mode === 'create' ? 'Video saved successfully.' : 'Video updated successfully.'
      );
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Video save failed.';
      setMessage(nextMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickUpdate(item: PortfolioManagerItem, patch: Partial<PortfolioManagerItem>) {
    setSaving(true);
    try {
      const nextItem = {
        ...item,
        ...patch,
      } satisfies PortfolioManagerItem;

      if (patch.homepageVisible === true && !item.homepageVisible && !patch.homepageOrder) {
        nextItem.homepageOrder = nextHomepageOrder();
      }

      await saveItem(nextItem, { mode: 'update', original: item }, 'Video updated.');
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Quick update failed.';
      setMessage(nextMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(item: PortfolioManagerItem) {
    setSaving(true);
    try {
      await adminDeleteRows('videos', { id: item.id });

      const homepageKey = getHomepagePortfolioItemKey('video', item.id);
      const nextHomepageConfig = { ...homepageConfig };
      const nextMetaConfig = { ...itemMetaConfig };
      const nextPageBuilder = {
        ...pageBuilder,
        itemConfig: { ...pageBuilder.itemConfig },
      };

      delete nextHomepageConfig[homepageKey];
      delete nextHomepageConfig[item.id];
      delete nextMetaConfig[homepageKey];
      delete nextPageBuilder.itemConfig[getPortfolioPageItemKey('video', item.id)];

      await Promise.all([
        upsertSetting(
          HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig,
          serializeHomepagePortfolioItemConfig(nextHomepageConfig)
        ),
        upsertSetting(
          PORTFOLIO_ITEM_META_SETTING_KEY,
          serializePortfolioItemMetaConfig(nextMetaConfig)
        ),
        upsertSetting(
          PORTFOLIO_PAGE_BUILDER_SETTING_KEY,
          serializePortfolioPageBuilderConfig(nextPageBuilder)
        ),
      ]);

      await refreshData();
      setMessage('✅ Video deleted successfully.');
      window.setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Video delete failed.';
      setMessage(nextMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateItem(item: PortfolioManagerItem) {
    setSaving(true);
    try {
      const duplicateSlug = slugifyPortfolioValue(`${item.title} Copy ${Date.now()}`);
      const insertPayload = {
        title: `${item.title} Copy`,
        slug: duplicateSlug,
        category: item.category,
        description: item.description || null,
        youtube_url: item.youtubeUrl,
        thumbnail: item.imageUrl || toAutoThumbnail(item.youtubeUrl),
        tier: item.tier || 'standard',
        order_num: items.length > 0 ? Math.max(...items.map(entry => entry.order_num)) + 1 : 1,
        visible: item.visible,
      };

      const data = await adminInsertRowsWithSchemaFallback<Array<{ id: number }>>(
        'videos',
        [insertPayload],
        'id'
      );
      const duplicatedId = String(data?.[0]?.id || '');
      const duplicatedItem = {
        ...item,
        id: duplicatedId,
        title: `${item.title} Copy`,
        slug: duplicateSlug,
        order_num: insertPayload.order_num,
        homepageOrder: item.homepageVisible ? nextHomepageOrder() : item.homepageOrder,
      } satisfies PortfolioManagerItem;

      await persistConfigs(duplicatedId, duplicatedItem);
      await refreshData();
      setMessage('✅ Video duplicated successfully.');
      window.setTimeout(() => setMessage(''), 3000);
      return duplicatedId;
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Video duplicate failed.';
      setMessage(nextMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadMedia(file: File) {
    setUploadingMedia(true);

    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const path = `videos/thumb-${Date.now()}.${extension}`;
      const { publicUrl } = await adminUploadFile('media', path, file, {
        uploadProfile: 'thumbnail',
      });
      return publicUrl;
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Thumbnail upload failed.';
      setMessage(nextMessage);
    } finally {
      setUploadingMedia(false);
    }
  }

  return (
    <PortfolioManagerWorkspace
      addLabel="Add New Video"
      categories={categories}
      description="Video content, homepage placement, preview settings, story view, and smart showcase controls now live in one premium manager system."
      eyebrow="Video Manager"
      itemLabel="Video"
      items={items}
      loading={loading}
      managerType="video"
      message={message}
      onClearMessage={() => setMessage('')}
      onDeleteItem={handleDeleteItem}
      onDuplicateItem={handleDuplicateItem}
      onQuickUpdate={handleQuickUpdate}
      onSaveItem={handleSaveItem}
      onUploadMedia={async (file: File) => handleUploadMedia(file)}
      saving={saving}
      title="Manage portfolio videos with the same premium workflow used across the content system"
      uploadingMedia={uploadingMedia}
    />
  );
}
