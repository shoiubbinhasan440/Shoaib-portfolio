import type { HomepageFooterSection } from '@/lib/homepage-content';
import { createDefaultHomepageBuilderConfig, type HomepageRuntimeStats } from '@/lib/homepage-content';
import type { SettingMap } from '@/lib/hero-settings';

export const GLOBAL_FOOTER_SETTING_KEY = 'global_footer_config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function num(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function widthPreset(
  value: unknown,
  fallback: HomepageFooterSection['width']
): HomepageFooterSection['width'] {
  return value === 'narrow' || value === 'normal' || value === 'wide' || value === 'full'
    ? value
    : fallback;
}

function spacingPreset(
  value: unknown,
  fallback: HomepageFooterSection['spacing']
): HomepageFooterSection['spacing'] {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function alignment(
  value: unknown,
  fallback: HomepageFooterSection['alignment']
): HomepageFooterSection['alignment'] {
  return value === 'left' || value === 'center' || value === 'right' ? value : fallback;
}

function footerLayout(
  value: unknown,
  fallback: HomepageFooterSection['layout']
): HomepageFooterSection['layout'] {
  return value === 'grid' || value === 'stacked' ? value : fallback;
}

function footerStylePreset(
  value: unknown,
  fallback: HomepageFooterSection['stylePreset']
): HomepageFooterSection['stylePreset'] {
  return value === 'cinematic' || value === 'minimal' || value === 'light'
    ? value
    : fallback;
}

function sanitizeLinks(
  value: unknown,
  fallback: HomepageFooterSection['quickLinks']
): HomepageFooterSection['quickLinks'] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `link-${index + 1}`),
      label: text(item.label, fallback[index]?.label || ''),
      url: text(item.url, fallback[index]?.url || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: num(item.order, fallback[index]?.order ?? index + 1),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeContacts(
  value: unknown,
  fallback: HomepageFooterSection['contactItems']
): HomepageFooterSection['contactItems'] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `contact-${index + 1}`),
      icon: text(item.icon, fallback[index]?.icon || ''),
      label: text(item.label, fallback[index]?.label || ''),
      value: text(item.value, fallback[index]?.value || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: num(item.order, fallback[index]?.order ?? index + 1),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeFooter(
  value: unknown,
  fallback: HomepageFooterSection
): HomepageFooterSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: footerLayout(value.layout, fallback.layout),
    stylePreset: footerStylePreset(value.stylePreset, fallback.stylePreset),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    brandText: text(value.brandText, fallback.brandText),
    brandAccent: text(value.brandAccent, fallback.brandAccent),
    description: text(value.description, fallback.description),
    showDescription: bool(value.showDescription, fallback.showDescription),
    showCta: bool(value.showCta, fallback.showCta),
    ctaText: text(value.ctaText, fallback.ctaText),
    ctaLink: text(value.ctaLink, fallback.ctaLink),
    ctaCaption: text(value.ctaCaption, fallback.ctaCaption),
    showQuickLinks: bool(value.showQuickLinks, fallback.showQuickLinks),
    showContact: bool(value.showContact, fallback.showContact),
    showSocial: bool(value.showSocial, fallback.showSocial),
    quickLinksTitle: text(value.quickLinksTitle, fallback.quickLinksTitle),
    contactTitle: text(value.contactTitle, fallback.contactTitle),
    socialTitle: text(value.socialTitle, fallback.socialTitle),
    quickLinks: sanitizeLinks(value.quickLinks, fallback.quickLinks),
    socialLinks: sanitizeLinks(value.socialLinks, fallback.socialLinks),
    contactItems: sanitizeContacts(value.contactItems, fallback.contactItems),
    copyrightText: text(value.copyrightText, fallback.copyrightText),
    noteText: text(value.noteText, fallback.noteText),
  };
}

export function createDefaultGlobalFooterConfig(
  runtimeStats: HomepageRuntimeStats = {},
  map?: SettingMap
) {
  return createDefaultHomepageBuilderConfig(runtimeStats, map).footer;
}

export function getGlobalFooterConfig(
  map: SettingMap,
  runtimeStats: HomepageRuntimeStats = {}
) {
  const fallback = createDefaultGlobalFooterConfig(runtimeStats, map);
  const rawValue = map[GLOBAL_FOOTER_SETTING_KEY];

  if (!rawValue) {
    return fallback;
  }

  try {
    return sanitizeFooter(JSON.parse(rawValue), fallback);
  } catch {
    return fallback;
  }
}

export function serializeGlobalFooterConfig(config: HomepageFooterSection) {
  return JSON.stringify(config);
}
