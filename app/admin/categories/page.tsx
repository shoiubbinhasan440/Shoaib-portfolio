'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminShell from '@/components/admin/AdminShell';
import SeoVisibilityPanel from '@/components/admin/SeoVisibilityPanel';
import {
  AdminActionButton,
  AdminChip,
  AdminField,
  AdminNotice,
  AdminPanel,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import { adminDeleteRows, adminInsertRows, adminUpdateRows } from '@/lib/admin-data-client';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import {
  fetchPortfolioDataset,
  type PortfolioCategory,
  type PortfolioGraphic,
  type PortfolioVideo,
} from '@/lib/portfolio-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CategoryType = 'video' | 'graphic' | 'both';
type StatusFilter = 'all' | 'active' | 'hidden' | 'empty' | 'featured';

type CategoryForm = {
  name: string;
  slug: string;
  type: CategoryType;
  description: string;
  cover_image_url: string;
  icon: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  og_image_url: string;
  order_num: number;
  show_on_homepage: boolean;
  show_on_portfolio: boolean;
  show_filter_chip: boolean;
  featured: boolean;
  active: boolean;
};

type CategoryUsage = {
  graphics: number;
  total: number;
  videos: number;
};

type BulkImportItem = {
  name: string;
  slug: string;
  status: 'create' | 'skip';
  reason?: string;
};

type CategoryWritePayload = Record<string, unknown>;

const DEFAULT_CATEGORY_SEEDS: Record<CategoryType, string[]> = {
  video: [
    'Reels',
    'Short Form Video',
    'Showreel',
    'Commercial Video',
    'Corporate Video',
    'Event Highlight',
    'Documentary',
    'Motion Graphics',
    'YouTube Video',
    'Social Media Video',
    'Promo Video',
    'Campaign Video',
  ],
  graphic: [
    'Branding Design',
    'Logo Design',
    'Social Media Design',
    'YouTube Thumbnail Design',
    'Poster Design',
    'Flyer Design',
    'Banner Design',
    'Brochure / Leaflet Design',
    'Business Card Design',
    'Print Design',
    'Advertising Design',
    'Packaging Design',
    'UI/UX Design',
    'Website Design',
    'App Interface Design',
    'Motion Graphics Design',
    'Typography Design',
    'Illustration Design',
    'Photo Manipulation Design',
    'Retouching / Photo Editing',
    'Infographic Design',
    'Event Design',
    'Stage / LED Backdrop Design',
    'Certificate Design',
    'Invitation Card Design',
    'ID Card Design',
    'Book Cover Design',
    'Magazine / Editorial Design',
    'Presentation / Pitch Deck Design',
    'Apparel / T-shirt Design',
    'Product Design Visual',
    'Menu Design',
    'Company Profile Design',
    'Annual Report Design',
    'Newsletter Design',
  ],
  both: [
    'Brand Identity',
    'Campaign Creative',
    'Social Media Content',
    'Event Content',
    'Product Promotion',
    'Digital Marketing',
    'Corporate Communication',
    'Editorial Content',
  ],
};

const EMPTY_FORM: CategoryForm = {
  name: '',
  slug: '',
  type: 'video',
  description: '',
  cover_image_url: '',
  icon: '',
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  og_image_url: '',
  order_num: 0,
  show_on_homepage: true,
  show_on_portfolio: true,
  show_filter_chip: true,
  featured: false,
  active: true,
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function normalizeCategoryValue(value: string | null | undefined) {
  return (value || '').trim().toLowerCase();
}

function isCategoryType(value: string): value is CategoryType {
  return value === 'video' || value === 'graphic' || value === 'both';
}

function toForm(category: PortfolioCategory): CategoryForm {
  return {
    name: category.name || '',
    slug: category.slug || '',
    type: isCategoryType(category.type) ? category.type : 'video',
    description: category.description || '',
    cover_image_url: category.thumbnail_image || category.cover_image_url || '',
    icon: category.icon || '',
    seo_title: category.seo_title || '',
    seo_description: category.seo_description || '',
    canonical_url: category.canonical_url || '',
    og_image_url: category.og_image || category.og_image_url || '',
    order_num: category.order_num || 0,
    show_on_homepage: category.show_on_homepage ?? true,
    show_on_portfolio: category.show_on_portfolio_page ?? category.show_on_portfolio ?? true,
    show_filter_chip: category.show_filter_chip ?? true,
    featured: category.featured_category ?? category.featured ?? false,
    active: category.visibility_status ?? category.active ?? true,
  };
}

function toPayload(form: CategoryForm) {
  const slug = toSlug(form.slug || form.name);

  return {
    name: form.name.trim(),
    slug,
    type: form.type,
    description: form.description.trim() || null,
    thumbnail_image: form.cover_image_url.trim() || null,
    icon: form.icon.trim() || null,
    seo_title: form.seo_title.trim() || null,
    seo_description: form.seo_description.trim() || null,
    canonical_url: form.canonical_url.trim() || null,
    og_image: form.og_image_url.trim() || null,
    order_num: form.order_num,
    show_on_homepage: form.show_on_homepage,
    show_on_portfolio_page: form.show_on_portfolio,
    show_filter_chip: form.show_filter_chip,
    featured_category: form.featured,
    visibility_status: form.active,
    active: form.active,
  };
}

function getTypeLabel(type: string) {
  if (type === 'graphic') {
    return 'Graphics';
  }

  if (type === 'both') {
    return 'Both';
  }

  return 'Video';
}

function getPreviewLinks(category: PortfolioCategory) {
  if (category.type === 'both') {
    return [
      { label: 'Video page', href: `/portfolio/category/video/${category.slug}` },
      { label: 'Graphics page', href: `/portfolio/category/graphics/${category.slug}` },
    ];
  }

  return [
    {
      label: 'Preview page',
      href: `/portfolio/category/${category.type === 'graphic' ? 'graphics' : 'video'}/${category.slug}`,
    },
  ];
}

function getCategoryCanonicalPath(type: CategoryType, slug: string) {
  const routeType = type === 'graphic' ? 'graphics' : type === 'both' ? 'graphics' : 'video';
  return `/portfolio/category/${routeType}/${toSlug(slug)}`;
}

function getUsageForCategory(
  category: PortfolioCategory,
  videos: PortfolioVideo[],
  graphics: PortfolioGraphic[]
): CategoryUsage {
  const values = new Set([
    normalizeCategoryValue(category.slug),
    normalizeCategoryValue(category.name),
  ]);
  const videoCount =
    category.type === 'graphic'
      ? 0
      : videos.filter(video => values.has(normalizeCategoryValue(video.category))).length;
  const graphicCount =
    category.type === 'video'
      ? 0
      : graphics.filter(graphic => values.has(normalizeCategoryValue(graphic.category))).length;

  return {
    graphics: graphicCount,
    total: videoCount + graphicCount,
    videos: videoCount,
  };
}

function getUniqueImportNames(rawValue: string) {
  return rawValue
    .split('\n')
    .map(value => value.trim())
    .filter(Boolean);
}

function isCategoryVisible(category: PortfolioCategory) {
  return category.visibility_status ?? category.active ?? true;
}

function isCategoryFeatured(category: PortfolioCategory) {
  return category.featured_category ?? category.featured ?? false;
}

function isCategoryShownOnPortfolio(category: PortfolioCategory) {
  return category.show_on_portfolio_page ?? category.show_on_portfolio ?? true;
}

function getCategoryThumbnail(category: PortfolioCategory) {
  return category.thumbnail_image || category.cover_image_url || '';
}

function getSeedList(type: CategoryType) {
  return DEFAULT_CATEGORY_SEEDS[type].join('\n');
}

function getSeedButtonLabel(type: CategoryType) {
  if (type === 'video') {
    return 'Load video starter list';
  }

  if (type === 'both') {
    return 'Load shared starter list';
  }

  return 'Load graphics starter list';
}

function getMissingSchemaColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.match(/'([^']+)' column of 'categories'/)?.[1] ||
    message.match(/column "([^"]+)" of relation "categories"/)?.[1] ||
    ''
  );
}

