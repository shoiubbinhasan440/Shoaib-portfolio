'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminShell from '@/components/admin/AdminShell';
import SeoVisibilityPanel, {
  type SeoRobotsMode,
  type SeoStructuredDataType,
  type SeoVisibilityStatus,
} from '@/components/admin/SeoVisibilityPanel';
import PortfolioPreviewModal from '@/components/portfolio/PortfolioPreviewModal';
import {
  AdminActionButton,
  AdminBuilderSection,
  AdminChip,
  AdminField,
  AdminNotice,
  AdminPanel,
  AdminPreviewFrame,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import type {
  PortfolioItemMetaConfigMap,
  PortfolioProjectGalleryItem,
  PortfolioProjectType,
  PortfolioPreviewItem,
  PortfolioSourceType,
} from '@/lib/portfolio-content';

export type PortfolioManagerCategoryOption = {
  label: string;
  value: string;
};

export type PortfolioManagerItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  order_num: number;
  visible: boolean;
  homepageVisible: boolean;
  homepageOrder: number;
  homepageFeatured: boolean;
  featuredPriority: number;
  previewEnabled: boolean;
  imageUrl: string;
  youtubeUrl: string;
  externalPreviewUrl: string;
  typeLabel: string;
  formatLabel: string;
  aspectRatio: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  coverImage: string;
  socialImage: string;
  slug: string;
  robots: SeoRobotsMode;
  structuredDataType: SeoStructuredDataType;
  status: SeoVisibilityStatus;
  altText: string;
  cardBadge: string;
  cardCtaLabel: string;
  previewTitle: string;
  previewSubtitle: string;
  previewDescription: string;
  previewCtaLabel: string;
  previewCtaLink: string;
  showCategoryBadge: boolean;
  showTags: boolean;
  showPreviewButton: boolean;
  showHomepageBadge: boolean;
  smartShowcase: boolean;
  storyChallenge: string;
  storySolution: string;
  storyTools: string;
  storyResult: string;
  projectId: string;
  projectTitle: string;
  projectCoverImage: string;
  projectType: PortfolioProjectType;
  projectDescription: string;
  projectOrder: number;
  projectVisible: boolean;
  projectGallery: PortfolioProjectGalleryItem[];
  createdAt?: string;
  tier?: string;
};

type PortfolioManagerWorkspaceProps = {
  addLabel: string;
  categories: PortfolioManagerCategoryOption[];
  description: string;
  eyebrow: string;
  itemLabel: string;
  items: PortfolioManagerItem[];
  loading: boolean;
  managerType: PortfolioSourceType;
  message?: string;
  onClearMessage?: () => void;
  onDeleteItem: (item: PortfolioManagerItem) => Promise<void>;
  onDuplicateItem: (item: PortfolioManagerItem) => Promise<string | void>;
  onQuickUpdate: (
    item: PortfolioManagerItem,
    patch: Partial<PortfolioManagerItem>
  ) => Promise<void>;
  onSaveItem: (
    draft: PortfolioManagerItem,
    options: { mode: 'create' | 'update'; original: PortfolioManagerItem | null }
  ) => Promise<string | void>;
  onUploadMedia: (file: File, item: PortfolioManagerItem) => Promise<string | void>;
  saving: boolean;
  title: string;
  uploadingMedia: boolean;
};

type SortMode = 'order' | 'homepage' | 'featured' | 'newest' | 'oldest';
type PortfolioToneStyle =
  | 'Cinematic'
  | 'Luxury'
  | 'Minimal'
  | 'Dark'
  | 'Emotional'
  | 'Corporate'
  | 'Futuristic'
  | 'Documentary'
  | 'Islamic'
  | 'Humanitarian';
type AiGenerateField =
  | 'all'
  | 'title'
  | 'description'
  | 'tags'
  | 'seoTitle'
  | 'seoDescription'
  | 'challenge'
  | 'solution'
  | 'toolsUsed'
  | 'result'
  | 'typeLabel'
  | 'formatLabel'
  | 'category'
  | 'aspectRatio';
type PortfolioAiContent = {
  aspectRatio: string;
  challenge: string;
  description: string;
  formatLabel: string;
  result: string;
  seoDescription: string;
  seoTitle: string;
  solution: string;
  suggestedCategory: string;
  tags: string[];
  title: string;
  toolsUsed: string;
  typeLabel: string;
  visualRead?: {
    atmosphere: string;
    colorGrade: string;
    composition: string;
    genre: string;
    lighting: string;
    mood: string;
    subject: string;
  };
};

const toneStyleOptions: PortfolioToneStyle[] = [
  'Cinematic',
  'Luxury',
  'Minimal',
  'Dark',
  'Emotional',
  'Corporate',
  'Futuristic',
  'Documentary',
  'Islamic',
  'Humanitarian',
];

const regenerateFieldOptions: Array<{ field: AiGenerateField; label: string }> = [
  { field: 'title', label: 'Title' },
  { field: 'description', label: 'Description' },
  { field: 'tags', label: 'Tags' },
  { field: 'seoTitle', label: 'SEO title' },
  { field: 'seoDescription', label: 'SEO description' },
  { field: 'challenge', label: 'Challenge' },
  { field: 'solution', label: 'Solution' },
  { field: 'toolsUsed', label: 'Tools' },
  { field: 'result', label: 'Result' },
  { field: 'typeLabel', label: 'Type' },
  { field: 'formatLabel', label: 'Format' },
  { field: 'category', label: 'Category' },
  { field: 'aspectRatio', label: 'Ratio' },
];

function itemKey(type: PortfolioSourceType, itemId: string) {
  return `${type}:${itemId}`;
}

function normalizeTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
    )
  );
}

function toTagInput(tags: string[]) {
  return tags.join(', ');
}

function getDefaultTypeLabel(managerType: PortfolioSourceType) {
  return managerType === 'video' ? 'Video Edit' : 'Graphic Design';
}

function createPreviewItem(
  item: PortfolioManagerItem,
  categories: PortfolioManagerCategoryOption[],
  managerType: PortfolioSourceType
) {
  const matchedCategory =
    categories.find(category => category.value === item.category) ||
    categories.find(category => category.label === item.category);

  return {
    sourceType: managerType,
    id: item.id,
    title: item.title,
    description: item.description || '',
    category: item.category || null,
    categorySlug: item.category || null,
    categoryName: matchedCategory?.label || item.category || 'Portfolio',
    categoryActive: true,
    categoryType: managerType,
    categoryShowOnHomepage: true,
    categoryShowOnPortfolio: true,
    categoryShowFilterChip: true,
    categoryFeatured: false,
    categoryIcon: null,
    imageUrl: item.imageUrl,
    visible: item.visible,
    order_num: item.order_num,
    tier: item.tier || undefined,
    youtube_url: item.youtubeUrl || undefined,
    projectId: item.projectId,
    projectTitle: item.projectTitle,
    projectCoverImage: item.projectCoverImage,
    projectType: item.projectType,
    projectDescription: item.projectDescription,
    projectOrder: item.projectOrder,
    projectVisible: item.projectVisible,
    projectItems: [
      {
        id: `${managerType}:${item.id || 'draft'}`,
        title: item.title,
        imageUrl: item.imageUrl,
        sourceType: managerType,
        youtube_url: item.youtubeUrl || undefined,
        description: item.description,
        categoryName: matchedCategory?.label || item.category || 'Portfolio',
        formatLabel: item.formatLabel,
      },
      ...item.projectGallery,
    ],
  } satisfies PortfolioPreviewItem;
}

function createMetaConfig(
  items: PortfolioManagerItem[],
  managerType: PortfolioSourceType
) {
  return Object.fromEntries(
    items.map(item => [
      itemKey(managerType, item.id),
      {
        tags: item.tags,
        typeLabel: item.typeLabel,
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
      },
    ])
  ) as PortfolioItemMetaConfigMap;
}

function getNextOrder(items: PortfolioManagerItem[]) {
  return items.length > 0 ? Math.max(...items.map(item => item.order_num || 0)) + 1 : 1;
}

