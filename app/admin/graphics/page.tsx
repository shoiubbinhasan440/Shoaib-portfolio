'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PortfolioManagerWorkspace, {
  type PortfolioManagerCategoryOption,
  type PortfolioManagerItem,
} from '@/components/admin/PortfolioManagerWorkspace';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import { adminDeleteRows, adminInsertRows, adminUpdateRows } from '@/lib/admin-data-client';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { toSettingMap } from '@/lib/hero-settings';
import {
  fetchPortfolioDataset,
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
  toPortfolioPreviewItems,
  type HomepagePortfolioConfigMap,
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

function createMetaEntry(item: PortfolioManagerItem) {
  return {
    tags: item.tags,
    typeLabel: item.typeLabel || getPortfolioItemDefaultTypeLabel('graphic'),
    formatLabel: item.formatLabel,
    aspectRatio: item.aspectRatio,
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
  };
}

export default function AdminGraphics() {
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
      const [{ data: settingsRows }, dataset] = await Promise.all([
        supabase.from('site_settings').select('*'),
        fetchPortfolioDataset(supabase, { includeHidden: true }),
      ]);

      const map = toSettingMap(settingsRows || []);
      const nextHomepageConfig = parseHomepagePortfolioItemConfig(
        map[HOMEPAGE_PORTFOLIO_SETTING_KEYS.itemConfig]
      );
      const nextMetaConfig = parsePortfolioItemMetaConfig(
        map[PORTFOLIO_ITEM_META_SETTING_KEY]
      );
      const nextPageBuilder = getPortfolioPageBuilderConfig(map);
      const graphicCategories = dataset.categories
        .filter(category => category.type === 'graphic' || category.type === 'both')
        .map(category => ({
          label: category.name,
          value: category.name,
        }));

      const managerItems = dataset.graphics.map(graphic => {
        const homepageState = getHomepageConfigForItem(
          {
            sourceType: 'graphic',
            id: String(graphic.id),
            order_num: graphic.order_num,
          },
          nextHomepageConfig
        );
        const itemMeta = getPortfolioItemMeta(
          { sourceType: 'graphic', id: String(graphic.id) },
          nextMetaConfig
        );
        const previewState = getPortfolioPageItemConfig(
          { sourceType: 'graphic', id: String(graphic.id) },
          nextPageBuilder.itemConfig
        );

        return {
          id: String(graphic.id),
          title: graphic.title,
          category: graphic.category || '',
          description: graphic.description || '',
          tags: itemMeta.tags,
          order_num: graphic.order_num,
          visible: graphic.visible,
          homepageVisible: homepageState.showOnHomepage,
          homepageOrder: homepageState.homepageOrder,
          homepageFeatured: homepageState.homepageFeatured,
          featuredPriority: itemMeta.featuredPriority,
          previewEnabled: previewState.previewEnabled,
          imageUrl: graphic.image_url || '',
          youtubeUrl: '',
          externalPreviewUrl: itemMeta.externalPreviewUrl,
          typeLabel: itemMeta.typeLabel || getPortfolioItemDefaultTypeLabel('graphic'),
          formatLabel: itemMeta.formatLabel,
          aspectRatio: itemMeta.aspectRatio,
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
          createdAt: graphic.created_at || '',
          tier: '',
        } satisfies PortfolioManagerItem;
      });

      const missingCategoryOptions = Array.from(
        new Set(managerItems.map(item => item.category).filter(Boolean))
      )
        .filter(categoryValue => !graphicCategories.some(option => option.value === categoryValue))
        .map(categoryValue => ({
          label: categoryValue,
          value: categoryValue,
        }));

      setItems(managerItems);
      setCategories([...graphicCategories, ...missingCategoryOptions]);
      setHomepageConfig(nextHomepageConfig);
      setItemMetaConfig(nextMetaConfig);
      setPageBuilder(nextPageBuilder);
      setHomepageItems(
        toPortfolioPreviewItems(dataset.videos, dataset.graphics, dataset.categories)
      );
      setLoading(false);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Graphics manager data load failed.';
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
    const homepageKey = getHomepagePortfolioItemKey('graphic', itemId);
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
        [getPortfolioPageItemKey('graphic', itemId)]: {
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
      throw new Error('Graphic title is required.');
    }

    if (!draft.imageUrl.trim()) {
      throw new Error('Artwork image is required.');
    }

    const normalizedHomepageOrder = draft.homepageVisible
      ? draft.homepageOrder > 0
        ? draft.homepageOrder
        : nextHomepageOrder()
      : draft.homepageOrder || nextHomepageOrder();
    const targetId =
      options.mode === 'update' ? draft.id : `new-graphic-${Date.now()}`;
    const conflict = findHomepageOrderConflict(
      homepageItems,
      homepageConfig,
      {
        sourceType: 'graphic',
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

    const payload = {
      title: draft.title.trim(),
      category: draft.category.trim(),
      description: draft.description.trim() || null,
      image_url: draft.imageUrl.trim(),
      visible: draft.visible,
      order_num: draft.order_num,
    };

    let savedId = draft.id;
    if (options.mode === 'update') {
      await adminUpdateRows('graphics', payload, { id: draft.id });
    } else {
      const data = await adminInsertRows<Array<{ id: string }>>('graphics', [payload], 'id');
      savedId = String(data?.[0]?.id || '');
    }

    await persistConfigs(savedId, {
      ...draft,
      id: savedId,
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
        options.mode === 'create' ? 'Graphic saved successfully.' : 'Graphic updated successfully.'
      );
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Graphic save failed.';
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

      await saveItem(nextItem, { mode: 'update', original: item }, 'Graphic updated.');
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
      await adminDeleteRows('graphics', { id: item.id });

      const homepageKey = getHomepagePortfolioItemKey('graphic', item.id);
      const nextHomepageConfig = { ...homepageConfig };
      const nextMetaConfig = { ...itemMetaConfig };
      const nextPageBuilder = {
        ...pageBuilder,
        itemConfig: { ...pageBuilder.itemConfig },
      };

      delete nextHomepageConfig[homepageKey];
      delete nextMetaConfig[homepageKey];
      delete nextPageBuilder.itemConfig[getPortfolioPageItemKey('graphic', item.id)];

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
      setMessage('✅ Graphic deleted successfully.');
      window.setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Graphic delete failed.';
      setMessage(nextMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateItem(item: PortfolioManagerItem) {
    setSaving(true);
    try {
      const insertPayload = {
        title: `${item.title} Copy`,
        category: item.category,
        description: item.description || null,
        image_url: item.imageUrl,
        visible: item.visible,
        order_num: items.length > 0 ? Math.max(...items.map(entry => entry.order_num)) + 1 : 1,
      };

      const data = await adminInsertRows<Array<{ id: string }>>('graphics', [insertPayload], 'id');
      const duplicatedId = String(data?.[0]?.id || '');
      const duplicatedItem = {
        ...item,
        id: duplicatedId,
        title: `${item.title} Copy`,
        order_num: insertPayload.order_num,
        homepageOrder: item.homepageVisible ? nextHomepageOrder() : item.homepageOrder,
      } satisfies PortfolioManagerItem;

      await persistConfigs(duplicatedId, duplicatedItem);
      await refreshData();
      setMessage('✅ Graphic duplicated successfully.');
      window.setTimeout(() => setMessage(''), 3000);
      return duplicatedId;
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Graphic duplicate failed.';
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
      const fileName = `graphics-${Date.now()}.${extension}`;
      const { publicUrl } = await adminUploadFile('graphics', fileName, file, {
        uploadProfile: 'showcase',
      });
      return publicUrl;
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Artwork upload failed.';
      setMessage(nextMessage);
    } finally {
      setUploadingMedia(false);
    }
  }

  return (
    <PortfolioManagerWorkspace
      addLabel="Add New Graphic"
      categories={categories}
      description="Graphic assets, smart showcase settings, story view, homepage controls, and premium preview behavior now live in the same manager pattern as videos."
      eyebrow="Graphics Manager"
      itemLabel="Graphic"
      items={items}
      loading={loading}
      managerType="graphic"
      message={message}
      onClearMessage={() => setMessage('')}
      onDeleteItem={handleDeleteItem}
      onDuplicateItem={handleDuplicateItem}
      onQuickUpdate={handleQuickUpdate}
      onSaveItem={handleSaveItem}
      onUploadMedia={async (file: File) => handleUploadMedia(file)}
      saving={saving}
      title="Manage graphics with the same premium workflow, preview controls, and sorting logic used in the video system"
      uploadingMedia={uploadingMedia}
    />
  );
}