function removeColumnFromPayload<T extends CategoryWritePayload | CategoryWritePayload[]>(
  payload: T,
  column: string
): T {
  if (Array.isArray(payload)) {
    return payload.map(item => {
      const nextItem = { ...item };
      delete nextItem[column];
      return nextItem;
    }) as T;
  }

  const nextPayload = { ...(payload as CategoryWritePayload) };
  delete nextPayload[column];
  return nextPayload as T;
}

export default function AdminCategories() {
  const router = useRouter();
  const tokens = useAdminThemeTokens();
  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens, { minHeight: 118 });
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [videos, setVideos] = useState<PortfolioVideo[]>([]);
  const [graphics, setGraphics] = useState<PortfolioGraphic[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<PortfolioCategory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PortfolioCategory | null>(null);
  const [reassignTarget, setReassignTarget] = useState('');
  const [uploadingField, setUploadingField] = useState<'cover' | 'og' | ''>('');
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkType, setBulkType] = useState<CategoryType>('graphic');
  const [bulkText, setBulkText] = useState(getSeedList('graphic'));
  const [bulkPreviewConfirmed, setBulkPreviewConfirmed] = useState(false);

  async function refreshData() {
    setLoading(true);

    try {
      const dataset = await fetchPortfolioDataset(supabase, { includeHidden: true });
      setCategories(dataset.categories || []);
      setVideos(dataset.videos || []);
      setGraphics(dataset.graphics || []);
    } catch (error) {
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Category data failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function verifyAndLoad() {
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

    void verifyAndLoad();

    return () => {
      active = false;
    };
  }, [router]);

  const usageById = useMemo(() => {
    const usage = new Map<number, CategoryUsage>();
    categories.forEach(category => {
      usage.set(category.id, getUsageForCategory(category, videos, graphics));
    });
    return usage;
  }, [categories, graphics, videos]);

  const stats = useMemo(() => {
    const empty = categories.filter(category => (usageById.get(category.id)?.total || 0) === 0).length;

    return {
      total: categories.length,
      video: categories.filter(category => category.type === 'video' || category.type === 'both').length,
      graphic: categories.filter(category => category.type === 'graphic' || category.type === 'both').length,
      visible: categories.filter(category => isCategoryVisible(category)).length,
      hidden: categories.filter(category => !isCategoryVisible(category)).length,
      empty,
    };
  }, [categories, usageById]);

  const filteredCategories = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return categories
      .filter(category => {
        if (!needle) {
          return true;
        }

        return [
          category.name,
          category.slug,
          category.description,
          category.seo_title,
          category.seo_description,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(needle));
      })
      .filter(category => typeFilter === 'all' || category.type === typeFilter)
      .filter(category => {
        if (statusFilter === 'active') {
          return isCategoryVisible(category);
        }

        if (statusFilter === 'hidden') {
          return !isCategoryVisible(category);
        }

        if (statusFilter === 'empty') {
          return (usageById.get(category.id)?.total || 0) === 0;
        }

        if (statusFilter === 'featured') {
          return isCategoryFeatured(category);
        }

        return true;
      })
      .sort((leftCategory, rightCategory) => {
        if (leftCategory.order_num !== rightCategory.order_num) {
          return leftCategory.order_num - rightCategory.order_num;
        }

        return leftCategory.name.localeCompare(rightCategory.name);
      });
  }, [categories, search, statusFilter, typeFilter, usageById]);

  const bulkImportPreview = useMemo(() => {
    const existingNames = new Set(categories.map(category => normalizeCategoryValue(category.name)));
    const existingSlugs = new Set(categories.map(category => normalizeCategoryValue(category.slug)));
    const seenNames = new Set<string>();
    const seenSlugs = new Set<string>();

    return getUniqueImportNames(bulkText).map(name => {
      const slug = toSlug(name);
      const normalizedName = normalizeCategoryValue(name);
      const normalizedSlug = normalizeCategoryValue(slug);
      let status: BulkImportItem['status'] = 'create';
      let reason = '';

      if (!slug) {
        status = 'skip';
        reason = 'Invalid slug';
      } else if (existingNames.has(normalizedName) || existingSlugs.has(normalizedSlug)) {
        status = 'skip';
        reason = 'Already exists';
      } else if (seenNames.has(normalizedName) || seenSlugs.has(normalizedSlug)) {
        status = 'skip';
        reason = 'Duplicate in import list';
      }

      seenNames.add(normalizedName);
      seenSlugs.add(normalizedSlug);

      return {
        name,
        slug,
        status,
        reason,
      } satisfies BulkImportItem;
    });
  }, [bulkText, categories]);

  const bulkCreateItems = useMemo(
    () => bulkImportPreview.filter(item => item.status === 'create'),
    [bulkImportPreview]
  );
  const bulkSkipItems = useMemo(
    () => bulkImportPreview.filter(item => item.status === 'skip'),
    [bulkImportPreview]
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, order_num: categories.length + 1 });
    setFormOpen(true);
    setMessage('');
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function openBulkImport() {
    setBulkType('graphic');
    setBulkText(getSeedList('graphic'));
    setBulkPreviewConfirmed(false);
    setBulkOpen(true);
    setMessage('');
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function openEdit(category: PortfolioCategory) {
    setEditing(category);
    setForm(toForm(category));
    setFormOpen(true);
    setMessage('');
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function updateName(value: string) {
    setForm(current => {
      const previousAutoSlug = toSlug(current.name);
      const shouldAutoSlug = !current.slug || current.slug === previousAutoSlug;

      return {
        ...current,
        name: value,
        slug: shouldAutoSlug ? toSlug(value) : current.slug,
      };
    });
  }

  async function syncCategoryReferences(previousCategory: PortfolioCategory, nextSlug: string) {
    const previousValues = Array.from(
      new Set([previousCategory.slug, previousCategory.name].filter(Boolean))
    );

    await Promise.all(
      previousValues.flatMap(value => [
        adminUpdateRows('videos', { category: nextSlug }, { category: value }),
        adminUpdateRows('graphics', { category: nextSlug }, { category: value }),
      ])
    );
  }

  async function insertCategoriesWithSchemaFallback(payload: CategoryWritePayload[]) {
    let nextPayload = payload;
    const skippedColumns: string[] = [];

    for (let attempt = 0; attempt < 16; attempt += 1) {
      try {
        await adminInsertRows('categories', nextPayload);
        return skippedColumns;
      } catch (error) {
        const missingColumn = getMissingSchemaColumn(error);
        if (!missingColumn) {
          throw error;
        }

        skippedColumns.push(missingColumn);
        nextPayload = removeColumnFromPayload(nextPayload, missingColumn);
      }
    }

    throw new Error('Category import failed after removing unsupported columns.');
  }

  async function updateCategoryWithSchemaFallback(
    payload: CategoryWritePayload,
    filters: Record<string, unknown>
  ) {
    let nextPayload = payload;
    const skippedColumns: string[] = [];

    for (let attempt = 0; attempt < 16; attempt += 1) {
      try {
        await adminUpdateRows('categories', nextPayload, filters);
        return skippedColumns;
      } catch (error) {
        const missingColumn = getMissingSchemaColumn(error);
        if (!missingColumn) {
          throw error;
        }

        skippedColumns.push(missingColumn);
        nextPayload = removeColumnFromPayload(nextPayload, missingColumn);
      }
    }

    throw new Error('Category update failed after removing unsupported columns.');
  }

  async function handleSave() {
    const payload = toPayload(form);

    if (!payload.name || !payload.slug) {
      setMessage('❌ Category name and slug are required.');
      return;
    }

    const duplicateSlug = categories.some(
      category => category.id !== editing?.id && category.slug === payload.slug
    );
    if (duplicateSlug) {
      setMessage('❌ Slug must be unique. Please choose another slug.');
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await updateCategoryWithSchemaFallback(payload, { id: editing.id });
        if (editing.slug !== payload.slug || editing.name !== payload.name) {
          await syncCategoryReferences(editing, payload.slug);
        }
      } else {
        await insertCategoriesWithSchemaFallback([payload]);
      }

      setMessage(editing ? '✅ Category updated and synced across portfolio items.' : '✅ Category created.');
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Category save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkImport() {
    if (bulkCreateItems.length === 0) {
      setMessage('❌ No new categories to import. Existing names/slugs were skipped.');
      return;
    }

    if (!bulkPreviewConfirmed) {
      setMessage('❌ Please confirm the preview before importing.');
      return;
    }

    if (!confirm(`Create ${bulkCreateItems.length} ${getTypeLabel(bulkType).toLowerCase()} categories and skip ${bulkSkipItems.length}?`)) {
      return;
    }

    setSaving(true);

    try {
      const maxOrder = categories.reduce(
        (maxValue, category) => Math.max(maxValue, category.order_num || 0),
        0
      );
      const payload = bulkCreateItems.map((item, index) => ({
        name: item.name,
        slug: item.slug,
        type: bulkType,
        description: `Selected works and portfolio items under ${item.name}.`,
        seo_title: `${item.name} | Md Minhajul Hoque`,
        seo_description: `Selected works and portfolio items under ${item.name}.`,
        order_num: maxOrder + index + 1,
        active: true,
        visibility_status: true,
        show_filter_chip: true,
        show_on_portfolio_page: true,
        show_on_homepage: false,
        featured_category: false,
        thumbnail_image: null,
        icon: null,
        canonical_url: null,
        og_image: null,
      }));

      const skippedColumns = await insertCategoriesWithSchemaFallback(payload);
      setMessage(
        `✅ Bulk import complete: ${payload.length} created, ${bulkSkipItems.length} skipped.${
          skippedColumns.length > 0
            ? ` Unsupported DB columns skipped: ${Array.from(new Set(skippedColumns)).join(', ')}.`
            : ''
        }`
      );
      setBulkPreviewConfirmed(false);
      setBulkOpen(false);
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Bulk import failed.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadCategoryImage(file: File, field: 'cover' | 'og') {
    setUploadingField(field);

    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const path = `categories/${field}-${Date.now()}.${extension}`;
      const { publicUrl } = await adminUploadFile('media', path, file, {
        uploadProfile: field === 'cover' ? 'thumbnail' : 'showcase',
      });
      setForm(current => ({
        ...current,
        [field === 'cover' ? 'cover_image_url' : 'og_image_url']: publicUrl,
      }));
    } finally {
      setUploadingField('');
    }
  }

  async function updateCategory(category: PortfolioCategory, patch: Partial<CategoryForm>) {
    const safePatch = { ...patch };
    delete safePatch.cover_image_url;
    delete safePatch.featured;
    delete safePatch.og_image_url;
    delete safePatch.show_on_portfolio;
    const payload = {
      ...safePatch,
      ...(typeof patch.active === 'boolean' ? { visibility_status: patch.active } : {}),
      ...(typeof patch.featured === 'boolean' ? { featured_category: patch.featured } : {}),
      ...(typeof patch.show_on_portfolio === 'boolean'
        ? { show_on_portfolio_page: patch.show_on_portfolio }
        : {}),
      ...(typeof patch.cover_image_url === 'string'
        ? { thumbnail_image: patch.cover_image_url }
        : {}),
      ...(typeof patch.og_image_url === 'string' ? { og_image: patch.og_image_url } : {}),
    };
    await updateCategoryWithSchemaFallback(payload, { id: category.id });
    setCategories(current =>
      current.map(item => (item.id === category.id ? ({ ...item, ...payload } as PortfolioCategory) : item))
    );
  }

  async function handleBulkVisibility(active: boolean) {
    if (selectedIds.length === 0) {
      setMessage('❌ Select at least one category first.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          updateCategoryWithSchemaFallback({ active, visibility_status: active }, { id })
        )
      );
      setCategories(current =>
        current.map(category =>
          selectedIds.includes(category.id)
            ? { ...category, active, visibility_status: active }
            : category
        )
      );
      setSelectedIds([]);
      setMessage(active ? '✅ Selected categories are active.' : '✅ Selected categories are hidden.');
    } catch (error) {
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Bulk update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkDeleteSafe() {
    const safeIds = selectedIds.filter(id => (usageById.get(id)?.total || 0) === 0);

    if (safeIds.length === 0) {
      setMessage('❌ Selected categories contain portfolio items. Hide or reassign them first.');
      return;
    }

    if (!confirm(`Delete ${safeIds.length} empty categories?`)) {
      return;
    }

    setSaving(true);
    try {
      await Promise.all(safeIds.map(id => adminDeleteRows('categories', { id })));
      setSelectedIds(current => current.filter(id => !safeIds.includes(id)));
      setMessage('✅ Empty selected categories deleted.');
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Bulk delete failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: PortfolioCategory) {
    const usage = usageById.get(category.id);
    if ((usage?.total || 0) > 0) {
      setPendingDelete(category);
      setReassignTarget('');
      return;
    }

    if (!confirm(`Delete empty category "${category.name}"?`)) {
      return;
    }

    await adminDeleteRows('categories', { id: category.id });
    setMessage('✅ Empty category deleted.');
    await refreshData();
  }

  async function reassignAndDelete() {
    if (!pendingDelete || !reassignTarget) {
      setMessage('❌ Choose a reassignment category first.');
      return;
    }

    setSaving(true);
    try {
      await syncCategoryReferences(pendingDelete, reassignTarget);
      await adminDeleteRows('categories', { id: pendingDelete.id });
      setPendingDelete(null);
      setReassignTarget('');
      setMessage('✅ Items reassigned and category deleted.');
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Reassign failed.');
    } finally {
      setSaving(false);
    }
  }

  async function hidePendingCategory() {
    if (!pendingDelete) {
      return;
    }

    await updateCategory(pendingDelete, { active: false });
    setPendingDelete(null);
    setMessage('✅ Category hidden. Portfolio items remain safely connected.');
  }

  async function moveCategory(category: PortfolioCategory, direction: 'up' | 'down') {
    const ordered = [...categories].sort((left, right) => left.order_num - right.order_num);
    const index = ordered.findIndex(item => item.id === category.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const swapCategory = ordered[swapIndex];

    if (!swapCategory) {
      return;
    }

    await Promise.all([
      adminUpdateRows('categories', { order_num: swapCategory.order_num }, { id: category.id }),
      adminUpdateRows('categories', { order_num: category.order_num }, { id: swapCategory.id }),
    ]);
    setCategories(current =>
      current.map(item => {
        if (item.id === category.id) {
          return { ...item, order_num: swapCategory.order_num };
        }

        if (item.id === swapCategory.id) {
          return { ...item, order_num: category.order_num };
        }

        return item;
      })
    );
  }

  async function dropCategory(targetCategory: PortfolioCategory) {
    if (!draggingId || draggingId === targetCategory.id) {
      setDraggingId(null);
      return;
    }

    const draggedCategory = categories.find(category => category.id === draggingId);
    if (!draggedCategory) {
      setDraggingId(null);
      return;
    }

    setDraggingId(null);
    await Promise.all([
      adminUpdateRows('categories', { order_num: targetCategory.order_num }, { id: draggedCategory.id }),
      adminUpdateRows('categories', { order_num: draggedCategory.order_num }, { id: targetCategory.id }),
    ]);
    setCategories(current =>
      current.map(item => {
        if (item.id === draggedCategory.id) {
          return { ...item, order_num: targetCategory.order_num };
        }

        if (item.id === targetCategory.id) {
          return { ...item, order_num: draggedCategory.order_num };
        }

        return item;
      })
    );
  }

  const statCards = [
    { label: 'Total categories', value: stats.total },
    { label: 'Video taxonomy', value: stats.video },
    { label: 'Graphics taxonomy', value: stats.graphic },
    { label: 'Visible / hidden', value: `${stats.visible}/${stats.hidden}` },
    { label: 'Empty categories', value: stats.empty },
  ];

  return (
    <AdminShell
      eyebrow="Category Manager"
      title="Central taxonomy control for portfolio content"
      description="Manage the category system used by videos, graphics, homepage filters, portfolio archives, category pages, card chips, and SEO metadata."
      actions={
        <>
          <AdminActionButton href="/admin/videos" variant="secondary">
            Video Manager
          </AdminActionButton>
          <AdminActionButton href="/admin/graphics" variant="secondary">
            Graphics Manager
          </AdminActionButton>
          <AdminActionButton onClick={openBulkImport} variant="secondary">
            Bulk Import Categories
          </AdminActionButton>
          <AdminActionButton onClick={openCreate}>
            New Category
          </AdminActionButton>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {message ? <AdminNotice message={message} /> : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {statCards.map(card => (
            <div
              key={card.label}
              style={{
                border: `1px solid ${tokens.line}`,
                borderRadius: 22,
                background: tokens.panelStrong,
                boxShadow: tokens.softShadow,
                padding: 18,
              }}
            >
              <div style={{ color: tokens.subtle, fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                {card.label}
              </div>
              <div style={{ marginTop: 8, color: tokens.text, fontSize: 26, fontWeight: 900 }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {bulkOpen ? (
          <AdminPanel
            title="Bulk import categories"
            description="Preview the generated slugs, duplicate skips, visibility defaults, and ordering before inserting categories through the protected admin write route."
            badge={`${bulkCreateItems.length} ready / ${bulkSkipItems.length} skipped`}
            actions={
              <>
                <AdminActionButton
                  onClick={() => {
                    setBulkOpen(false);
                    setBulkPreviewConfirmed(false);
                  }}
                  variant="secondary"
                >
                  Close Import
                </AdminActionButton>
                <AdminActionButton
                  onClick={() => void handleBulkImport()}
                  disabled={saving || bulkCreateItems.length === 0 || !bulkPreviewConfirmed}
                >
                  {saving ? 'Importing...' : 'Import Categories'}
                </AdminActionButton>
              </>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <AdminField label="Category type" hint="Custom pasted categories can be Video, Graphics, or Both.">
                <select
                  value={bulkType}
                  onChange={event => {
                    const nextType = event.target.value as CategoryType;
                    setBulkType(nextType);
                    setBulkText(getSeedList(nextType));
                    setBulkPreviewConfirmed(false);
                  }}
                  style={inputStyle}
                >
                  <option value="video">Video</option>
                  <option value="graphic">Graphics</option>
                  <option value="both">Both</option>
                </select>
              </AdminField>
              <AdminField label="Seed utility" hint="Load a starter list for the selected category type, then edit it before import.">
                <AdminActionButton
                  onClick={() => {
                    setBulkText(getSeedList(bulkType));
                    setBulkPreviewConfirmed(false);
                  }}
                  variant="secondary"
                >
                  {getSeedButtonLabel(bulkType)}
                </AdminActionButton>
              </AdminField>
              <AdminField
                label="Paste categories line-by-line"
                hint="One category per line. Names and slugs that already exist will be skipped automatically."
                full
              >
                <textarea
                  value={bulkText}
                  onChange={event => {
                    setBulkText(event.target.value);
                    setBulkPreviewConfirmed(false);
                  }}
                  style={{ ...textareaStyle, minHeight: 220 }}
                />
              </AdminField>
              <AdminField
                label="Import defaults"
                hint="New imports are active, shown in portfolio filters/category pages, hidden from homepage by default, and receive SEO placeholder descriptions."
                full
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 10,
                  }}
                >
                  {[
                    ['Type', getTypeLabel(bulkType)],
                    ['Visible', 'Yes'],
                    ['Filter chip', 'Yes'],
                    ['Portfolio page', 'Yes'],
                    ['Homepage', 'Hidden'],
                    ['Sort order', 'List order'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        border: `1px solid ${tokens.line}`,
                        borderRadius: 16,
                        background: tokens.fieldSoft,
                        padding: 12,
                      }}
                    >
                      <div style={{ color: tokens.subtle, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                        {label}
                      </div>
                      <div style={{ color: tokens.text, fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </AdminField>
            </div>

            <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <AdminChip tone="success">{bulkCreateItems.length} will create</AdminChip>
                  <AdminChip tone={bulkSkipItems.length > 0 ? 'neutral' : 'success'}>
                    {bulkSkipItems.length} skipped
                  </AdminChip>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: tokens.text,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bulkPreviewConfirmed}
                    onChange={event => setBulkPreviewConfirmed(event.target.checked)}
                  />
                  I reviewed the preview
                </label>
              </div>

              <div
                style={{
                  border: `1px solid ${tokens.line}`,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: tokens.fieldSoft,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px minmax(160px, 1fr) minmax(120px, 0.8fr) minmax(110px, 0.6fr)',
                    gap: 10,
                    padding: '11px 14px',
                    color: tokens.subtle,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${tokens.line}`,
                  }}
                >
                  <span>Order</span>
                  <span>Name</span>
                  <span>Slug</span>
                  <span>Status</span>
                </div>
                <div style={{ maxHeight: 360, overflow: 'auto' }}>
                  {bulkImportPreview.length === 0 ? (
                    <div style={{ padding: 18, color: tokens.muted }}>Paste category names to preview the import.</div>
                  ) : (
                    bulkImportPreview.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '72px minmax(160px, 1fr) minmax(120px, 0.8fr) minmax(110px, 0.6fr)',
                          gap: 10,
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderBottom:
                            index === bulkImportPreview.length - 1
                              ? 'none'
                              : `1px solid ${tokens.line}`,
                          color: item.status === 'create' ? tokens.text : tokens.muted,
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>{index + 1}</span>
                        <span style={{ fontWeight: 800 }}>{item.name}</span>
                        <span style={{ fontFamily: 'monospace', color: tokens.subtle }}>/{item.slug}</span>
                        <span>
                          <AdminChip tone={item.status === 'create' ? 'success' : 'neutral'}>
                            {item.status === 'create' ? 'Create' : item.reason || 'Skip'}
                          </AdminChip>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </AdminPanel>
        ) : null}

        {formOpen ? (
          <AdminPanel
            title={editing ? 'Quick edit category' : 'Create category'}
            description="Control naming, category scope, portfolio visibility, filter chips, homepage availability, and search preview data from one place."
            badge={editing ? editing.slug : 'New taxonomy'}
            actions={
              <>
                <AdminActionButton onClick={() => { setFormOpen(false); setEditing(null); setForm(EMPTY_FORM); }} variant="secondary">
                  Cancel
                </AdminActionButton>
                <AdminActionButton onClick={() => void handleSave()} disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
                </AdminActionButton>
              </>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              <AdminField label="Category name" hint="Shown on cards, filters, and category pages.">
                <input value={form.name} onChange={event => updateName(event.target.value)} style={inputStyle} placeholder="Minimal Design" />
              </AdminField>
              <AdminField label="Slug" hint="Auto-generated, but you can edit it manually. Must be unique.">
                <input value={form.slug} onChange={event => setForm(current => ({ ...current, slug: toSlug(event.target.value) }))} style={inputStyle} placeholder="minimal-design" />
              </AdminField>
              <AdminField label="Category type" hint="Controls Video/Graphics manager dropdowns and public category routes.">
                <select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as CategoryType }))} style={inputStyle}>
                  <option value="video">Video</option>
                  <option value="graphic">Graphics</option>
                  <option value="both">Both</option>
                </select>
              </AdminField>
              <AdminField label="Display order">
                <input type="number" value={form.order_num} onChange={event => setForm(current => ({ ...current, order_num: Number(event.target.value) || 0 }))} style={inputStyle} />
              </AdminField>
              <AdminField label="Icon / emoji" hint="Optional small visual marker for admin and future category UI.">
                <input value={form.icon} onChange={event => setForm(current => ({ ...current, icon: event.target.value }))} style={inputStyle} placeholder="✦" />
              </AdminField>
              <AdminField label="Description" full hint="Used as public category context and SEO fallback.">
                <textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} style={textareaStyle} />
              </AdminField>
              <div style={{ gridColumn: '1 / -1' }}>
                <SeoVisibilityPanel
                  value={{
                    seoTitle: form.seo_title,
                    seoDescription: form.seo_description,
                    canonicalUrl: form.canonical_url,
                    canonicalPath: getCategoryCanonicalPath(form.type, form.slug || form.name),
                    ogImage: form.og_image_url,
                    coverImage: form.cover_image_url,
                    socialImage: form.og_image_url,
                    visible: form.active,
                    showOnHomepage: form.show_on_homepage,
                    showOnPortfolio: form.show_on_portfolio,
                    featured: form.featured,
                    sortOrder: form.order_num,
                    slug: form.slug,
                    robots: form.active ? 'index-follow' : 'noindex-nofollow',
                    structuredDataType: 'CollectionPage',
                    status: form.active ? 'published' : 'hidden',
                    altText: form.name ? `${form.name} category cover` : '',
                  }}
                  titleFallback={`${form.name || 'Category'} | Md Minhajul Hoque`}
                  descriptionFallback={
                    form.description ||
                    `Selected works and portfolio items under ${form.name || 'this category'}.`
                  }
                  onChange={patch =>
                    setForm(current => ({
                      ...current,
                      ...(patch.seoTitle !== undefined ? { seo_title: patch.seoTitle } : {}),
                      ...(patch.seoDescription !== undefined
                        ? { seo_description: patch.seoDescription }
                        : {}),
                      ...(patch.canonicalUrl !== undefined ? { canonical_url: patch.canonicalUrl } : {}),
                      ...(patch.ogImage !== undefined ? { og_image_url: patch.ogImage } : {}),
                      ...(patch.coverImage !== undefined
                        ? { cover_image_url: patch.coverImage }
                        : {}),
                      ...(patch.socialImage !== undefined ? { og_image_url: patch.socialImage } : {}),
                      ...(patch.visible !== undefined ? { active: patch.visible } : {}),
                      ...(patch.showOnHomepage !== undefined
                        ? { show_on_homepage: patch.showOnHomepage }
                        : {}),
                      ...(patch.showOnPortfolio !== undefined
                        ? { show_on_portfolio: patch.showOnPortfolio }
                        : {}),
                      ...(patch.featured !== undefined ? { featured: patch.featured } : {}),
                      ...(patch.sortOrder !== undefined ? { order_num: patch.sortOrder } : {}),
                      ...(patch.slug !== undefined ? { slug: toSlug(patch.slug) } : {}),
                      ...(patch.status !== undefined
                        ? { active: patch.status === 'published' }
                        : {}),
                    }))
                  }
                  onCoverUpload={file => uploadCategoryImage(file, 'cover')}
                  onOgUpload={file => uploadCategoryImage(file, 'og')}
                  uploadingCover={uploadingField === 'cover'}
                  uploadingOg={uploadingField === 'og'}
                  showPortfolioToggle
                  helperText="Category SEO controls category pages, filter visibility, homepage visibility, cover images, social previews, and sitemap eligibility."
                />
                <div style={{ marginTop: 12 }}>
                  <AdminField label="Filter chip visibility" hint="Hide this category from filter chips while keeping existing content connected.">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${tokens.line}`, borderRadius: 16, padding: 12, background: tokens.fieldSoft, color: tokens.text, fontSize: 13, fontWeight: 800 }}>
                      <input
                        type="checkbox"
                        checked={form.show_filter_chip}
                        onChange={event => setForm(current => ({ ...current, show_filter_chip: event.target.checked }))}
                      />
                      Show filter chip
                    </label>
                  </AdminField>
                </div>
              </div>
            </div>
          </AdminPanel>
        ) : null}

        {pendingDelete ? (
          <AdminPanel
            title="Deletion safety check"
            description={`This category has ${usageById.get(pendingDelete.id)?.total || 0} items. Reassign the items, or hide the category instead.`}
            badge={pendingDelete.name}
            actions={
              <>
                <AdminActionButton onClick={() => setPendingDelete(null)} variant="secondary">
                  Cancel
                </AdminActionButton>
                <AdminActionButton onClick={() => void hidePendingCategory()} variant="secondary">
                  Hide Category
                </AdminActionButton>
                <AdminActionButton onClick={() => void reassignAndDelete()} variant="danger" disabled={saving || !reassignTarget}>
                  Reassign & Delete
                </AdminActionButton>
              </>
            }
          >
            <AdminField label="Reassign items to" hint="Items currently attached to the old slug/name will be moved to this category slug before deletion.">
              <select value={reassignTarget} onChange={event => setReassignTarget(event.target.value)} style={inputStyle}>
                <option value="">Choose target category</option>
                {categories
                  .filter(category => category.id !== pendingDelete.id)
                  .map(category => (
                    <option key={category.id} value={category.slug}>
                      {category.name} /{category.slug}
                    </option>
                  ))}
              </select>
            </AdminField>
          </AdminPanel>
        ) : null}

        <AdminPanel
          title="Category control center"
          description="Search, filter, bulk update, reorder, preview, and edit every taxonomy entry used by the public portfolio."
          badge={`${filteredCategories.length} shown`}
          actions={
            <>
              <AdminActionButton onClick={() => void handleBulkVisibility(true)} variant="secondary" disabled={saving || selectedIds.length === 0}>
                Show Selected
              </AdminActionButton>
              <AdminActionButton onClick={() => void handleBulkVisibility(false)} variant="secondary" disabled={saving || selectedIds.length === 0}>
                Hide Selected
              </AdminActionButton>
              <AdminActionButton onClick={() => void handleBulkDeleteSafe()} variant="danger" disabled={saving || selectedIds.length === 0}>
                Delete Empty
              </AdminActionButton>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
            <AdminField label="Search categories">
              <input value={search} onChange={event => setSearch(event.target.value)} style={inputStyle} placeholder="Name, slug, SEO text..." />
            </AdminField>
            <AdminField label="Type">
              <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as 'all' | CategoryType)} style={inputStyle}>
                <option value="all">All types</option>
                <option value="video">Video</option>
                <option value="graphic">Graphics</option>
                <option value="both">Both</option>
              </select>
            </AdminField>
            <AdminField label="Status">
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} style={inputStyle}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
                <option value="featured">Featured</option>
                <option value="empty">Empty categories</option>
              </select>
            </AdminField>
          </div>

          {loading ? (
            <div style={{ padding: '60px 20px', color: tokens.muted, textAlign: 'center' }}>Loading central taxonomy...</div>
          ) : filteredCategories.length === 0 ? (
            <div style={{ border: `1px dashed ${tokens.line}`, borderRadius: 24, background: tokens.fieldSoft, padding: 46, textAlign: 'center', color: tokens.muted }}>
              <div style={{ color: tokens.text, fontSize: 22, fontWeight: 900, marginBottom: 8 }}>No categories matched</div>
              <p style={{ margin: '0 auto 18px', maxWidth: 520, lineHeight: 1.7 }}>
                Create a category or clear filters to bring the portfolio taxonomy back into view.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <AdminActionButton onClick={openBulkImport} variant="secondary">
                  Bulk import categories
                </AdminActionButton>
                <AdminActionButton onClick={openCreate}>Create first category</AdminActionButton>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredCategories.map(category => {
                const usage = usageById.get(category.id) || { total: 0, videos: 0, graphics: 0 };
                const selected = selectedIds.includes(category.id);
                const visible = isCategoryVisible(category);
                const featured = isCategoryFeatured(category);
                const thumbnail = getCategoryThumbnail(category);
                const shownOnPortfolio = isCategoryShownOnPortfolio(category);

                return (
                  <article
                    key={category.id}
                    draggable
                    onDragStart={() => setDraggingId(category.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={event => event.preventDefault()}
                    onDrop={() => void dropCategory(category)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 14,
                      alignItems: 'center',
                      border: `1px solid ${selected ? 'rgba(37,99,235,0.42)' : tokens.line}`,
                      borderRadius: 24,
                      background: selected ? tokens.panelStrong : tokens.fieldSoft,
                      boxShadow: selected ? tokens.softShadow : 'none',
                      cursor: 'grab',
                      opacity: draggingId === category.id ? 0.58 : 1,
                      padding: 14,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={event =>
                        setSelectedIds(current =>
                          event.target.checked
                            ? [...current, category.id]
                            : current.filter(id => id !== category.id)
                        )
                      }
                      aria-label={`Select ${category.name}`}
                    />
                    <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                      <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 18, overflow: 'hidden', background: tokens.field, border: `1px solid ${tokens.line}`, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                        {thumbnail ? (
                          <Image src={thumbnail} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 22 }}>{category.icon || '▦'}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, color: tokens.text, fontSize: 17, fontWeight: 900 }}>
                            {category.icon ? `${category.icon} ` : ''}{category.name}
                          </h3>
                          <AdminChip tone={visible ? 'success' : 'neutral'}>
                            {visible ? 'Active' : 'Hidden'}
                          </AdminChip>
                          {featured ? <AdminChip>Featured</AdminChip> : null}
                        </div>
                        <div style={{ color: tokens.subtle, fontSize: 12, marginTop: 6, fontFamily: 'monospace' }}>
                          /{category.slug}
                        </div>
                        <p style={{ margin: '8px 0 0', color: tokens.muted, fontSize: 13, lineHeight: 1.55, maxWidth: 700 }}>
                          {category.description || 'No description added yet.'}
                        </p>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                          <AdminChip tone="neutral">{getTypeLabel(category.type)}</AdminChip>
                          <AdminChip tone="neutral">{usage.total} items</AdminChip>
                          <AdminChip tone="neutral">{usage.videos} videos</AdminChip>
                          <AdminChip tone="neutral">{usage.graphics} graphics</AdminChip>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 8, color: tokens.muted, fontSize: 12 }}>
                      <div>Homepage: <strong style={{ color: category.show_on_homepage === false ? tokens.subtle : tokens.successText }}>{category.show_on_homepage === false ? 'Hidden' : 'Visible'}</strong></div>
                      <div>Portfolio page: <strong style={{ color: shownOnPortfolio ? tokens.successText : tokens.subtle }}>{shownOnPortfolio ? 'Visible' : 'Hidden'}</strong></div>
                      <div>Filter chip: <strong style={{ color: category.show_filter_chip === false ? tokens.subtle : tokens.successText }}>{category.show_filter_chip === false ? 'Hidden' : 'Visible'}</strong></div>
                      <div>Sort order: <strong style={{ color: tokens.text }}>{category.order_num}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <AdminActionButton onClick={() => void moveCategory(category, 'up')} variant="ghost">
                        Up
                      </AdminActionButton>
                      <AdminActionButton onClick={() => void moveCategory(category, 'down')} variant="ghost">
                        Down
                      </AdminActionButton>
                      <AdminActionButton onClick={() => void updateCategory(category, { active: !visible })} variant="secondary">
                        {visible ? 'Hide' : 'Show'}
                      </AdminActionButton>
                      <AdminActionButton onClick={() => void updateCategory(category, { featured: !featured })} variant="secondary">
                        {featured ? 'Unfeature' : 'Feature'}
                      </AdminActionButton>
                      <AdminActionButton onClick={() => openEdit(category)} variant="secondary">
                        Edit
                      </AdminActionButton>
                      {getPreviewLinks(category).map(link => (
                        <Link key={link.href} href={link.href} target="_blank" style={{ color: tokens.accentText, fontSize: 12, fontWeight: 800, alignSelf: 'center', textDecoration: 'none' }}>
                          {link.label}
                        </Link>
                      ))}
                      <AdminActionButton onClick={() => void handleDelete(category)} variant="danger">
                        Delete
                      </AdminActionButton>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