function getNextHomepageOrder(items: PortfolioManagerItem[]) {
  const visibleHomepageItems = items.filter(item => item.homepageVisible);
  return visibleHomepageItems.length > 0
    ? Math.max(...visibleHomepageItems.map(item => item.homepageOrder || 0)) + 1
    : 1;
}

function createEmptyItem(
  managerType: PortfolioSourceType,
  items: PortfolioManagerItem[],
  categories: PortfolioManagerCategoryOption[]
) {
  return {
    id: '',
    title: '',
    category: categories[0]?.value || '',
    description: '',
    tags: [],
    order_num: getNextOrder(items),
    visible: true,
    homepageVisible: true,
    homepageOrder: getNextHomepageOrder(items),
    homepageFeatured: false,
    featuredPriority: 0,
    previewEnabled: true,
    imageUrl: '',
    youtubeUrl: '',
    externalPreviewUrl: '',
    typeLabel: getDefaultTypeLabel(managerType),
    formatLabel: '',
    aspectRatio: '',
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    ogImage: '',
    coverImage: '',
    socialImage: '',
    slug: '',
    robots: 'index-follow',
    structuredDataType: 'CreativeWork',
    status: 'published',
    altText: '',
    cardBadge: '',
    cardCtaLabel: '',
    previewTitle: '',
    previewSubtitle: '',
    previewDescription: '',
    previewCtaLabel: '',
    previewCtaLink: '',
    showCategoryBadge: true,
    showTags: true,
    showPreviewButton: true,
    showHomepageBadge: true,
    smartShowcase: false,
    storyChallenge: '',
    storySolution: '',
    storyTools: '',
    storyResult: '',
    projectId: '',
    projectTitle: '',
    projectCoverImage: '',
    projectType: managerType === 'video' ? 'Video' : 'Graphic',
    projectDescription: '',
    projectOrder: getNextOrder(items),
    projectVisible: true,
    projectGallery: [],
    createdAt: '',
    tier: '',
  } satisfies PortfolioManagerItem;
}

