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
  const metadataBase = asUrl(settings.seo.canonicalUrl);
  const effective = getEffectiveSeoPage(
    settings.seo,
    pageId,
    settings.siteIdentity.siteName
  );
  const canonical = buildCanonicalUrl(settings.seo.canonicalUrl, effective.canonicalPath);
  const keywords = getCombinedKeywords(settings.seo, pageId);
  const image = effective.ogImage || settings.seo.defaultOgImage;
  const imageAlt =
    effective.ogImageAlt ||
    settings.seo.defaultOgImageAlt ||
    `${settings.siteIdentity.siteName} social preview`;

  return {
    metadataBase,
    title: effective.seoTitle,
    description: effective.seoDescription,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    icons: settings.siteIdentity.faviconUrl
      ? {
          icon: settings.siteIdentity.faviconUrl,
          shortcut: settings.siteIdentity.faviconUrl,
        }
      : undefined,
    robots: {
      index: settings.seo.robotsIndex,
      follow: settings.seo.robotsFollow,
      noarchive: settings.seo.robotsNoarchive || undefined,
    },
    openGraph: {
      title: effective.ogTitle,
      description: effective.ogDescription,
      url: canonical || undefined,
      siteName: settings.siteIdentity.siteName,
      type: 'website',
      images: image
        ? [
            {
              url: image,
              alt: imageAlt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: effective.twitterCard,
      title: effective.ogTitle,
      description: effective.ogDescription,
      images: image ? [image] : undefined,
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
    slug: string;
    sourceType: PortfolioSourceType;
  }
): Metadata {
  const categoryTitle = params.categoryTitle || readableSlug(params.slug) || 'Portfolio Category';
  const typeLabel = params.sourceType === 'video' ? 'Video Editing' : 'Graphics Design';
  const base = buildPageMetadata(settings, 'portfolio');
  const path = `/portfolio/category/${params.sourceType}/${params.slug}`;
  const canonical = buildCanonicalUrl(settings.seo.canonicalUrl, path);
  const title = `${categoryTitle} ${typeLabel} | ${settings.siteIdentity.siteName}`;
  const description = `Browse ${categoryTitle} ${typeLabel.toLowerCase()} portfolio work, previews, and selected project details.`;

  return {
    ...base,
    title,
    description,
    alternates: canonical ? { canonical } : base.alternates,
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: canonical || undefined,
    },
    twitter: {
      ...base.twitter,
      title,
      description,
    },
  };
}

export function buildStructuredData(settings: GlobalSettingsConfig) {
  if (!settings.seo.structuredDataEnabled) {
    return [];
  }

  const sameAs = [
    settings.social.facebook,
    settings.social.instagram,
    settings.social.youtube,
    settings.social.linkedIn,
    settings.social.behance,
  ].filter(Boolean);

  const siteUrl = settings.seo.canonicalUrl || undefined;
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.siteIdentity.siteName,
    url: siteUrl,
    description: settings.seo.metaDescription,
  };

  const entity =
    settings.seo.structuredDataType === 'professional-service'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfessionalService',
          name: settings.siteIdentity.siteName,
          url: siteUrl,
          description: settings.siteIdentity.tagline || settings.seo.metaDescription,
          email: settings.contact.email || undefined,
          telephone: settings.contact.phone || undefined,
          sameAs,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: settings.siteIdentity.siteName,
          url: siteUrl,
          description: settings.siteIdentity.tagline || settings.seo.metaDescription,
          image: settings.siteIdentity.logoUrl || settings.seo.defaultOgImage || undefined,
          sameAs,
        };

  return [website, entity];
}

export function buildRobots(settings: GlobalSettingsConfig): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: settings.seo.robotsIndex ? undefined : '/',
    },
    sitemap:
      settings.seo.sitemapEnabled && settings.seo.canonicalUrl
        ? `${settings.seo.canonicalUrl}/sitemap.xml`
        : undefined,
  };
}

export function buildSitemap(
  settings: GlobalSettingsConfig,
  extraEntries: MetadataRoute.Sitemap = []
): MetadataRoute.Sitemap {
  if (!settings.seo.sitemapEnabled || !settings.seo.canonicalUrl) {
    return [];
  }

  const pageEntries = SEO_PAGE_OPTIONS.map(page => {
    const effective = getEffectiveSeoPage(
      settings.seo,
      page.id,
      settings.siteIdentity.siteName
    );

    return {
      url: buildCanonicalUrl(settings.seo.canonicalUrl, effective.canonicalPath),
      lastModified: new Date(),
      changeFrequency: page.id === 'home' ? ('weekly' as const) : ('monthly' as const),
      priority: page.id === 'home' ? 1 : 0.7,
      images:
        settings.seo.sitemapIncludeImages && effective.ogImage
          ? [effective.ogImage]
          : undefined,
    };
  });

  return [...pageEntries, ...extraEntries];
}
