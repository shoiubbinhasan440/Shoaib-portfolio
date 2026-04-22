import type { CSSProperties } from 'react';

export type SettingRow = {
  key: string;
  value: string;
};

export type SettingMap = Record<string, string>;

export type StyledSettingValue = {
  value?: string;
  fontSize?: CSSProperties['fontSize'];
  fontWeight?: CSSProperties['fontWeight'];
  color?: CSSProperties['color'];
  fontFamily?: CSSProperties['fontFamily'];
};

export const HERO_SETTING_KEYS = {
  badge: 'hero_badge',
  title: 'hero_title',
  subtitle: 'hero_subtitle',
  primaryCta: 'cta_button',
  showreelUrl: 'showreel_url',
  statClients: 'stat_clients',
  statYears: 'stat_years',
  desktopImage: 'desktopHeroImage',
  mobileImage: 'mobileHeroImage',
  legacyDesktopImage: 'hero_image',
  legacyMobileImage: 'hero_image_mobile',
} as const;

export function toSettingMap(rows: SettingRow[]) {
  const map: SettingMap = {};
  rows.forEach(row => {
    map[row.key] = row.value;
  });
  return map;
}

export function getFirstSetting(map: SettingMap, ...keys: string[]) {
  for (const key of keys) {
    const value = map[key];
    if (value) {
      return value;
    }
  }

  return '';
}

export function parseStyledSetting(rawValue: string | undefined, fallbackValue: string) {
  if (!rawValue) {
    return {
      value: fallbackValue,
      style: {} as CSSProperties,
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as StyledSettingValue;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        value: parsed.value || fallbackValue,
        style: {
          fontSize: parsed.fontSize,
          fontWeight: parsed.fontWeight,
          color: parsed.color,
          fontFamily: parsed.fontFamily,
        } satisfies CSSProperties,
      };
    }
  } catch {
    return {
      value: rawValue,
      style: {} as CSSProperties,
    };
  }

  return {
    value: rawValue,
    style: {} as CSSProperties,
  };
}

export function serializeStyledSetting(rawValue: string | undefined, nextValue: string) {
  if (!rawValue) {
    return nextValue;
  }

  try {
    const parsed = JSON.parse(rawValue) as StyledSettingValue;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return JSON.stringify({
        ...parsed,
        value: nextValue,
      });
    }
  } catch {
    return nextValue;
  }

  return nextValue;
}

export function getStoredHeroImages(map: SettingMap) {
  const desktop = getFirstSetting(
    map,
    HERO_SETTING_KEYS.desktopImage,
    HERO_SETTING_KEYS.legacyDesktopImage
  );
  const mobile = getFirstSetting(
    map,
    HERO_SETTING_KEYS.mobileImage,
    HERO_SETTING_KEYS.legacyMobileImage
  );

  return { desktop, mobile };
}

export function getHeroImages(map: SettingMap) {
  const stored = getStoredHeroImages(map);

  return {
    desktop: stored.desktop || stored.mobile,
    mobile: stored.mobile || stored.desktop,
  };
}

export function getHeroImageUpdates(desktopImage: string, mobileImage: string) {
  return [
    { key: HERO_SETTING_KEYS.desktopImage, value: desktopImage },
    { key: HERO_SETTING_KEYS.legacyDesktopImage, value: desktopImage },
    { key: HERO_SETTING_KEYS.mobileImage, value: mobileImage },
    { key: HERO_SETTING_KEYS.legacyMobileImage, value: mobileImage },
  ];
}