function getSortStamp(item: PortfolioManagerItem) {
  if (item.createdAt) {
    const parsed = Date.parse(item.createdAt);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const numericId = Number(item.id);
  return Number.isFinite(numericId) ? numericId : 0;
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'accent' | 'neutral' | 'success';
  value: string;
}) {
  const tokens = useAdminThemeTokens();

  const accentStyles =
    tone === 'success'
      ? {
          background: tokens.successSoft,
          border: `1px solid ${tokens.successSoft}`,
          color: tokens.successText,
        }
      : tone === 'accent'
        ? {
            background: tokens.accentSoft,
            border: `1px solid ${tokens.accentSoft}`,
            color: tokens.accentText,
          }
        : {
            background: tokens.fieldSoft,
            border: `1px solid ${tokens.line}`,
            color: tokens.text,
          };

  return (
    <div
      style={{
        borderRadius: 22,
        padding: '18px 18px 16px',
        boxShadow: tokens.softShadow,
        ...accentStyles,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em' }}>{value}</div>
    </div>
  );
}

function QuickToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: `1px solid ${active ? 'rgba(56,189,248,0.24)' : tokens.line}`,
        background: active
          ? `linear-gradient(135deg, ${tokens.accentSoft}, rgba(14,165,233,0.12))`
          : tokens.fieldSoft,
        color: active ? tokens.accentText : tokens.text,
        padding: '9px 12px',
        fontSize: 12,
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export default function PortfolioManagerWorkspace({
  addLabel,
  categories,
  description,
  eyebrow,
  itemLabel,
  items,
  loading,
  managerType,
  message,
  onClearMessage,
  onDeleteItem,
  onDuplicateItem,
  onQuickUpdate,
  onSaveItem,
  onUploadMedia,
  saving,
  title,
  uploadingMedia,
}: PortfolioManagerWorkspaceProps) {
  const tokens = useAdminThemeTokens();
  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [editorMode, setEditorMode] = useState<'create' | 'update'>('create');
  const [editingId, setEditingId] = useState('');
  const [draft, setDraft] = useState<PortfolioManagerItem>(() =>
    createEmptyItem(managerType, items, categories)
  );
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [homepageFilter, setHomepageFilter] = useState<'all' | 'homepage' | 'hidden'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('order');
  const [previewItemId, setPreviewItemId] = useState('');
  const [aiTone, setAiTone] = useState<PortfolioToneStyle>('Cinematic');
  const [aiStage, setAiStage] = useState('');
  const [aiGeneratingField, setAiGeneratingField] = useState<AiGenerateField | ''>('');
  const [aiNotice, setAiNotice] = useState('');
  const [aiVisualRead, setAiVisualRead] = useState<PortfolioAiContent['visualRead'] | null>(null);
  const [aiFillPulse, setAiFillPulse] = useState(false);

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const previewItems = useMemo(
    () => items.map(item => createPreviewItem(item, categories, managerType)),
    [categories, items, managerType]
  );

  const previewMetaConfig = useMemo(
    () => createMetaConfig(items, managerType),
    [items, managerType]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const nextItems = items.filter(item => {
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.tags.some(tag => tag.toLowerCase().includes(normalizedSearch));
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'visible' ? item.visible : !item.visible);
      const matchesHomepage =
        homepageFilter === 'all' ||
        (homepageFilter === 'homepage' ? item.homepageVisible : !item.homepageVisible);
      const matchesFeatured =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured'
          ? item.homepageFeatured || item.featuredPriority > 0
          : !item.homepageFeatured && item.featuredPriority <= 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVisibility &&
        matchesHomepage &&
        matchesFeatured
      );
    });

    return [...nextItems].sort((leftItem, rightItem) => {
      if (sortMode === 'homepage') {
        if (leftItem.homepageVisible !== rightItem.homepageVisible) {
          return leftItem.homepageVisible ? -1 : 1;
        }
        return leftItem.homepageOrder - rightItem.homepageOrder;
      }

      if (sortMode === 'featured') {
        const leftScore =
          (leftItem.homepageFeatured ? 100 : 0) + (leftItem.featuredPriority || 0);
        const rightScore =
          (rightItem.homepageFeatured ? 100 : 0) + (rightItem.featuredPriority || 0);
        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }
        return leftItem.order_num - rightItem.order_num;
      }

      if (sortMode === 'newest') {
        return getSortStamp(rightItem) - getSortStamp(leftItem);
      }

      if (sortMode === 'oldest') {
        return getSortStamp(leftItem) - getSortStamp(rightItem);
      }

      if (leftItem.order_num !== rightItem.order_num) {
        return leftItem.order_num - rightItem.order_num;
      }

      return leftItem.title.localeCompare(rightItem.title);
    });
  }, [
    categoryFilter,
    featuredFilter,
    homepageFilter,
    items,
    search,
    sortMode,
    visibilityFilter,
  ]);

  const previewSelectedItem =
    previewItemId && previewItems.some(item => item.id === previewItemId)
      ? previewItems.find(item => item.id === previewItemId) || null
      : null;
  const currentEditingItem =
    editingId ? items.find(item => item.id === editingId) || null : null;
  const isDirty =
    editorMode === 'create'
      ? JSON.stringify(draft) !==
        JSON.stringify(createEmptyItem(managerType, items, categories))
      : JSON.stringify(draft) !== JSON.stringify(currentEditingItem);
  const uniqueCategoryOptions = useMemo(() => {
    const merged = new Map<string, string>();
    categories.forEach(category => merged.set(category.value, category.label));
    items.forEach(item => {
      if (item.category && !merged.has(item.category)) {
        merged.set(item.category, item.category);
      }
    });
    return Array.from(merged.entries()).map(([value, label]) => ({ value, label }));
  }, [categories, items]);
  const visibleCount = items.filter(item => item.visible).length;
  const homepageCount = items.filter(item => item.homepageVisible).length;
  const showcaseCount = items.filter(item => item.smartShowcase).length;
  const isMobile = viewportWidth < 900;
  const storyEnabled = [
    draft.storyChallenge,
    draft.storySolution,
    draft.storyTools,
    draft.storyResult,
  ].some(Boolean);
  const resolvedDraftCategory = draft.category || uniqueCategoryOptions[0]?.value || '';
  const previewSubtitle =
    draft.previewSubtitle ||
    [draft.typeLabel || getDefaultTypeLabel(managerType), resolvedDraftCategory]
      .filter(Boolean)
      .join(' • ');
  const previewDescription = draft.previewDescription || draft.description;

  function openCreate() {
    setEditorMode('create');
    setEditingId('');
    setDraft(createEmptyItem(managerType, items, uniqueCategoryOptions));
  }

  function openEdit(item: PortfolioManagerItem) {
    setEditorMode('update');
    setEditingId(item.id);
    setDraft({ ...item, tags: [...item.tags] });
  }

  async function saveDraft() {
    try {
      const savedId = await onSaveItem(
        {
          ...draft,
          category: resolvedDraftCategory,
        },
        {
          mode: editorMode,
          original: currentEditingItem,
        }
      );

      const nextId = String(savedId || draft.id || '');
      if (nextId) {
        setEditingId(nextId);
        setEditorMode('update');
        setDraft(current => ({ ...current, id: nextId }));
        return;
      }

      openCreate();
    } catch {
      // Parent handlers already surface a friendly message.
    }
  }

  async function duplicateItem(item: PortfolioManagerItem) {
    try {
      const duplicatedId = await onDuplicateItem(item);
      if (duplicatedId) {
        setEditingId(String(duplicatedId));
        setEditorMode('update');
        setDraft({
          ...item,
          id: String(duplicatedId),
          title: `${item.title} Copy`,
          order_num: getNextOrder(items),
          homepageOrder: item.homepageVisible ? getNextHomepageOrder(items) : item.homepageOrder,
        });
      }
    } catch {
      // Parent handlers already surface a friendly message.
    }
  }

  function updateProjectGalleryItem(
    index: number,
    patch: Partial<PortfolioProjectGalleryItem>
  ) {
    setDraft(current => ({
      ...current,
      projectGallery: current.projectGallery.map((galleryItem, galleryIndex) =>
        galleryIndex === index ? { ...galleryItem, ...patch } : galleryItem
      ),
    }));
  }

  function removeProjectGalleryItem(index: number) {
    setDraft(current => ({
      ...current,
      projectGallery: current.projectGallery.filter((_, galleryIndex) => galleryIndex !== index),
    }));
  }

  function appendProjectGalleryItem(url: string) {
    if (!url.trim()) {
      return;
    }

    setDraft(current => ({
      ...current,
      projectGallery: [
        ...current.projectGallery,
        {
          id: `extra-${Date.now()}`,
          title: '',
          imageUrl: url.trim(),
          sourceType: managerType,
          description: '',
          categoryName: current.category,
          formatLabel: current.formatLabel,
        },
      ],
    }));
  }

  function resolveSuggestedCategory(suggestedCategory: string, fallback: string) {
    const normalizedSuggestion = suggestedCategory.trim().toLowerCase();
    if (!normalizedSuggestion) {
      return fallback;
    }

    const matchedOption = uniqueCategoryOptions.find(
      option =>
        option.value.toLowerCase() === normalizedSuggestion ||
        option.label.toLowerCase() === normalizedSuggestion
    );

    return matchedOption?.value || fallback;
  }

  function applyAiContent(content: PortfolioAiContent, targetField: AiGenerateField) {
    setDraft(current => {
      const nextDraft = { ...current };
      const applyAll = targetField === 'all';

      if (applyAll || targetField === 'title') {
        nextDraft.title = content.title || nextDraft.title;
      }
      if (applyAll || targetField === 'description') {
        nextDraft.description = content.description || nextDraft.description;
        nextDraft.previewDescription = content.description || nextDraft.previewDescription;
      }
      if (applyAll || targetField === 'tags') {
        nextDraft.tags = content.tags?.length ? content.tags : nextDraft.tags;
      }
      if (applyAll || targetField === 'seoTitle') {
        nextDraft.seoTitle = content.seoTitle || nextDraft.seoTitle;
      }
      if (applyAll || targetField === 'seoDescription') {
        nextDraft.seoDescription = content.seoDescription || nextDraft.seoDescription;
      }
      if (applyAll || targetField === 'challenge') {
        nextDraft.storyChallenge = content.challenge || nextDraft.storyChallenge;
      }
      if (applyAll || targetField === 'solution') {
        nextDraft.storySolution = content.solution || nextDraft.storySolution;
      }
      if (applyAll || targetField === 'toolsUsed') {
        nextDraft.storyTools = content.toolsUsed || nextDraft.storyTools;
      }
      if (applyAll || targetField === 'result') {
        nextDraft.storyResult = content.result || nextDraft.storyResult;
      }
      if (applyAll || targetField === 'typeLabel') {
        nextDraft.typeLabel = content.typeLabel || nextDraft.typeLabel;
      }
      if (applyAll || targetField === 'formatLabel') {
        nextDraft.formatLabel = content.formatLabel || nextDraft.formatLabel;
      }
      if (applyAll || targetField === 'category') {
        nextDraft.category = resolveSuggestedCategory(
          content.suggestedCategory || '',
          nextDraft.category
        );
      }
      if (applyAll || targetField === 'aspectRatio') {
        nextDraft.aspectRatio = content.aspectRatio || nextDraft.aspectRatio;
      }

      return nextDraft;
    });

    setAiVisualRead(content.visualRead || null);
    setAiFillPulse(true);
    window.setTimeout(() => setAiFillPulse(false), 900);
  }

  async function generateAiContent(
    targetField: AiGenerateField = 'all',
    imageUrlOverride?: string,
    draftOverride?: PortfolioManagerItem
  ) {
    const sourceDraft = draftOverride || draft;
    const imageUrl = imageUrlOverride || sourceDraft.imageUrl || sourceDraft.coverImage;

    if (!imageUrl) {
      setAiNotice('Upload or paste an image first so the AI can read the artwork.');
      return;
    }

    setAiGeneratingField(targetField);
    setAiNotice('');
    setAiStage('Analyzing artwork...');

    const stageTimer = window.setTimeout(() => {
      setAiStage('Generating cinematic content...');
    }, 900);
    const seoTimer = window.setTimeout(() => {
      setAiStage('Optimizing SEO...');
    }, 1800);

    try {
      const response = await fetch('/api/admin/portfolio-ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: uniqueCategoryOptions.map(option => option.label),
          currentContent: {
            category: sourceDraft.category,
            description: sourceDraft.description,
            formatLabel: sourceDraft.formatLabel,
            tags: sourceDraft.tags,
            title: sourceDraft.title,
            typeLabel: sourceDraft.typeLabel,
          },
          imageUrl,
          managerType,
          targetField,
          tone: aiTone,
          youtubeUrl: sourceDraft.youtubeUrl,
        }),
      });
      const result = (await response.json()) as {
        content?: PortfolioAiContent;
        error?: string;
      };

      if (!response.ok || !result.content) {
        throw new Error(result.error || 'AI content generation failed.');
      }

      applyAiContent(result.content, targetField);
      setAiStage('');
      setAiNotice(
        targetField === 'all'
          ? 'AI content generated and filled across the portfolio draft.'
          : `${regenerateFieldOptions.find(option => option.field === targetField)?.label || 'Field'} regenerated.`
      );
    } catch (error) {
      setAiStage('');
      setAiNotice(
        error instanceof Error ? error.message : 'AI content generation failed.'
      );
    } finally {
      window.clearTimeout(stageTimer);
      window.clearTimeout(seoTimer);
      setAiGeneratingField('');
    }
  }

  async function removeItem(item: PortfolioManagerItem) {
    const confirmed = window.confirm(
      `Delete "${item.title}" থেকে ${itemLabel.toLowerCase()} permanently remove করবেন?`
    );
    if (!confirmed) {
      return;
    }

    try {
      await onDeleteItem(item);
      if (editingId === item.id) {
        openCreate();
      }
    } catch {
      // Parent handlers already surface a friendly message.
    }
  }

  const typeSuggestions =
    managerType === 'video'
      ? ['Video Edit', 'Motion Reel', 'YouTube Edit', 'Short-form Cut', 'Cinematic Highlight']
      : ['Graphic Design', 'Thumbnail', 'Poster', 'Banner', 'Logo', 'Social Creative', 'UI Design'];
  const formatSuggestions =
    managerType === 'video'
      ? ['16:9', '9:16', '1:1', 'Trailer', 'Teaser']
      : ['Social Post', 'Banner', 'Thumbnail', 'Poster', 'Print Design', 'A4'];

  return (
    <AdminShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <AdminActionButton onClick={openCreate} variant="secondary">
            {editorMode === 'create' ? 'New Draft Ready' : addLabel}
          </AdminActionButton>
          <AdminActionButton
            onClick={() => {
              if (draft.id) {
                setPreviewItemId(draft.id);
              }
            }}
            disabled={!draft.id}
            variant="ghost"
          >
            Preview Saved Item
          </AdminActionButton>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {message ? (
          <div
            onClick={onClearMessage}
            style={{ cursor: onClearMessage ? 'pointer' : 'default' }}
          >
            <AdminNotice message={message} />
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          <MetricCard label={`Total ${itemLabel}s`} tone="neutral" value={String(items.length)} />
          <MetricCard label="Portfolio Visible" tone="success" value={String(visibleCount)} />
          <MetricCard label="Homepage Live" tone="accent" value={String(homepageCount)} />
          <MetricCard label="Smart Showcase" tone="accent" value={String(showcaseCount)} />
        </div>

        <AdminPanel
          title={`${itemLabel} library`}
          description="Search, filter, preview, and reorder items from one consistent manager system."
          badge={`${filteredItems.length} visible result${filteredItems.length === 1 ? '' : 's'}`}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <AdminField
              label="Search"
              hint="Search by title, category, or tags."
              full={false}
            >
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={`Search ${itemLabel.toLowerCase()} title`}
                style={inputStyle}
              />
            </AdminField>
            <AdminField label="Category" hint="Filter by the saved content category.">
              <select
                value={categoryFilter}
                onChange={event => setCategoryFilter(event.target.value)}
                style={inputStyle}
              >
                <option value="all">All categories</option>
                {uniqueCategoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Visibility" hint="See only public or hidden items.">
              <select
                value={visibilityFilter}
                onChange={event =>
                  setVisibilityFilter(event.target.value as 'all' | 'visible' | 'hidden')
                }
                style={inputStyle}
              >
                <option value="all">All items</option>
                <option value="visible">Visible only</option>
                <option value="hidden">Hidden only</option>
              </select>
            </AdminField>
            <AdminField label="Homepage" hint="Filter items used in homepage preview.">
              <select
                value={homepageFilter}
                onChange={event =>
                  setHomepageFilter(event.target.value as 'all' | 'homepage' | 'hidden')
                }
                style={inputStyle}
              >
                <option value="all">All homepage states</option>
                <option value="homepage">Homepage visible</option>
                <option value="hidden">Homepage hidden</option>
              </select>
            </AdminField>
            <AdminField label="Featured" hint="Focus only featured or standard cards.">
              <select
                value={featuredFilter}
                onChange={event =>
                  setFeaturedFilter(event.target.value as 'all' | 'featured' | 'standard')
                }
                style={inputStyle}
              >
                <option value="all">All items</option>
                <option value="featured">Featured first</option>
                <option value="standard">Standard only</option>
              </select>
            </AdminField>
            <AdminField label="Sort" hint="Sort by order, featured priority, or age.">
              <select
                value={sortMode}
                onChange={event => setSortMode(event.target.value as SortMode)}
                style={inputStyle}
              >
                <option value="order">Portfolio order</option>
                <option value="homepage">Homepage order</option>
                <option value="featured">Featured priority</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </AdminField>
          </div>

          {loading ? (
            <div style={{ padding: '56px 20px', textAlign: 'center', color: tokens.muted }}>
              Loading {itemLabel.toLowerCase()} manager...
            </div>
          ) : filteredItems.length === 0 ? (
            <div
              style={{
                borderRadius: 22,
                border: `1px dashed ${tokens.line}`,
                background: tokens.fieldSoft,
                padding: '54px 22px',
                textAlign: 'center',
                color: tokens.muted,
              }}
            >
              No items matched this filter set. Try another category or reset the filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 24,
                    border: `1px solid ${editingId === item.id ? 'rgba(56,189,248,0.24)' : tokens.line}`,
                    background: editingId === item.id ? tokens.panelStrong : tokens.fieldSoft,
                    boxShadow: editingId === item.id ? tokens.softShadow : 'none',
                    padding: 16,
                    display: 'grid',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '112px minmax(0, 1fr) auto',
                      gap: 16,
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? '100%' : 112,
                        height: isMobile ? 180 : 74,
                        borderRadius: 18,
                        overflow: 'hidden',
                        border: `1px solid ${tokens.line}`,
                        background: tokens.field,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: managerType === 'graphic' ? 'contain' : 'cover',
                          }}
                        />
                      ) : (
                        <div style={{ color: tokens.subtle, fontSize: 12 }}>
                          {managerType === 'video' ? 'No thumbnail' : 'No artwork'}
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: tokens.text,
                            letterSpacing: '-0.04em',
                            minWidth: 0,
                          }}
                        >
                          {item.title}
                        </div>
                        <AdminChip tone={item.visible ? 'success' : 'neutral'}>
                          {item.visible ? 'Live' : 'Hidden'}
                        </AdminChip>
                        {item.homepageVisible ? (
                          <AdminChip tone="accent">Homepage</AdminChip>
                        ) : null}
                        {item.homepageFeatured || item.featuredPriority > 0 ? (
                          <AdminChip tone="accent">
                            Featured {item.featuredPriority > 0 ? item.featuredPriority : ''}
                          </AdminChip>
                        ) : null}
                        {!item.previewEnabled ? (
                          <AdminChip tone="neutral">Preview Off</AdminChip>
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          marginBottom: item.description ? 8 : 0,
                        }}
                      >
                        <span style={{ color: tokens.muted, fontSize: 13, fontWeight: 700 }}>
                          {item.category || 'Uncategorized'}
                        </span>
                        <span style={{ color: tokens.subtle, fontSize: 13 }}>
                          Portfolio order {item.order_num}
                        </span>
                        <span style={{ color: tokens.subtle, fontSize: 13 }}>
                          Homepage order {item.homepageOrder}
                        </span>
                        <span style={{ color: tokens.accentText, fontSize: 13 }}>
                          {item.typeLabel || getDefaultTypeLabel(managerType)}
                        </span>
                        {item.formatLabel ? (
                          <span style={{ color: tokens.subtle, fontSize: 13 }}>
                            {item.formatLabel}
                          </span>
                        ) : null}
                      </div>

                      {item.description ? (
                        <div
                          style={{
                            color: tokens.muted,
                            fontSize: 13,
                            lineHeight: 1.7,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                          }}
                        >
                          {item.description}
                        </div>
                      ) : null}

                      {item.tags.length > 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginTop: 10,
                          }}
                        >
                          {item.tags.slice(0, 4).map(tag => (
                            <span
                              key={tag}
                              style={{
                                borderRadius: 999,
                                border: `1px solid ${tokens.line}`,
                                background: tokens.field,
                                color: tokens.subtle,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                        justifyItems: isMobile ? 'stretch' : 'end',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(78px, 1fr))',
                          gap: 8,
                        }}
                      >
                        <input
                          key={`${item.id}-order-${item.order_num}`}
                          defaultValue={item.order_num}
                          type="number"
                          min="0"
                          onBlur={event =>
                            void onQuickUpdate(item, {
                              order_num: Number(event.target.value) || item.order_num,
                            })
                          }
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                          title="Portfolio order"
                          style={{ ...inputStyle, width: 84 }}
                        />
                        <input
                          key={`${item.id}-homepage-${item.homepageOrder}`}
                          defaultValue={item.homepageOrder}
                          type="number"
                          min="1"
                          onBlur={event =>
                            void onQuickUpdate(item, {
                              homepageOrder: Number(event.target.value) || item.homepageOrder,
                            })
                          }
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                          title="Homepage order"
                          style={{ ...inputStyle, width: 84 }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <QuickToggleButton
                          active={item.visible}
                          label={item.visible ? 'Visible' : 'Hidden'}
                          onClick={() => void onQuickUpdate(item, { visible: !item.visible })}
                        />
                        <QuickToggleButton
                          active={item.homepageVisible}
                          label={item.homepageVisible ? 'Homepage On' : 'Homepage Off'}
                          onClick={() =>
                            void onQuickUpdate(item, {
                              homepageVisible: !item.homepageVisible,
                            })
                          }
                        />
                        <QuickToggleButton
                          active={item.previewEnabled}
                          label={item.previewEnabled ? 'Preview On' : 'Preview Off'}
                          onClick={() =>
                            void onQuickUpdate(item, {
                              previewEnabled: !item.previewEnabled,
                            })
                          }
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <AdminActionButton onClick={() => setPreviewItemId(item.id)} variant="ghost">
                          Preview
                        </AdminActionButton>
                        <AdminActionButton onClick={() => openEdit(item)} variant="secondary">
                          Edit
                        </AdminActionButton>
                        <AdminActionButton
                          onClick={() => void duplicateItem(item)}
                          variant="ghost"
                        >
                          Duplicate
                        </AdminActionButton>
                        <AdminActionButton
                          onClick={() => void removeItem(item)}
                          variant="danger"
                        >
                          Delete
                        </AdminActionButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="AI smart content workflow"
          description="Upload an artwork or thumbnail, then generate polished portfolio writing that reads the image mood, lighting, genre, composition, and story direction."
          badge={aiGeneratingField ? aiStage || 'Generating...' : 'Vision-assisted'}
          actions={
            <AdminActionButton
              onClick={() => void generateAiContent('all')}
              disabled={Boolean(aiGeneratingField) || !draft.imageUrl}
            >
              {aiGeneratingField === 'all' ? aiStage || 'Generating...' : 'Generate AI Content'}
            </AdminActionButton>
          }
        >
          <div
            style={{
              display: 'grid',
              gap: 16,
              transform: aiFillPulse ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'transform 260ms ease, box-shadow 260ms ease',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                alignItems: 'end',
              }}
            >
              <AdminField
                label="Tone style"
                hint="Controls the creative direction of the generated writing."
              >
                <select
                  value={aiTone}
                  onChange={event => setAiTone(event.target.value as PortfolioToneStyle)}
                  style={inputStyle}
                >
                  {toneStyleOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField
                label="Artwork source"
                hint="AI reads the uploaded image URL currently saved in the media field."
              >
                <input
                  value={draft.imageUrl || ''}
                  readOnly
                  placeholder="Upload artwork first"
                  style={{
                    ...inputStyle,
                    color: draft.imageUrl ? tokens.text : tokens.subtle,
                  }}
                />
              </AdminField>
            </div>

            {aiStage ? (
              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${tokens.accentSoft}`,
                  background: `linear-gradient(135deg, ${tokens.accentSoft}, rgba(14,165,233,0.08))`,
                  color: tokens.accentText,
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {aiStage}
              </div>
            ) : null}

            {aiNotice ? (
              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.fieldSoft,
                  color: aiNotice.includes('failed') || aiNotice.includes('missing') ? tokens.dangerText : tokens.text,
                  padding: '14px 16px',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {aiNotice}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {regenerateFieldOptions.map(option => (
                <button
                  key={option.field}
                  type="button"
                  disabled={Boolean(aiGeneratingField) || !draft.imageUrl}
                  onClick={() => void generateAiContent(option.field)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${tokens.line}`,
                    background:
                      aiGeneratingField === option.field ? tokens.accentSoft : tokens.field,
                    color:
                      aiGeneratingField === option.field ? tokens.accentText : tokens.text,
                    cursor: aiGeneratingField || !draft.imageUrl ? 'not-allowed' : 'pointer',
                    opacity: aiGeneratingField || !draft.imageUrl ? 0.68 : 1,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    transition: 'background 180ms ease, color 180ms ease, transform 180ms ease',
                  }}
                >
                  {aiGeneratingField === option.field ? 'Regenerating...' : `Regenerate ${option.label}`}
                </button>
              ))}
            </div>

            {aiVisualRead ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 10,
                }}
              >
                {Object.entries(aiVisualRead).map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${tokens.line}`,
                      background: tokens.fieldSoft,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        color: tokens.subtle,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ color: tokens.text, fontSize: 13, lineHeight: 1.55 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </AdminPanel>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.1fr) minmax(360px, 0.92fr)',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 18 }}>
            <AdminBuilderSection
              title={`${itemLabel} editor`}
              description={`Everything for this ${itemLabel.toLowerCase()} now stays inside one advanced, section-aware editor instead of scattered fields.`}
              badge={editorMode === 'create' ? 'New Draft' : 'Editing'}
              status={isDirty ? 'Unsaved changes' : 'Saved state'}
              statusTone={isDirty ? 'accent' : 'success'}
              headerControls={
                <>
                  <div style={{ display: 'grid', gap: 6, minWidth: 86 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: tokens.muted,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Order
                    </div>
                    <input
                      type="number"
                      value={draft.order_num}
                      onChange={event =>
                        setDraft(current => ({
                          ...current,
                          order_num: Number(event.target.value) || 0,
                        }))
                      }
                      style={{ ...inputStyle, width: 86 }}
                    />
                  </div>
                  <QuickToggleButton
                    active={draft.visible}
                    label={draft.visible ? 'Portfolio Visible' : 'Portfolio Hidden'}
                    onClick={() =>
                      setDraft(current => ({
                        ...current,
                        visible: !current.visible,
                      }))
                    }
                  />
                </>
              }
              tabs={[
                {
                  id: 'content',
                  label: 'Content',
                  description: 'Title, category, description, and scanning labels live together here.',
                  content: (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField
                        label={`${itemLabel} title`}
                        hint="This is the main item title shown in admin cards and portfolio previews."
                        full
                      >
                        <input
                          value={draft.title}
                          onChange={event =>
                            setDraft(current => ({ ...current, title: event.target.value }))
                          }
                          placeholder={`Enter ${itemLabel.toLowerCase()} title`}
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Category"
                        hint="This controls which filter group the item appears under."
                      >
                        <select
                          value={resolvedDraftCategory}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              category: event.target.value,
                            }))
                          }
                          style={inputStyle}
                        >
                          {uniqueCategoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </AdminField>
                      <AdminField
                        label="Visual type label"
                        hint="This controls the professional type badge, like Video Edit, Poster, or Social Creative."
                      >
                        <>
                          <input
                            list={`${managerType}-type-suggestions`}
                            value={draft.typeLabel}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                typeLabel: event.target.value,
                              }))
                            }
                            style={inputStyle}
                          />
                          <datalist id={`${managerType}-type-suggestions`}>
                            {typeSuggestions.map(option => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </>
                      </AdminField>
                      <AdminField
                        label="Format / deliverable label"
                        hint="This helps scanning formats like 9:16, Poster, Banner, or A4."
                      >
                        <>
                          <input
                            list={`${managerType}-format-suggestions`}
                            value={draft.formatLabel}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                formatLabel: event.target.value,
                              }))
                            }
                            style={inputStyle}
                          />
                          <datalist id={`${managerType}-format-suggestions`}>
                            {formatSuggestions.map(option => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </>
                      </AdminField>
                      <AdminField
                        label="Tags"
                        hint="Comma-separated tags improve filtering, preview context, and portfolio scanning."
                        full
                      >
                        <input
                          value={toTagInput(draft.tags)}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              tags: normalizeTags(event.target.value),
                            }))
                          }
                          placeholder="branding, cinematic, reel, thumbnail"
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Description / short note"
                        hint="This controls the short supporting text shown in cards and preview details."
                        full
                      >
                        <textarea
                          value={draft.description}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          placeholder="Short explanation of the project or deliverable"
                          style={textareaStyle}
                        />
                      </AdminField>
                    </div>
                  ),
                },
                {
                  id: 'media',
                  label: 'Media',
                  description:
                    managerType === 'video'
                      ? 'Video source, custom thumbnail, and optional external preview are managed here.'
                      : 'Artwork image, ratio metadata, and clean preview media settings stay here.',
                  content: (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {managerType === 'video' ? (
                        <>
                          <AdminField
                            label="YouTube URL"
                            hint="This is the main video source. If no custom thumbnail is uploaded, a YouTube thumbnail fallback will still be used."
                            full
                          >
                            <input
                              value={draft.youtubeUrl}
                              onChange={event =>
                                setDraft(current => ({
                                  ...current,
                                  youtubeUrl: event.target.value,
                                }))
                              }
                              placeholder="https://www.youtube.com/watch?v=..."
                              style={inputStyle}
                            />
                          </AdminField>
                          <AdminField
                            label="External preview URL"
                            hint="Optional. Use this when the preview should open a different player or hosted presentation."
                            full
                          >
                            <input
                              value={draft.externalPreviewUrl}
                              onChange={event =>
                                setDraft(current => ({
                                  ...current,
                                  externalPreviewUrl: event.target.value,
                                }))
                              }
                              placeholder="Optional Vimeo / Drive / landing page preview"
                              style={inputStyle}
                            />
                          </AdminField>
                          <AdminImageField
                            label="Custom thumbnail"
                            value={draft.imageUrl}
                            onChange={value =>
                              setDraft(current => ({
                                ...current,
                                imageUrl: value,
                              }))
                            }
                            onFileSelected={async file => {
                              const nextUrl = await onUploadMedia(file, draft);
                              if (nextUrl) {
                                const nextDraft = { ...draft, imageUrl: nextUrl };
                                setDraft(current => ({ ...current, imageUrl: nextUrl }));
                                void generateAiContent('all', nextUrl, nextDraft);
                              }
                            }}
                            uploading={uploadingMedia}
                            full
                            uploadProfile="thumbnail"
                            hint="Upload JPG, PNG or WebP. Recommended 100KB-400KB, hard max 800KB."
                            previewAlt={draft.title || 'Video thumbnail'}
                          />
                        </>
                      ) : (
                        <>
                          <AdminImageField
                            label="Artwork image"
                            value={draft.imageUrl}
                            onChange={value =>
                              setDraft(current => ({
                                ...current,
                                imageUrl: value,
                              }))
                            }
                            onFileSelected={async file => {
                              const nextUrl = await onUploadMedia(file, draft);
                              if (nextUrl) {
                                const nextDraft = { ...draft, imageUrl: nextUrl };
                                setDraft(current => ({ ...current, imageUrl: nextUrl }));
                                void generateAiContent('all', nextUrl, nextDraft);
                              }
                            }}
                            uploading={uploadingMedia}
                            full
                            uploadProfile="showcase"
                            hint="Upload JPG, PNG or WebP. Showcase/gallery artwork max 1MB. The public preview preserves the full artwork."
                            previewAlt={draft.title || 'Graphic artwork'}
                            previewHeight={220}
                          />
                          <AdminField
                            label="Aspect ratio"
                            hint="Useful for premium graphic previews like 1:1, 16:9, 9:16, poster, or custom ratios."
                          >
                            <input
                              value={draft.aspectRatio}
                              onChange={event =>
                                setDraft(current => ({
                                  ...current,
                                  aspectRatio: event.target.value,
                                }))
                              }
                              placeholder="Example: 1:1, 16:9, 9:16, A4"
                              style={inputStyle}
                            />
                          </AdminField>
                          <AdminField
                            label="External preview URL"
                            hint="Optional alternate preview target, like a Behance case study or hosted deck."
                          >
                            <input
                              value={draft.externalPreviewUrl}
                              onChange={event =>
                                setDraft(current => ({
                                  ...current,
                                  externalPreviewUrl: event.target.value,
                                }))
                              }
                              placeholder="Optional external case-study URL"
                              style={inputStyle}
                            />
                          </AdminField>
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'project',
                  label: 'Project Group',
                  description:
                    'Group multiple saved items or extra uploaded designs behind one public portfolio card.',
                  content: (
                    <div style={{ display: 'grid', gap: 16 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: 14,
                        }}
                      >
                        <AdminField
                          label="Project/group id"
                          hint="Use the same id on multiple graphics/videos to collapse them into one public card."
                        >
                          <input
                            value={draft.projectId}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                projectId: event.target.value,
                              }))
                            }
                            placeholder="brand-launch-2026"
                            style={inputStyle}
                          />
                        </AdminField>
                        <AdminField
                          label="Project title"
                          hint="Shown as the single public card title when this item represents a group."
                        >
                          <input
                            value={draft.projectTitle}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                projectTitle: event.target.value,
                              }))
                            }
                            placeholder={draft.title || 'Use item title'}
                            style={inputStyle}
                          />
                        </AdminField>
                        <AdminField label="Project type" hint="Used inside the preview modal.">
                          <select
                            value={draft.projectType}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                projectType: event.target.value as PortfolioProjectType,
                              }))
                            }
                            style={inputStyle}
                          >
                            <option value="Graphic">Graphic</option>
                            <option value="Video">Video</option>
                            <option value="Mixed">Mixed</option>
                          </select>
                        </AdminField>
                        <AdminField label="Project order" hint="Lower numbers pick the cover/position first.">
                          <input
                            type="number"
                            value={draft.projectOrder}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                projectOrder: Number(event.target.value) || 0,
                              }))
                            }
                            style={inputStyle}
                          />
                        </AdminField>
                        <AdminImageField
                          label="Project cover image"
                          value={draft.projectCoverImage}
                          onChange={value =>
                            setDraft(current => ({
                              ...current,
                              projectCoverImage: value,
                            }))
                          }
                          onFileSelected={async file => {
                            const nextUrl = await onUploadMedia(file, draft);
                            if (nextUrl) {
                              setDraft(current => ({ ...current, projectCoverImage: nextUrl }));
                            }
                          }}
                          uploading={uploadingMedia}
                          full
                          uploadProfile={managerType === 'video' ? 'thumbnail' : 'showcase'}
                          hint="Optional. If empty, the first grouped item image becomes the cover."
                          previewAlt={draft.projectTitle || draft.title || 'Project cover'}
                          previewHeight={180}
                        />
                        <AdminField
                          label="Project description"
                          hint="Shown in the preview modal details panel."
                          full
                        >
                          <textarea
                            value={draft.projectDescription}
                            onChange={event =>
                              setDraft(current => ({
                                ...current,
                                projectDescription: event.target.value,
                              }))
                            }
                            placeholder={draft.previewDescription || draft.description}
                            style={textareaStyle}
                          />
                        </AdminField>
                      </div>

                      <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <QuickToggleButton
                            active={draft.projectVisible}
                            label={draft.projectVisible ? 'Project grouping visible' : 'Grouping hidden'}
                            onClick={() =>
                              setDraft(current => ({
                                ...current,
                                projectVisible: !current.projectVisible,
                              }))
                            }
                          />
                          <span style={{ color: tokens.muted, fontSize: 13 }}>
                            Existing items join this project by sharing the same project id.
                          </span>
                        </div>
                        <AdminImageField
                          label="Add extra project image/design"
                          value=""
                          onChange={appendProjectGalleryItem}
                          onFileSelected={async file => {
                            const nextUrl = await onUploadMedia(file, draft);
                            if (nextUrl) {
                              appendProjectGalleryItem(nextUrl);
                            }
                          }}
                          uploading={uploadingMedia}
                          full
                          uploadProfile={managerType === 'video' ? 'thumbnail' : 'showcase'}
                          hint="Adds gallery-only images under this project without creating a new graphics/videos row."
                          previewAlt="Extra project image"
                        />
                        {draft.projectGallery.length > 0 ? (
                          <div style={{ display: 'grid', gap: 10 }}>
                            {draft.projectGallery.map((galleryItem, galleryIndex) => (
                              <div
                                key={`${galleryItem.id}-${galleryIndex}`}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: isMobile ? '1fr' : '92px minmax(0, 1fr) auto',
                                  gap: 12,
                                  alignItems: 'center',
                                  border: `1px solid ${tokens.line}`,
                                  borderRadius: 18,
                                  background: tokens.fieldSoft,
                                  padding: 12,
                                }}
                              >
                                <div
                                  style={{
                                    height: 68,
                                    borderRadius: 14,
                                    overflow: 'hidden',
                                    background: tokens.field,
                                  }}
                                >
                                  {galleryItem.imageUrl ? (
                                    <img
                                      src={galleryItem.imageUrl}
                                      alt={galleryItem.title || 'Project gallery item'}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: galleryItem.sourceType === 'video' ? 'cover' : 'contain',
                                      }}
                                    />
                                  ) : null}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                                  <input
                                    value={galleryItem.title}
                                    onChange={event =>
                                      updateProjectGalleryItem(galleryIndex, {
                                        title: event.target.value,
                                      })
                                    }
                                    placeholder="Gallery item title"
                                    style={inputStyle}
                                  />
                                  <input
                                    value={galleryItem.imageUrl}
                                    onChange={event =>
                                      updateProjectGalleryItem(galleryIndex, {
                                        imageUrl: event.target.value,
                                      })
                                    }
                                    placeholder="Image URL"
                                    style={inputStyle}
                                  />
                                </div>
                                <AdminActionButton
                                  onClick={() => removeProjectGalleryItem(galleryIndex)}
                                  variant="danger"
                                >
                                  Remove
                                </AdminActionButton>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'layout',
                  label: 'Layout',
                  description: 'Order, homepage placement, and featured priority all stay together here.',
                  content: (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField
                        label="Portfolio order"
                        hint="Lower numbers appear earlier in the main portfolio grid."
                      >
                        <input
                          type="number"
                          value={draft.order_num}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              order_num: Number(event.target.value) || 0,
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Homepage order"
                        hint="This controls the order when the item is enabled for homepage preview."
                      >
                        <input
                          type="number"
                          min="1"
                          value={draft.homepageOrder}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              homepageOrder: Number(event.target.value) || 1,
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Featured priority"
                        hint="Higher values push featured items earlier in smart showcase mode."
                      >
                        <input
                          type="number"
                          value={draft.featuredPriority}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              featuredPriority: Number(event.target.value) || 0,
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                        <QuickToggleButton
                          active={draft.visible}
                          label={draft.visible ? 'Show in portfolio' : 'Hide from portfolio'}
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              visible: !current.visible,
                            }))
                          }
                        />
                        <QuickToggleButton
                          active={draft.homepageVisible}
                          label={
                            draft.homepageVisible
                              ? 'Show on homepage'
                              : 'Keep off homepage'
                          }
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              homepageVisible: !current.homepageVisible,
                            }))
                          }
                        />
                        <QuickToggleButton
                          active={draft.homepageFeatured}
                          label={
                            draft.homepageFeatured
                              ? 'Featured on homepage'
                              : 'Standard homepage card'
                          }
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              homepageFeatured: !current.homepageFeatured,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'preview',
                  label: 'Preview Settings',
                  description: 'Preview title, subtitle, CTA, story fields, and smart showcase behavior are grouped here.',
                  content: (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                        <QuickToggleButton
                          active={draft.previewEnabled}
                          label={draft.previewEnabled ? 'Preview enabled' : 'Preview disabled'}
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              previewEnabled: !current.previewEnabled,
                            }))
                          }
                        />
                        <QuickToggleButton
                          active={draft.smartShowcase}
                          label={draft.smartShowcase ? 'Smart showcase on' : 'Smart showcase off'}
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              smartShowcase: !current.smartShowcase,
                            }))
                          }
                        />
                      </div>
                      <AdminField
                        label="Preview title override"
                        hint="This controls the main heading inside the preview modal."
                      >
                        <input
                          value={draft.previewTitle}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              previewTitle: event.target.value,
                            }))
                          }
                          placeholder={draft.title || 'Use item title'}
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Preview subtitle override"
                        hint="This controls the subtitle below the preview heading."
                      >
                        <input
                          value={draft.previewSubtitle}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              previewSubtitle: event.target.value,
                            }))
                          }
                          placeholder={previewSubtitle}
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Preview CTA label"
                        hint="This controls the primary action button inside the preview modal."
                      >
                        <input
                          value={draft.previewCtaLabel}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              previewCtaLabel: event.target.value,
                            }))
                          }
                          placeholder="Open case study"
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Preview CTA link"
                        hint="External links open in a new tab automatically."
                      >
                        <input
                          value={draft.previewCtaLink}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              previewCtaLink: event.target.value,
                            }))
                          }
                          placeholder="/contact or https://..."
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Preview description"
                        hint="This controls the main body copy in the preview details panel."
                        full
                      >
                        <textarea
                          value={draft.previewDescription}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              previewDescription: event.target.value,
                            }))
                          }
                          placeholder={previewDescription || 'Optional premium preview description'}
                          style={textareaStyle}
                        />
                      </AdminField>
                    </div>
                  ),
                },
                {
                  id: 'display',
                  label: 'Display',
                  description: 'Card badges, CTA copy, and visibility of category/tags buttons stay together here.',
                  content: (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField
                        label="Custom card badge"
                        hint="Optional badge shown on the portfolio card."
                      >
                        <input
                          value={draft.cardBadge}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              cardBadge: event.target.value,
                            }))
                          }
                          placeholder="Featured drop"
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Card CTA label"
                        hint="Optional override for the preview label on the card footer."
                      >
                        <input
                          value={draft.cardCtaLabel}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              cardCtaLabel: event.target.value,
                            }))
                          }
                          placeholder="Watch case study"
                          style={inputStyle}
                        />
                      </AdminField>
                      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                        <QuickToggleButton
                          active={draft.showCategoryBadge}
                          label={
                            draft.showCategoryBadge
                              ? 'Show category badge'
                              : 'Hide category badge'
                          }
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              showCategoryBadge: !current.showCategoryBadge,
                            }))
                          }
                        />
                        <QuickToggleButton
                          active={draft.showTags}
                          label={draft.showTags ? 'Show tags' : 'Hide tags'}
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              showTags: !current.showTags,
                            }))
                          }
                        />
                        <QuickToggleButton
                          active={draft.showPreviewButton}
                          label={
                            draft.showPreviewButton
                              ? 'Show preview button'
                              : 'Hide preview button'
                          }
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              showPreviewButton: !current.showPreviewButton,
                            }))
                          }
                        />
                        <QuickToggleButton
                          active={draft.showHomepageBadge}
                          label={
                            draft.showHomepageBadge
                              ? 'Show homepage badge'
                              : 'Hide homepage badge'
                          }
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              showHomepageBadge: !current.showHomepageBadge,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'seo',
                  label: 'SEO & Visibility',
                  description:
                    'Search metadata, canonical preview, social images, robots, status, and display flags are controlled together.',
                  content: (
                    <SeoVisibilityPanel
                      value={{
                        seoTitle: draft.seoTitle,
                        seoDescription: draft.seoDescription,
                        canonicalUrl: draft.canonicalUrl,
                        canonicalPath: `/portfolio/${managerType === 'graphic' ? 'graphics' : 'video'}/${draft.slug || draft.id || draft.title}`,
                        ogImage: draft.ogImage,
                        coverImage: draft.coverImage || draft.imageUrl,
                        socialImage: draft.socialImage,
                        visible: draft.visible,
                        showOnHomepage: draft.homepageVisible,
                        showOnPortfolio: draft.previewEnabled,
                        featured: draft.homepageFeatured,
                        sortOrder: draft.order_num,
                        slug: draft.slug,
                        robots: draft.robots,
                        structuredDataType: draft.structuredDataType,
                        status: draft.status,
                        altText: draft.altText,
                      }}
                      titleFallback={draft.previewTitle || draft.title || `${itemLabel} portfolio item`}
                      descriptionFallback={
                        draft.previewDescription ||
                        draft.description ||
                        `Selected ${itemLabel.toLowerCase()} portfolio work by Md Minhajul Hoque.`
                      }
                      onChange={patch =>
                        setDraft(current => ({
                          ...current,
                          ...(patch.seoTitle !== undefined ? { seoTitle: patch.seoTitle } : {}),
                          ...(patch.seoDescription !== undefined
                            ? { seoDescription: patch.seoDescription }
                            : {}),
                          ...(patch.canonicalUrl !== undefined
                            ? { canonicalUrl: patch.canonicalUrl }
                            : {}),
                          ...(patch.ogImage !== undefined ? { ogImage: patch.ogImage } : {}),
                          ...(patch.coverImage !== undefined
                            ? { coverImage: patch.coverImage, imageUrl: patch.coverImage || current.imageUrl }
                            : {}),
                          ...(patch.socialImage !== undefined
                            ? { socialImage: patch.socialImage }
                            : {}),
                          ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
                          ...(patch.showOnHomepage !== undefined
                            ? { homepageVisible: patch.showOnHomepage }
                            : {}),
                          ...(patch.showOnPortfolio !== undefined
                            ? { previewEnabled: patch.showOnPortfolio }
                            : {}),
                          ...(patch.featured !== undefined
                            ? { homepageFeatured: patch.featured }
                            : {}),
                          ...(patch.sortOrder !== undefined ? { order_num: patch.sortOrder } : {}),
                          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
                          ...(patch.robots !== undefined ? { robots: patch.robots } : {}),
                          ...(patch.structuredDataType !== undefined
                            ? { structuredDataType: patch.structuredDataType }
                            : {}),
                          ...(patch.status !== undefined
                            ? { status: patch.status, visible: patch.status === 'published' }
                            : {}),
                          ...(patch.altText !== undefined ? { altText: patch.altText } : {}),
                        }))
                      }
                      onCoverUpload={async file => onUploadMedia(file, draft)}
                      onOgUpload={async file => onUploadMedia(file, draft)}
                      uploadingCover={uploadingMedia}
                      uploadingOg={uploadingMedia}
                      coverUploadProfile={managerType === 'video' ? 'thumbnail' : 'showcase'}
                      ogUploadProfile="showcase"
                    />
                  ),
                },
                {
                  id: 'story',
                  label: 'Story View',
                  description: 'Challenge, solution, tools, and result appear inside the premium preview modal when provided.',
                  content: (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField
                        label="Challenge"
                        hint="This controls the challenge line in Story View."
                      >
                        <textarea
                          value={draft.storyChallenge}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              storyChallenge: event.target.value,
                            }))
                          }
                          style={textareaStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Solution"
                        hint="This controls the solution line in Story View."
                      >
                        <textarea
                          value={draft.storySolution}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              storySolution: event.target.value,
                            }))
                          }
                          style={textareaStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Tools used"
                        hint="This controls the tools summary line in Story View."
                      >
                        <textarea
                          value={draft.storyTools}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              storyTools: event.target.value,
                            }))
                          }
                          style={textareaStyle}
                        />
                      </AdminField>
                      <AdminField
                        label="Result"
                        hint="This controls the outcome line in Story View."
                      >
                        <textarea
                          value={draft.storyResult}
                          onChange={event =>
                            setDraft(current => ({
                              ...current,
                              storyResult: event.target.value,
                            }))
                          }
                          style={textareaStyle}
                        />
                      </AdminField>
                    </div>
                  ),
                },
              ]}
            />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <AdminActionButton onClick={() => void saveDraft()} disabled={saving}>
                {saving ? 'Saving...' : editorMode === 'create' ? `Save ${itemLabel}` : 'Save Changes'}
              </AdminActionButton>
              <AdminActionButton onClick={openCreate} disabled={saving} variant="secondary">
                Reset Draft
              </AdminActionButton>
              {draft.id ? (
                <AdminActionButton
                  onClick={() => setPreviewItemId(draft.id)}
                  disabled={saving}
                  variant="ghost"
                >
                  Open Preview
                </AdminActionButton>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 18,
              position: isMobile ? 'static' : 'sticky',
              top: isMobile ? 'auto' : 94,
              alignSelf: 'start',
            }}
          >
            <AdminPreviewFrame
              title={`${itemLabel} live preview`}
              description="This small preview reflects the current editor values so content, type labels, and story visibility are easier to understand before saving."
            >
              <div
                style={{
                  borderRadius: 24,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.fieldSoft,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: managerType === 'graphic' ? '78%' : '58%',
                    background: tokens.field,
                  }}
                >
                  {draft.imageUrl ? (
                    <img
                      src={draft.imageUrl}
                      alt={draft.title || itemLabel}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: managerType === 'graphic' ? 'contain' : 'cover',
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(2,6,23,0.06) 0%, rgba(2,6,23,0.72) 100%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {draft.showCategoryBadge && draft.category ? (
                      <AdminChip tone="neutral">{draft.category}</AdminChip>
                    ) : null}
                    {draft.cardBadge ? <AdminChip tone="accent">{draft.cardBadge}</AdminChip> : null}
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <AdminChip tone="neutral">
                      {draft.typeLabel || getDefaultTypeLabel(managerType)}
                    </AdminChip>
                  </div>
                  {draft.homepageFeatured && draft.showHomepageBadge ? (
                    <div style={{ position: 'absolute', left: 12, bottom: 12 }}>
                      <AdminChip>Featured</AdminChip>
                    </div>
                  ) : null}
                </div>
                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: tokens.text,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {draft.title || `Untitled ${itemLabel}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {draft.formatLabel ? <AdminChip tone="neutral">{draft.formatLabel}</AdminChip> : null}
                    {draft.smartShowcase ? <AdminChip>Smart Showcase</AdminChip> : null}
                    {storyEnabled ? <AdminChip tone="accent">Story View</AdminChip> : null}
                  </div>
                  <div style={{ color: tokens.muted, fontSize: 14, lineHeight: 1.75 }}>
                    {previewDescription || 'Preview description will appear here once you add it.'}
                  </div>
                  {draft.showTags && draft.tags.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {draft.tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          style={{
                            borderRadius: 999,
                            border: `1px solid ${tokens.line}`,
                            background: tokens.field,
                            color: tokens.subtle,
                            padding: '6px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </AdminPreviewFrame>

            <AdminPreviewFrame
              title="Preview summary"
              description="Use this checklist to confirm how the modal and smart showcase will behave."
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: tokens.text, fontSize: 14 }}>
                  {draft.previewEnabled
                    ? 'Preview modal is enabled for this item.'
                    : 'Preview modal is disabled, so the public page will open the fallback asset or URL instead.'}
                </div>
                <div style={{ color: tokens.muted, fontSize: 14 }}>
                  Preview heading: {draft.previewTitle || draft.title || 'Untitled preview'}
                </div>
                <div style={{ color: tokens.muted, fontSize: 14 }}>
                  Preview subtitle: {previewSubtitle || 'No subtitle override yet'}
                </div>
                <div style={{ color: tokens.muted, fontSize: 14 }}>
                  Story view: {storyEnabled ? 'Enabled with supporting project narrative' : 'Not added yet'}
                </div>
                <div style={{ color: tokens.muted, fontSize: 14 }}>
                  Showcase mode: {draft.smartShowcase ? 'Included in smart showcase sorting' : 'Standard grid behavior'}
                </div>
              </div>
            </AdminPreviewFrame>
          </div>
        </div>
      </div>

      <PortfolioPreviewModal
        dark={tokens.dark}
        item={previewSelectedItem}
        itemMetaConfig={previewMetaConfig}
        items={previewItems}
        onClose={() => setPreviewItemId('')}
        onSelect={item => setPreviewItemId(item.id)}
      />
    </AdminShell>
  );
}
