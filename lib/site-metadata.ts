import type { Metadata, MetadataRoute } from 'next';
import type { GlobalSettingsConfig } from '@/lib/global-settings';
import {
  buildCanonicalUrl,
  getCombinedKeywords,
  getEffectiveSeoPage,
  SEO_PAGE_OPTIONS,
  type SeoPageId,
} from '@/lib/site-seo';
import type { PortfolioSourceType } from '@/lib/portfolio-content';
import { absoluteAssetUrl, absoluteSiteUrl, SITE_CONFIG } from '@/lib/site-config';

function asUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export function buildPageMetadata(
  settings: GlobalSettingsConfig,
  pageId: SeoPageId
): Metadata {
  const canonicalBase = SITE_CONFIG.url;
  const metadataBase = asUrl(canonicalBase);
  const effective = getEffectiveSeoPage(
    settings.seo,
    pageId,
    SITE_CONFIG.siteName
  );
  const canonical = buildCanonicalUrl(canonicalBase, effective.canonicalPath);
  const keywords = getCombinedKeywords(settings.seo, pageId);
  const image = effective.ogImage || settings.seo.defaultOgImage || SITE_CONFIG.ogImage;
  const imageUrl = absoluteAssetUrl(image);
  const imageAlt =
    effective.ogImageAlt ||
    settings.seo.defaultOgImageAlt ||
    `${SITE_CONFIG.siteName} social preview`;

  return {
    metadataBase,
    title:
      pageId === 'home'
        ? {
            default: SITE_CONFIG.title,
            template: `%s | ${SITE_CONFIG.siteName}`,
          }
        : {
            absolute: effective.seoTitle,
          },
    description: effective.seoDescription,
    keywords,
    applicationName: SITE_CONFIG.siteName,
    authors: [{ name: SITE_CONFIG.siteName, url: SITE_CONFIG.url }],
    creator: SITE_CONFIG.siteName,
    publisher: SITE_CONFIG.siteName,
    category: 'portfolio',
    alternates: canonical ? { canonical } : undefined,
    icons: settings.siteIdentity.faviconUrl
      ? {
          icon: settings.siteIdentity.faviconUrl,
          shortcut: settings.siteIdentity.faviconUrl,
          apple: '/apple-touch-icon.png',
        }
      : {
          icon: '/favicon.ico',
          shortcut: '/favicon.ico',
          apple: '/apple-touch-icon.png',
          other: [
            { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
    robots: {
      index: true,
      follow: true,
      noarchive: settings.seo.robotsNoarchive || undefined,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: pageId === 'home' ? SITE_CONFIG.title : effective.ogTitle,
      description: effective.ogDescription,
      url: canonical || undefined,
      siteName: SITE_CONFIG.siteName,
      type: 'website',
      locale: 'en_US',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: imageAlt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: effective.twitterCard,
      title: pageId === 'home' ? SITE_CONFIG.title : effective.ogTitle,
      description: pageId === 'home' ? SITE_CONFIG.shortDescription : effective.ogDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

function readableSlug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildPortfolioCategoryMetadata(
  settings: GlobalSettingsConfig,
  params: {
    categoryTitle?: string;
    categoryDescription?: string;
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    slug: string;
    sourceType: PortfolioSourceType;
  }
): Metadata {
  const categoryTitle = params.categoryTitle || readableSlug(params.slug) || 'Portfolio Category';
  const typeLabel = params.sourceType === 'video' ? 'Video Editing' : 'Graphics Design';
  const base = buildPageMetadata(settings, 'portfolio');
  const path = `/portfolio/category/${params.sourceType}/${params.slug}`;
  const canonical = params.canonicalUrl || buildCanonicalUrl(SITE_CONFIG.url, path);
  const title = params.seoTitle || `${categoryTitle} ${typeLabel} | ${SITE_CONFIG.siteName}`;
  const description =
    params.seoDescription ||
    params.categoryDescription ||
    `Browse ${categoryTitle} ${typeLabel.toLowerCase()} portfolio work, previews, and selected project details.`;
  const imageUrl = params.ogImage ? absoluteAssetUrl(params.ogImage) : undefined;

  return {
    ...base,
    title: { absolute: title },
    description,
    alternates: canonical ? { canonical } : base.alternates,
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: canonical || undefined,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${categoryTitle} category social preview`,
            },
          ]
        : base.openGraph?.images,
    },
    twitter: {
      ...base.twitter,
      title,
      description,
      images: imageUrl ? [imageUrl] : base.twitter?.images,
    },
  };
}

export function buildStructuredData(settings: GlobalSettingsConfig) {
  const sameAs = Array.from(new Set([
    SITE_CONFIG.linkedIn,
    settings.social.facebook,
    settings.social.instagram,
    settings.social.youtube,
    settings.social.linkedIn,
    settings.social.behance,
  ].filter(Boolean)));

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.siteName,
    alternateName: SITE_CONFIG.alternateSiteNames,
    url: SITE_CONFIG.url,
  };
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_CONFIG.ownerName,
    alternateName: SITE_CONFIG.alternatePersonNames,
    jobTitle: SITE_CONFIG.profession,
    url: SITE_CONFIG.url,
    sameAs,
    knowsAbout: SITE_CONFIG.knowsAbout,
  };
  const portfolio = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${SITE_CONFIG.siteName} Portfolio`,
    url: absoluteSiteUrl('/portfolio'),
    description: settings.seo.metaDescription || SITE_CONFIG.description,
    about: SITE_CONFIG.knowsAbout,
  };

  return [website, person, portfolio];
}

export function buildRobots(settings: GlobalSettingsConfig): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap:
      settings.seo.sitemapEnabled
        ? absoluteSiteUrl('/sitemap.xml')
        : undefined,
  };
}

export function buildSitemap(
  settings: GlobalSettingsConfig,
  extraEntries: MetadataRoute.Sitemap = []
): MetadataRoute.Sitemap {
  if (!settings.seo.sitemapEnabled) {
    return [];
  }

  const pageEntries = SEO_PAGE_OPTIONS.map(page => {
    const effective = getEffectiveSeoPage(
      settings.seo,
      page.id,
      SITE_CONFIG.siteName
    );

    return {
      url: buildCanonicalUrl(SITE_CONFIG.url, effective.canonicalPath),
      lastModified: new Date(),
      changeFrequency: page.id === 'home' ? ('weekly' as const) : ('monthly' as const),
      priority:
        page.id === 'home'
          ? 1
          : page.id === 'portfolio'
            ? 0.9
            : page.id === 'about' || page.id === 'contact'
              ? 0.8
              : 0.65,
      images:
        settings.seo.sitemapIncludeImages && effective.ogImage
          ? [absoluteAssetUrl(effective.ogImage)]
          : undefined,
    };
  });

  return [...pageEntries, ...extraEntries];
}
