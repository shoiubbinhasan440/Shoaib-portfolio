export type SeoPageId = 'home' | 'portfolio' | 'about' | 'contact' | 'tutorial';
export type TwitterCardType = 'summary' | 'summary_large_image';

export type SeoPageSettings = {
  canonicalPath: string;
  keywords: string;
  ogDescription: string;
  ogImage: string;
  ogImageAlt: string;
  ogTitle: string;
  seoDescription: string;
  seoTitle: string;
  twitterCard: TwitterCardType;
};

export type SiteSeoSettings = {
  canonicalUrl: string;
  defaultOgImage: string;
  defaultOgImageAlt: string;
  keywords: string;
  metaDescription: string;
  robotsFollow: boolean;
  robotsIndex: boolean;
  robotsNoarchive: boolean;
  sitemapEnabled: boolean;
  sitemapIncludeImages: boolean;
  siteTitle: string;
  structuredDataEnabled: boolean;
  structuredDataType: 'person' | 'professional-service';
  twitterCard: TwitterCardType;
  pages: Record<SeoPageId, SeoPageSettings>;
};

export type SeoChecklistItem = {
  label: string;
  note: string;
  status: 'pass' | 'warning';
  weight: number;
};

export const SEO_PAGE_OPTIONS: Array<{ id: SeoPageId; label: string; path: string }> = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'portfolio', label: 'Portfolio', path: '/portfolio' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'contact', label: 'Contact', path: '/contact' },
  { id: 'tutorial', label: 'Tutorial', path: '/tutorial' },
];

const PAGE_DEFAULT_COPY: Record<SeoPageId, { description: string; suffix: string }> = {
  home: {
    description: 'Portfolio homepage showcasing cinematic editing, motion design, and selected creative work.',
    suffix: 'Creative Portfolio',
  },
  portfolio: {
    description: 'Browse selected portfolio work across video editing, graphics, and branded visual storytelling.',
    suffix: 'Portfolio Work',
  },
  about: {
    description: 'Learn about the creative direction, services, workflow, and story behind the portfolio.',
    suffix: 'About',
  },
  contact: {
    description: 'Contact the studio for video editing, graphics, motion design, and project collaboration.',
    suffix: 'Contact',
  },
  tutorial: {
    description: 'Explore tutorials, lessons, and breakdowns on editing, motion, and creative workflows.',
    suffix: 'Tutorials',
  },
};

function optionForPage(pageId: SeoPageId) {
  return SEO_PAGE_OPTIONS.find(option => option.id === pageId) || SEO_PAGE_OPTIONS[0];
}

export function normalizeCanonicalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return '';
  }
}

