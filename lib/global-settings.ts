import { getGlobalFooterConfig } from '@/lib/footer-content';
import { getFirstSetting, type SettingMap } from '@/lib/hero-settings';
import {
  createDefaultSeoPageSettings,
  createDefaultSiteSeoSettings,
  normalizeCanonicalPath,
  normalizeCanonicalUrl,
  type SeoPageId,
  type SeoPageSettings,
  type SiteSeoSettings,
  type TwitterCardType,
} from '@/lib/site-seo';

export const GLOBAL_SYSTEM_SETTINGS_KEY = 'global_system_settings';

export type GlobalSettingsTab =
  | 'site-identity'
  | 'theme'
  | 'seo'
  | 'contact'
  | 'social'
  | 'uploads'
  | 'admin'
  | 'advanced';

export type GlobalSettingsConfig = {
  siteIdentity: {
    faviconUrl: string;
    logoAlt: string;
    logoUrl: string;
    siteName: string;
    tagline: string;
  };
  theme: {
    accentColor: string;
    colorModeBehavior: 'user-toggle' | 'follow-default' | 'locked';
    defaultTheme: 'dark' | 'light' | 'system';
  };
  seo: SiteSeoSettings;
  contact: {
    email: string;
    location: string;
    phone: string;
    whatsapp: string;
  };
  social: {
    behance: string;
    facebook: string;
    instagram: string;
    linkedIn: string;
    youtube: string;
  };
  admin: {
    dashboardStyle: 'immersive' | 'compact' | 'balanced';
    language: 'en' | 'bn';
    securitySummary: string;
    warnOnUnsavedChanges: boolean;
  };
  advanced: {
    customBodyScript: string;
    customHeadScript: string;
    maintenanceNote: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function settingBool(value: string | undefined, fallback: boolean) {
  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return fallback;
}

function themeValue(value: unknown, fallback: GlobalSettingsConfig['theme']['defaultTheme']) {
  return value === 'dark' || value === 'light' || value === 'system' ? value : fallback;
}

function modeBehavior(
  value: unknown,
  fallback: GlobalSettingsConfig['theme']['colorModeBehavior']
) {
  return value === 'user-toggle' || value === 'follow-default' || value === 'locked'
    ? value
    : fallback;
}

function languageValue(value: unknown, fallback: GlobalSettingsConfig['admin']['language']) {
  return value === 'en' || value === 'bn' ? value : fallback;
}

function dashboardStyle(
  value: unknown,
  fallback: GlobalSettingsConfig['admin']['dashboardStyle']
) {
  return value === 'immersive' || value === 'compact' || value === 'balanced'
    ? value
    : fallback;
}

function twitterCard(
  value: unknown,
  fallback: TwitterCardType
): TwitterCardType {
  return value === 'summary' || value === 'summary_large_image' ? value : fallback;
}

function structuredDataType(
  value: unknown,
  fallback: SiteSeoSettings['structuredDataType']
) {
  return value === 'person' || value === 'professional-service' ? value : fallback;
}

function findSocialLink(label: string, links: Array<{ label: string; url: string }>) {
  const normalized = label.toLowerCase();
  return (
    links.find(item => item.label.toLowerCase().includes(normalized))?.url ||
    links.find(item => item.url.toLowerCase().includes(normalized.replace(/\s+/g, '')))?.url ||
    ''
  );
}

function findContactValue(
  matcher: (item: { label: string; value: string }) => boolean,
  items: Array<{ label: string; value: string }>
) {
  return items.find(matcher)?.value || '';
}

function sanitizeSeoPage(
  value: unknown,
  fallback: SeoPageSettings,
  pageId: SeoPageId,
  siteName: string
): SeoPageSettings {
  if (!isRecord(value)) {
    return fallback;
  }

  const optionPath =
    pageId === 'home'
      ? '/'
      : `/${pageId}`;

  return {
    canonicalPath: normalizeCanonicalPath(
      text(value.canonicalPath, fallback.canonicalPath),
      optionPath
    ),
    keywords: text(value.keywords, fallback.keywords),
    ogDescription: text(value.ogDescription, fallback.ogDescription),
    ogImage: text(value.ogImage, fallback.ogImage),
    ogImageAlt: text(value.ogImageAlt, fallback.ogImageAlt),
    ogTitle: text(value.ogTitle, fallback.ogTitle),
    seoDescription: text(value.seoDescription, fallback.seoDescription),
    seoTitle: text(value.seoTitle, fallback.seoTitle || createDefaultSeoPageSettings(pageId, siteName).seoTitle),
    twitterCard: twitterCard(value.twitterCard, fallback.twitterCard),
  };
}

function sanitizeSeoSettings(
  value: unknown,
  fallback: SiteSeoSettings,
  siteName: string
): SiteSeoSettings {
  if (!isRecord(value)) {
    return fallback;
  }

  const pagesRecord = isRecord(value.pages) ? value.pages : {};
  const legacyDefaultOg = text(value.socialPreviewImage, fallback.defaultOgImage);
  const legacySiteTitle = text(value.metaTitle, fallback.siteTitle);
  const legacyDescription = text(value.metaDescription, fallback.metaDescription);

  const pages = (Object.keys(fallback.pages) as SeoPageId[]).reduce(
    (collection, pageId) => {
      collection[pageId] = sanitizeSeoPage(
        pagesRecord[pageId],
        fallback.pages[pageId],
        pageId,
        siteName
      );
      return collection;
    },
    {} as Record<SeoPageId, SeoPageSettings>
  );

  return {
    canonicalUrl: normalizeCanonicalUrl(text(value.canonicalUrl, fallback.canonicalUrl)),
    defaultOgImage: text(value.defaultOgImage, legacyDefaultOg),
    defaultOgImageAlt: text(value.defaultOgImageAlt, fallback.defaultOgImageAlt),
    keywords: text(value.keywords, fallback.keywords),
    metaDescription: text(value.metaDescription, legacyDescription),
    robotsFollow: bool(value.robotsFollow, fallback.robotsFollow),
    robotsIndex: bool(value.robotsIndex, fallback.robotsIndex),
    robotsNoarchive: bool(value.robotsNoarchive, fallback.robotsNoarchive),
    sitemapEnabled: bool(value.sitemapEnabled, fallback.sitemapEnabled),
    sitemapIncludeImages: bool(value.sitemapIncludeImages, fallback.sitemapIncludeImages),
    siteTitle: text(value.siteTitle, legacySiteTitle),
    structuredDataEnabled: bool(value.structuredDataEnabled, fallback.structuredDataEnabled),
    structuredDataType: structuredDataType(value.structuredDataType, fallback.structuredDataType),
    twitterCard: twitterCard(value.twitterCard, fallback.twitterCard),
    pages,
  };
}

export function createDefaultGlobalSettingsConfig(map: SettingMap): GlobalSettingsConfig {
  const footer = getGlobalFooterConfig(map);
  const footerSocials = footer.socialLinks
    .filter(item => item.enabled)
    .map(item => ({ label: item.label, url: item.url }));
  const footerContacts = footer.contactItems
    .filter(item => item.enabled)
    .map(item => ({ label: item.label, value: item.value }));
  const siteName = getFirstSetting(map, 'site_name') || 'Md. Minhajul Hoque';
  const fallbackSeo = createDefaultSiteSeoSettings(siteName, {
    canonicalUrl: getFirstSetting(map, 'site_canonical_url'),
    metaDescription:
      getFirstSetting(map, 'seo_meta_description') ||
      'Professional portfolio for video editing, motion graphics, and design services.',
    socialPreviewImage: getFirstSetting(map, 'seo_social_preview_image'),
    metaTitle: getFirstSetting(map, 'seo_meta_title') || `${siteName} | Creative Portfolio`,
  });

  fallbackSeo.defaultOgImageAlt = getFirstSetting(map, 'seo_default_og_alt');
  fallbackSeo.keywords = getFirstSetting(map, 'seo_keywords');
  fallbackSeo.robotsIndex = settingBool(getFirstSetting(map, 'seo_robots_index'), true);
  fallbackSeo.robotsFollow = settingBool(getFirstSetting(map, 'seo_robots_follow'), true);
  fallbackSeo.robotsNoarchive = settingBool(
    getFirstSetting(map, 'seo_robots_noarchive'),
    false
  );
  fallbackSeo.sitemapEnabled = settingBool(getFirstSetting(map, 'seo_sitemap_enabled'), true);
  fallbackSeo.sitemapIncludeImages = settingBool(
    getFirstSetting(map, 'seo_sitemap_include_images'),
    true
  );
  fallbackSeo.twitterCard = twitterCard(
    getFirstSetting(map, 'seo_twitter_card'),
    fallbackSeo.twitterCard
  );
  fallbackSeo.structuredDataEnabled = settingBool(
    getFirstSetting(map, 'seo_structured_data_enabled'),
    true
  );
  fallbackSeo.structuredDataType = structuredDataType(
    getFirstSetting(map, 'seo_structured_data_type'),
    'person'
  );

  return {
    siteIdentity: {
      faviconUrl: getFirstSetting(map, 'site_favicon'),
      logoAlt: getFirstSetting(map, 'site_logo_alt') || `${siteName} logo`,
      logoUrl: getFirstSetting(map, 'site_logo'),
      siteName,
      tagline:
        getFirstSetting(map, 'site_tagline') || 'Creative editor and designer portfolio',
    },
    theme: {
      defaultTheme: themeValue(getFirstSetting(map, 'default_theme'), 'dark'),
      accentColor: getFirstSetting(map, 'accent_color') || '#38bdf8',
      colorModeBehavior: modeBehavior(getFirstSetting(map, 'theme_mode_behavior'), 'user-toggle'),
    },
    seo: fallbackSeo,
    contact: {
      email:
        getFirstSetting(map, 'contact_email') ||
        findContactValue(item => item.value.includes('@'), footerContacts) ||
        '',
      phone:
        getFirstSetting(map, 'contact_phone') ||
        findContactValue(item => /[+0-9]/.test(item.value), footerContacts) ||
        '',
      whatsapp:
        getFirstSetting(map, 'contact_whatsapp') ||
        findContactValue(
          item =>
            item.label.toLowerCase().includes('whatsapp') ||
            item.value.toLowerCase().includes('whatsapp'),
          footerContacts
        ) ||
        '',
      location:
        getFirstSetting(map, 'contact_location') ||
        findContactValue(
          item =>
            item.label.toLowerCase().includes('location') ||
            item.label.toLowerCase().includes('address'),
          footerContacts
        ) ||
        '',
    },
    social: {
      behance: getFirstSetting(map, 'social_behance') || findSocialLink('behance', footerSocials),
      facebook: getFirstSetting(map, 'social_facebook') || findSocialLink('facebook', footerSocials),
      instagram:
        getFirstSetting(map, 'social_instagram') || findSocialLink('instagram', footerSocials),
      linkedIn:
        getFirstSetting(map, 'social_linkedin') || findSocialLink('linkedin', footerSocials),
      youtube: getFirstSetting(map, 'social_youtube') || findSocialLink('youtube', footerSocials),
    },
    admin: {
      dashboardStyle: dashboardStyle(
        getFirstSetting(map, 'admin_dashboard_style'),
        'immersive'
      ),
      language: languageValue(getFirstSetting(map, 'admin_language'), 'en'),
      securitySummary:
        getFirstSetting(map, 'admin_security_summary') ||
        'Admin routes stay session-protected and client portals remain access-code gated.',
      warnOnUnsavedChanges: settingBool(
        getFirstSetting(map, 'admin_warn_unsaved_changes'),
        true
      ),
    },
    advanced: {
      customBodyScript: getFirstSetting(map, 'advanced_body_script'),
      customHeadScript: getFirstSetting(map, 'advanced_head_script'),
      maintenanceNote: getFirstSetting(map, 'advanced_maintenance_note'),
    },
  };
}

export function getGlobalSettingsConfig(map: SettingMap): GlobalSettingsConfig {
  const fallback = createDefaultGlobalSettingsConfig(map);
  const raw = map[GLOBAL_SYSTEM_SETTINGS_KEY];

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return fallback;
    }

    const siteIdentity = isRecord(parsed.siteIdentity) ? parsed.siteIdentity : {};
    const theme = isRecord(parsed.theme) ? parsed.theme : {};
    const contact = isRecord(parsed.contact) ? parsed.contact : {};
    const social = isRecord(parsed.social) ? parsed.social : {};
    const admin = isRecord(parsed.admin) ? parsed.admin : {};
    const advanced = isRecord(parsed.advanced) ? parsed.advanced : {};
    const legacySeo = isRecord(parsed.seo) ? parsed.seo : {};

    return {
      siteIdentity: {
        faviconUrl: text(siteIdentity.faviconUrl, fallback.siteIdentity.faviconUrl),
        logoAlt: text(siteIdentity.logoAlt, fallback.siteIdentity.logoAlt),
        logoUrl: text(siteIdentity.logoUrl, fallback.siteIdentity.logoUrl),
        siteName: text(siteIdentity.siteName, fallback.siteIdentity.siteName),
        tagline: text(siteIdentity.tagline, fallback.siteIdentity.tagline),
      },
      theme: {
        defaultTheme: themeValue(theme.defaultTheme, fallback.theme.defaultTheme),
        accentColor: text(theme.accentColor, fallback.theme.accentColor),
        colorModeBehavior: modeBehavior(
          theme.colorModeBehavior,
          fallback.theme.colorModeBehavior
        ),
      },
      seo: sanitizeSeoSettings(
        legacySeo,
        fallback.seo,
        text(siteIdentity.siteName, fallback.siteIdentity.siteName)
      ),
      contact: {
        email: text(contact.email, fallback.contact.email),
        location: text(contact.location, fallback.contact.location),
        phone: text(contact.phone, fallback.contact.phone),
        whatsapp: text(contact.whatsapp, fallback.contact.whatsapp),
      },
      social: {
        behance: text(social.behance, fallback.social.behance),
        facebook: text(social.facebook, fallback.social.facebook),
        instagram: text(social.instagram, fallback.social.instagram),
        linkedIn: text(social.linkedIn, fallback.social.linkedIn),
        youtube: text(social.youtube, fallback.social.youtube),
      },
      admin: {
        dashboardStyle: dashboardStyle(admin.dashboardStyle, fallback.admin.dashboardStyle),
        language: languageValue(admin.language, fallback.admin.language),
        securitySummary: text(admin.securitySummary, fallback.admin.securitySummary),
        warnOnUnsavedChanges: bool(
          admin.warnOnUnsavedChanges,
          fallback.admin.warnOnUnsavedChanges
        ),
      },
      advanced: {
        customBodyScript: text(advanced.customBodyScript, fallback.advanced.customBodyScript),
        customHeadScript: text(advanced.customHeadScript, fallback.advanced.customHeadScript),
        maintenanceNote: text(advanced.maintenanceNote, fallback.advanced.maintenanceNote),
      },
    };
  } catch {
    return fallback;
  }
}

export function serializeGlobalSettingsConfig(config: GlobalSettingsConfig) {
  return JSON.stringify(config);
}