export function normalizeCanonicalPath(value: string, fallback: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

export function splitKeywords(value: string) {
  return value
    .split(',')
    .map(keyword => keyword.trim())
    .filter(Boolean);
}

export function createDefaultSeoPageSettings(
  pageId: SeoPageId,
  siteName: string
): SeoPageSettings {
  const option = optionForPage(pageId);
  const copy = PAGE_DEFAULT_COPY[pageId];

  return {
    canonicalPath: option.path,
    keywords: '',
    ogDescription: '',
    ogImage: '',
    ogImageAlt: '',
    ogTitle: '',
    seoDescription: pageId === 'home' ? copy.description : '',
    seoTitle: pageId === 'home' ? `${siteName} | ${copy.suffix}` : '',
    twitterCard: 'summary_large_image',
  };
}

export function createDefaultSiteSeoSettings(
  siteName: string,
  options?: {
    canonicalUrl?: string;
    metaDescription?: string;
    socialPreviewImage?: string;
    metaTitle?: string;
  }
): SiteSeoSettings {
  const pages = SEO_PAGE_OPTIONS.reduce(
    (collection, page) => {
      collection[page.id] = createDefaultSeoPageSettings(page.id, siteName);
      return collection;
    },
    {} as Record<SeoPageId, SeoPageSettings>
  );

  return {
    canonicalUrl: normalizeCanonicalUrl(options?.canonicalUrl || ''),
    defaultOgImage: options?.socialPreviewImage || '',
    defaultOgImageAlt: '',
    keywords: '',
    metaDescription:
      options?.metaDescription || PAGE_DEFAULT_COPY.home.description,
    robotsFollow: true,
    robotsIndex: true,
    robotsNoarchive: false,
    sitemapEnabled: true,
    sitemapIncludeImages: true,
    siteTitle: options?.metaTitle || `${siteName} | ${PAGE_DEFAULT_COPY.home.suffix}`,
    structuredDataEnabled: true,
    structuredDataType: 'person',
    twitterCard: 'summary_large_image',
    pages,
  };
}

export function getEffectiveSeoPage(
  seo: SiteSeoSettings,
  pageId: SeoPageId,
  siteName: string
) {
  const fallback = createDefaultSeoPageSettings(pageId, siteName);
  const option = optionForPage(pageId);
  const page = seo.pages[pageId] || fallback;
  const canonicalPath = normalizeCanonicalPath(page.canonicalPath, option.path);

  return {
    canonicalPath,
    keywords: page.keywords.trim(),
    ogDescription: page.ogDescription.trim() || page.seoDescription.trim() || seo.metaDescription.trim(),
    ogImage: page.ogImage.trim() || seo.defaultOgImage.trim(),
    ogImageAlt: page.ogImageAlt.trim() || seo.defaultOgImageAlt.trim(),
    ogTitle: page.ogTitle.trim() || page.seoTitle.trim() || seo.siteTitle.trim(),
    seoDescription: page.seoDescription.trim() || (pageId === 'home' ? seo.metaDescription.trim() : fallback.seoDescription.trim() || seo.metaDescription.trim()),
    seoTitle: page.seoTitle.trim() || (pageId === 'home' ? seo.siteTitle.trim() : `${siteName} | ${PAGE_DEFAULT_COPY[pageId].suffix}`),
    twitterCard: page.twitterCard || seo.twitterCard,
  };
}

export function getCombinedKeywords(seo: SiteSeoSettings, pageId: SeoPageId) {
  const page = seo.pages[pageId];
  const combined = new Set([
    ...splitKeywords(seo.keywords),
    ...splitKeywords(page?.keywords || ''),
  ]);
  return Array.from(combined);
}

function scoreTitle(value: string) {
  const length = value.trim().length;
  return length >= 30 && length <= 60;
}

function scoreDescription(value: string) {
  const length = value.trim().length;
  return length >= 120 && length <= 160;
}

function isFriendlyPath(value: string) {
  return value === '/' || /^\/[a-z0-9-/]*$/.test(value);
}

export function getSeoChecklist(
  seo: SiteSeoSettings,
  pageId: SeoPageId,
  siteName: string
): SeoChecklistItem[] {
  const effective = getEffectiveSeoPage(seo, pageId, siteName);
  const absoluteBase = normalizeCanonicalUrl(seo.canonicalUrl);
  const hasOg = Boolean(effective.ogImage);
  const option = optionForPage(pageId);
  const titleSource = effective.seoTitle || seo.siteTitle;

  return [
    {
      label: 'Title length',
      note: scoreTitle(titleSource)
        ? 'The title is in a healthy search-preview range.'
        : 'Aim for roughly 30 to 60 characters.',
      status: scoreTitle(titleSource) ? 'pass' : 'warning',
      weight: 18,
    },
    {
      label: 'Description length',
      note: scoreDescription(effective.seoDescription)
        ? 'The description is long enough to explain the page clearly.'
        : 'Aim for roughly 120 to 160 characters.',
      status: scoreDescription(effective.seoDescription) ? 'pass' : 'warning',
      weight: 18,
    },
    {
      label: 'Open Graph image',
      note: hasOg
        ? 'A social preview image is ready for shares.'
        : 'Add a default or page-level OG image.',
      status: hasOg ? 'pass' : 'warning',
      weight: 14,
    },
    {
      label: 'Canonical URL',
      note: absoluteBase
        ? `${absoluteBase}${effective.canonicalPath === '/' ? '' : effective.canonicalPath}`
        : 'Set the main site URL first so canonicals can be generated.',
      status: absoluteBase ? 'pass' : 'warning',
      weight: 14,
    },
    {
      label: 'Robots policy',
      note:
        seo.robotsIndex && seo.robotsFollow
          ? 'Search engines are allowed to index and follow this site.'
          : 'Current settings reduce crawl or index visibility.',
      status: seo.robotsIndex && seo.robotsFollow ? 'pass' : 'warning',
      weight: 10,
    },
    {
      label: 'Heading source',
      note: titleSource
        ? `The page has a clear headline source for ${option.label}.`
        : 'Add a stronger title so the page headline stays clear.',
      status: titleSource ? 'pass' : 'warning',
      weight: 8,
    },
    {
      label: 'Image alt coverage',
      note: effective.ogImage
        ? effective.ogImageAlt
          ? 'The social image has descriptive alt text.'
          : 'Add alt text for the social image for better accessibility metadata.'
        : 'No social image has been set yet.',
      status: effective.ogImage && effective.ogImageAlt ? 'pass' : 'warning',
      weight: 8,
    },
    {
      label: 'Friendly URL path',
      note: isFriendlyPath(effective.canonicalPath)
        ? 'The canonical path is simple and readable.'
        : 'Use short lowercase paths with hyphens when needed.',
      status: isFriendlyPath(effective.canonicalPath) ? 'pass' : 'warning',
      weight: 10,
    },
  ];
}

export function getSeoScore(
  seo: SiteSeoSettings,
  pageId: SeoPageId,
  siteName: string
) {
  const items = getSeoChecklist(seo, pageId, siteName);
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const earned = items.reduce(
    (sum, item) => sum + (item.status === 'pass' ? item.weight : 0),
    0
  );

  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

export function buildCanonicalUrl(baseUrl: string, path: string) {
  const normalizedBase = normalizeCanonicalUrl(baseUrl);
  if (!normalizedBase) {
    return '';
  }

  return path === '/' ? normalizedBase : `${normalizedBase}${path}`;
}
