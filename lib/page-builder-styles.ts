import type { CSSProperties } from 'react';

export type BuilderFontSizePreset =
  | 'default'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | '2xl';
export type BuilderFontFamilyPreset =
  | 'default'
  | 'system'
  | 'inter'
  | 'poppins'
  | 'hind-siliguri'
  | 'noto-sans-bengali'
  | 'playfair';
export type BuilderFontWeightPreset =
  | 'default'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold';
export type BuilderLineHeightPreset = 'default' | 'tight' | 'normal' | 'relaxed';
export type BuilderLetterSpacingPreset = 'default' | 'tight' | 'normal' | 'wide';
export type BuilderTextAlignPreset = 'default' | 'left' | 'center' | 'right';
export type BuilderWidthPreset = 'default' | 'narrow' | 'normal' | 'wide' | 'full';
export type BuilderPaddingPreset = 'default' | 'compact' | 'normal' | 'spacious';
export type BuilderButtonStylePreset = 'default' | 'solid' | 'outline' | 'soft' | 'glass';
export type BuilderButtonSizePreset = 'default' | 'small' | 'medium' | 'large';
export type BuilderCardStylePreset = 'default' | 'soft' | 'glass' | 'outline' | 'editorial';
export type BuilderShadowPreset = 'default' | 'none' | 'soft' | 'medium' | 'strong';
export type BuilderGlowPreset = 'default' | 'none' | 'soft' | 'medium';
export type BuilderGradientPreset = 'default' | 'none' | 'soft' | 'studio' | 'spotlight';
export type BuilderGridColumnsPreset = 'default' | '1' | '2' | '3' | '4';
export type BuilderImagePositionPreset = 'default' | 'left' | 'right' | 'center' | 'split';

export type BuilderTypographyRule = {
  fontSize: BuilderFontSizePreset;
  fontFamily: BuilderFontFamilyPreset;
  fontWeight: BuilderFontWeightPreset;
  lineHeight: BuilderLineHeightPreset;
  letterSpacing: BuilderLetterSpacingPreset;
  textAlign: BuilderTextAlignPreset;
  lightColor: string;
  darkColor: string;
};

export type BuilderTypographyStyles = {
  label: BuilderTypographyRule;
  title: BuilderTypographyRule;
  subtitle: BuilderTypographyRule;
  body: BuilderTypographyRule;
  button: BuilderTypographyRule;
};

export type BuilderColorStyles = {
  accentLight: string;
  accentDark: string;
  backgroundLight: string;
  backgroundDark: string;
  cardBackgroundLight: string;
  cardBackgroundDark: string;
  borderLight: string;
  borderDark: string;
  buttonBackgroundLight: string;
  buttonBackgroundDark: string;
  buttonTextLight: string;
  buttonTextDark: string;
};

export type BuilderLayoutStyles = {
  width: BuilderWidthPreset;
  padding: BuilderPaddingPreset;
  contentAlign: BuilderTextAlignPreset;
  buttonAlign: BuilderTextAlignPreset;
  gridColumns: BuilderGridColumnsPreset;
  imagePosition: BuilderImagePositionPreset;
};

export type BuilderButtonStyles = {
  stylePreset: BuilderButtonStylePreset;
  size: BuilderButtonSizePreset;
  borderRadius: number;
  showIcon: boolean;
};

export type BuilderCardStyles = {
  stylePreset: BuilderCardStylePreset;
  borderRadius: number;
  shadow: BuilderShadowPreset;
  glow: BuilderGlowPreset;
  glassEffect: boolean;
  gap: number;
  gradient: BuilderGradientPreset;
};

export type BuilderSectionStyles = {
  typography: BuilderTypographyStyles;
  colors: BuilderColorStyles;
  layout: BuilderLayoutStyles;
  buttons: BuilderButtonStyles;
  card: BuilderCardStyles;
};

type TypographyRole = keyof BuilderTypographyStyles;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function numberValue(value: unknown, fallback: number, min?: number, max?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  const minValue = typeof min === 'number' ? min : value;
  const maxValue = typeof max === 'number' ? max : value;
  return Math.min(maxValue, Math.max(minValue, value));
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const FONT_SIZE_VALUES: readonly BuilderFontSizePreset[] = [
  'default',
  'small',
  'medium',
  'large',
  'xlarge',
  '2xl',
];

const FONT_FAMILY_VALUES: readonly BuilderFontFamilyPreset[] = [
  'default',
  'system',
  'inter',
  'poppins',
  'hind-siliguri',
  'noto-sans-bengali',
  'playfair',
];

const FONT_WEIGHT_VALUES: readonly BuilderFontWeightPreset[] = [
  'default',
  'regular',
  'medium',
  'semibold',
  'bold',
  'extrabold',
];

const LINE_HEIGHT_VALUES: readonly BuilderLineHeightPreset[] = [
  'default',
  'tight',
  'normal',
  'relaxed',
];

const LETTER_SPACING_VALUES: readonly BuilderLetterSpacingPreset[] = [
  'default',
  'tight',
  'normal',
  'wide',
];

const TEXT_ALIGN_VALUES: readonly BuilderTextAlignPreset[] = [
  'default',
  'left',
  'center',
  'right',
];

const WIDTH_VALUES: readonly BuilderWidthPreset[] = [
  'default',
  'narrow',
  'normal',
  'wide',
  'full',
];

const PADDING_VALUES: readonly BuilderPaddingPreset[] = [
  'default',
  'compact',
  'normal',
  'spacious',
];

const BUTTON_STYLE_VALUES: readonly BuilderButtonStylePreset[] = [
  'default',
  'solid',
  'outline',
  'soft',
  'glass',
];

const BUTTON_SIZE_VALUES: readonly BuilderButtonSizePreset[] = [
  'default',
  'small',
  'medium',
  'large',
];

const CARD_STYLE_VALUES: readonly BuilderCardStylePreset[] = [
  'default',
  'soft',
  'glass',
  'outline',
  'editorial',
];

const SHADOW_VALUES: readonly BuilderShadowPreset[] = [
  'default',
  'none',
  'soft',
  'medium',
  'strong',
];

const GLOW_VALUES: readonly BuilderGlowPreset[] = [
  'default',
  'none',
  'soft',
  'medium',
];

const GRADIENT_VALUES: readonly BuilderGradientPreset[] = [
  'default',
  'none',
  'soft',
  'studio',
  'spotlight',
];

const GRID_VALUES: readonly BuilderGridColumnsPreset[] = [
  'default',
  '1',
  '2',
  '3',
  '4',
];

const IMAGE_POSITION_VALUES: readonly BuilderImagePositionPreset[] = [
  'default',
  'left',
  'right',
  'center',
  'split',
];

export function createDefaultTypographyRule(): BuilderTypographyRule {
  return {
    fontSize: 'default',
    fontFamily: 'default',
    fontWeight: 'default',
    lineHeight: 'default',
    letterSpacing: 'default',
    textAlign: 'default',
    lightColor: '',
    darkColor: '',
  };
}

export function createDefaultBuilderSectionStyles(): BuilderSectionStyles {
  return {
    typography: {
      label: createDefaultTypographyRule(),
      title: createDefaultTypographyRule(),
      subtitle: createDefaultTypographyRule(),
      body: createDefaultTypographyRule(),
      button: createDefaultTypographyRule(),
    },
    colors: {
      accentLight: '',
      accentDark: '',
      backgroundLight: '',
      backgroundDark: '',
      cardBackgroundLight: '',
      cardBackgroundDark: '',
      borderLight: '',
      borderDark: '',
      buttonBackgroundLight: '',
      buttonBackgroundDark: '',
      buttonTextLight: '',
      buttonTextDark: '',
    },
    layout: {
      width: 'default',
      padding: 'default',
      contentAlign: 'default',
      buttonAlign: 'default',
      gridColumns: 'default',
      imagePosition: 'default',
    },
    buttons: {
      stylePreset: 'default',
      size: 'default',
      borderRadius: 14,
      showIcon: true,
    },
    card: {
      stylePreset: 'default',
      borderRadius: 24,
      shadow: 'default',
      glow: 'default',
      glassEffect: false,
      gap: 18,
      gradient: 'default',
    },
  };
}

function sanitizeTypographyRule(
  value: unknown,
  fallback: BuilderTypographyRule
): BuilderTypographyRule {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    fontSize: pickEnum(value.fontSize, FONT_SIZE_VALUES, fallback.fontSize),
    fontFamily: pickEnum(value.fontFamily, FONT_FAMILY_VALUES, fallback.fontFamily),
    fontWeight: pickEnum(value.fontWeight, FONT_WEIGHT_VALUES, fallback.fontWeight),
    lineHeight: pickEnum(value.lineHeight, LINE_HEIGHT_VALUES, fallback.lineHeight),
    letterSpacing: pickEnum(value.letterSpacing, LETTER_SPACING_VALUES, fallback.letterSpacing),
    textAlign: pickEnum(value.textAlign, TEXT_ALIGN_VALUES, fallback.textAlign),
    lightColor: textValue(value.lightColor, fallback.lightColor),
    darkColor: textValue(value.darkColor, fallback.darkColor),
  };
}

export function sanitizeBuilderSectionStyles(
  value: unknown,
  fallback: BuilderSectionStyles = createDefaultBuilderSectionStyles()
): BuilderSectionStyles {
  if (!isRecord(value)) {
    return fallback;
  }

  const typography = isRecord(value.typography) ? value.typography : {};
  const colors = isRecord(value.colors) ? value.colors : {};
  const layout = isRecord(value.layout) ? value.layout : {};
  const buttons = isRecord(value.buttons) ? value.buttons : {};
  const card = isRecord(value.card) ? value.card : {};

  return {
    typography: {
      label: sanitizeTypographyRule(typography.label, fallback.typography.label),
      title: sanitizeTypographyRule(typography.title, fallback.typography.title),
      subtitle: sanitizeTypographyRule(typography.subtitle, fallback.typography.subtitle),
      body: sanitizeTypographyRule(typography.body, fallback.typography.body),
      button: sanitizeTypographyRule(typography.button, fallback.typography.button),
    },
    colors: {
      accentLight: textValue(colors.accentLight, fallback.colors.accentLight),
      accentDark: textValue(colors.accentDark, fallback.colors.accentDark),
      backgroundLight: textValue(colors.backgroundLight, fallback.colors.backgroundLight),
      backgroundDark: textValue(colors.backgroundDark, fallback.colors.backgroundDark),
      cardBackgroundLight: textValue(colors.cardBackgroundLight, fallback.colors.cardBackgroundLight),
      cardBackgroundDark: textValue(colors.cardBackgroundDark, fallback.colors.cardBackgroundDark),
      borderLight: textValue(colors.borderLight, fallback.colors.borderLight),
      borderDark: textValue(colors.borderDark, fallback.colors.borderDark),
      buttonBackgroundLight: textValue(colors.buttonBackgroundLight, fallback.colors.buttonBackgroundLight),
      buttonBackgroundDark: textValue(colors.buttonBackgroundDark, fallback.colors.buttonBackgroundDark),
      buttonTextLight: textValue(colors.buttonTextLight, fallback.colors.buttonTextLight),
      buttonTextDark: textValue(colors.buttonTextDark, fallback.colors.buttonTextDark),
    },
    layout: {
      width: pickEnum(layout.width, WIDTH_VALUES, fallback.layout.width),
      padding: pickEnum(layout.padding, PADDING_VALUES, fallback.layout.padding),
      contentAlign: pickEnum(layout.contentAlign, TEXT_ALIGN_VALUES, fallback.layout.contentAlign),
      buttonAlign: pickEnum(layout.buttonAlign, TEXT_ALIGN_VALUES, fallback.layout.buttonAlign),
      gridColumns: pickEnum(layout.gridColumns, GRID_VALUES, fallback.layout.gridColumns),
      imagePosition: pickEnum(layout.imagePosition, IMAGE_POSITION_VALUES, fallback.layout.imagePosition),
    },
    buttons: {
      stylePreset: pickEnum(buttons.stylePreset, BUTTON_STYLE_VALUES, fallback.buttons.stylePreset),
      size: pickEnum(buttons.size, BUTTON_SIZE_VALUES, fallback.buttons.size),
      borderRadius: numberValue(buttons.borderRadius, fallback.buttons.borderRadius, 6, 40),
      showIcon: boolValue(buttons.showIcon, fallback.buttons.showIcon),
    },
    card: {
      stylePreset: pickEnum(card.stylePreset, CARD_STYLE_VALUES, fallback.card.stylePreset),
      borderRadius: numberValue(card.borderRadius, fallback.card.borderRadius, 8, 40),
      shadow: pickEnum(card.shadow, SHADOW_VALUES, fallback.card.shadow),
      glow: pickEnum(card.glow, GLOW_VALUES, fallback.card.glow),
      glassEffect: boolValue(card.glassEffect, fallback.card.glassEffect),
      gap: numberValue(card.gap, fallback.card.gap, 8, 48),
      gradient: pickEnum(card.gradient, GRADIENT_VALUES, fallback.card.gradient),
    },
  };
}

export function resolveThemeColor(
  colors: { lightColor?: string; darkColor?: string } | undefined,
  dark: boolean,
  fallback: string
) {
  const candidate = dark ? colors?.darkColor : colors?.lightColor;
  return candidate?.trim() ? candidate : fallback;
}

export function resolveSectionThemeColor(
  lightValue: string,
  darkValue: string,
  dark: boolean,
  fallback: string
) {
  const candidate = dark ? darkValue : lightValue;
  return candidate?.trim() ? candidate : fallback;
}

export function resolveFontFamily(
  preset: BuilderFontFamilyPreset,
  fallback = "'Inter', system-ui, sans-serif"
) {
  switch (preset) {
    case 'system':
      return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    case 'poppins':
      return "'Poppins', 'Inter', system-ui, sans-serif";
    case 'hind-siliguri':
      return "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif";
    case 'noto-sans-bengali':
      return "'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif";
    case 'playfair':
      return "'Playfair Display', Georgia, serif";
    case 'inter':
      return "'Inter', system-ui, sans-serif";
    case 'default':
    default:
      return fallback;
  }
}

export function resolveFontWeight(
  preset: BuilderFontWeightPreset,
  fallback?: CSSProperties['fontWeight']
) {
  switch (preset) {
    case 'regular':
      return 400;
    case 'medium':
      return 500;
    case 'semibold':
      return 600;
    case 'bold':
      return 700;
    case 'extrabold':
      return 800;
    case 'default':
    default:
      return fallback;
  }
}

export function resolveLineHeight(
  preset: BuilderLineHeightPreset,
  fallback?: CSSProperties['lineHeight']
) {
  switch (preset) {
    case 'tight':
      return 1.05;
    case 'normal':
      return 1.35;
    case 'relaxed':
      return 1.8;
    case 'default':
    default:
      return fallback;
  }
}

export function resolveLetterSpacing(
  preset: BuilderLetterSpacingPreset,
  fallback?: CSSProperties['letterSpacing']
) {
  switch (preset) {
    case 'tight':
      return '-0.05em';
    case 'wide':
      return '0.08em';
    case 'normal':
      return '0';
    case 'default':
    default:
      return fallback;
  }
}

export function resolveTextAlign(
  preset: BuilderTextAlignPreset,
  fallback?: CSSProperties['textAlign']
) {
  if (preset === 'left' || preset === 'center' || preset === 'right') {
    return preset;
  }

  return fallback;
}

function getRoleFontSizeValue(
  role: TypographyRole,
  preset: BuilderFontSizePreset,
  isMobile: boolean
) {
  if (preset === 'default') {
    return undefined;
  }

  const map: Record<TypographyRole, Record<Exclude<BuilderFontSizePreset, 'default'>, string>> = {
    label: {
      small: isMobile ? '11px' : '12px',
      medium: isMobile ? '12px' : '13px',
      large: isMobile ? '13px' : '14px',
      xlarge: isMobile ? '14px' : '16px',
      '2xl': isMobile ? '15px' : '18px',
    },
    title: {
      small: isMobile ? '28px' : '34px',
      medium: isMobile ? '38px' : '48px',
      large: isMobile ? '48px' : '64px',
      xlarge: isMobile ? '58px' : '84px',
      '2xl': isMobile ? '68px' : '96px',
    },
    subtitle: {
      small: isMobile ? '14px' : '16px',
      medium: isMobile ? '16px' : '18px',
      large: isMobile ? '18px' : '22px',
      xlarge: isMobile ? '22px' : '28px',
      '2xl': isMobile ? '24px' : '32px',
    },
    body: {
      small: isMobile ? '13px' : '14px',
      medium: isMobile ? '15px' : '16px',
      large: isMobile ? '17px' : '18px',
      xlarge: isMobile ? '19px' : '22px',
      '2xl': isMobile ? '21px' : '24px',
    },
    button: {
      small: isMobile ? '12px' : '13px',
      medium: isMobile ? '14px' : '15px',
      large: isMobile ? '15px' : '16px',
      xlarge: isMobile ? '16px' : '18px',
      '2xl': isMobile ? '17px' : '20px',
    },
  };

  return map[role][preset];
}

export function getTypographyStyleOverrides(
  role: TypographyRole,
  rule: BuilderTypographyRule | undefined,
  options: {
    dark: boolean;
    isMobile: boolean;
    fallbackColor?: string;
    fallbackTextAlign?: CSSProperties['textAlign'];
    fallbackFontFamily?: string;
    fallbackFontWeight?: CSSProperties['fontWeight'];
    fallbackLineHeight?: CSSProperties['lineHeight'];
    fallbackLetterSpacing?: CSSProperties['letterSpacing'];
  }
): CSSProperties {
  if (!rule) {
    return {};
  }

  return {
    color: resolveThemeColor(rule, options.dark, options.fallbackColor || 'inherit'),
    fontSize: getRoleFontSizeValue(role, rule.fontSize, options.isMobile),
    fontFamily: resolveFontFamily(rule.fontFamily, options.fallbackFontFamily),
    fontWeight: resolveFontWeight(rule.fontWeight, options.fallbackFontWeight),
    lineHeight: resolveLineHeight(rule.lineHeight, options.fallbackLineHeight),
    letterSpacing: resolveLetterSpacing(rule.letterSpacing, options.fallbackLetterSpacing),
    textAlign: resolveTextAlign(rule.textAlign, options.fallbackTextAlign),
  };
}

export function getSectionWidthOverride(
  preset: BuilderWidthPreset,
  fallback: number
) {
  switch (preset) {
    case 'narrow':
      return 920;
    case 'normal':
      return 1100;
    case 'full':
      return 1360;
    case 'wide':
      return 1240;
    case 'default':
    default:
      return fallback;
  }
}

export function getSectionPaddingOverride(
  preset: BuilderPaddingPreset,
  isMobile: boolean,
  fallback: string
) {
  if (preset === 'default') {
    return fallback;
  }

  if (preset === 'compact') {
    return isMobile ? '36px 16px' : '48px 28px';
  }

  if (preset === 'spacious') {
    return isMobile ? '64px 18px' : '92px 38px';
  }

  return isMobile ? '52px 16px' : '72px 32px';
}

export function getGridColumnsOverride(
  preset: BuilderGridColumnsPreset,
  fallback: number
) {
  if (preset === 'default') {
    return fallback;
  }

  return parseInt(preset, 10) || fallback;
}

export function getButtonAlignmentOverride(
  preset: BuilderTextAlignPreset,
  fallback: CSSProperties['justifyContent']
) {
  switch (preset) {
    case 'center':
      return 'center';
    case 'right':
      return 'flex-end';
    case 'left':
      return 'flex-start';
    case 'default':
    default:
      return fallback;
  }
}

export function getButtonStyleOverrides(
  styles: BuilderSectionStyles | undefined,
  options: {
    dark: boolean;
    fallbackBackground: string;
    fallbackColor: string;
    fallbackBorder: string;
    fallbackShadow?: string;
  }
): CSSProperties {
  if (!styles) {
    return {};
  }

  const background = resolveSectionThemeColor(
    styles.colors.buttonBackgroundLight,
    styles.colors.buttonBackgroundDark,
    options.dark,
    options.fallbackBackground
  );
  const color = resolveSectionThemeColor(
    styles.colors.buttonTextLight,
    styles.colors.buttonTextDark,
    options.dark,
    options.fallbackColor
  );
  const borderColor = resolveSectionThemeColor(
    styles.colors.borderLight,
    styles.colors.borderDark,
    options.dark,
    options.fallbackBorder
  );

  const preset = styles.buttons.stylePreset;
  const size = styles.buttons.size;

  const padding =
    size === 'small'
      ? '10px 16px'
      : size === 'large'
        ? '16px 26px'
        : '14px 22px';

  const shadow =
    styles.card.shadow === 'none'
      ? 'none'
      : styles.card.shadow === 'soft'
        ? '0 10px 24px rgba(37,99,235,0.16)'
        : styles.card.shadow === 'strong'
          ? '0 24px 54px rgba(37,99,235,0.26)'
          : options.fallbackShadow;

  return {
    background:
      preset === 'outline'
        ? 'transparent'
        : preset === 'soft'
          ? options.dark
            ? 'rgba(37,99,235,0.14)'
            : 'rgba(37,99,235,0.1)'
          : preset === 'glass'
            ? options.dark
              ? 'rgba(15,23,42,0.58)'
              : 'rgba(255,255,255,0.78)'
            : background,
    color,
    border:
      preset === 'solid'
        ? 'none'
        : `1px solid ${borderColor}`,
    borderRadius: styles.buttons.borderRadius,
    padding,
    boxShadow: shadow,
    backdropFilter:
      preset === 'glass' || styles.card.glassEffect ? 'blur(16px)' : undefined,
  };
}

export function getSectionSurfaceOverrides(
  styles: BuilderSectionStyles | undefined,
  options: {
    dark: boolean;
    fallbackBackground: string;
    fallbackBorder?: string;
  }
): CSSProperties {
  if (!styles) {
    return {};
  }

  return {
    background: resolveSectionThemeColor(
      styles.colors.backgroundLight,
      styles.colors.backgroundDark,
      options.dark,
      options.fallbackBackground
    ),
    borderColor: options.fallbackBorder
      ? resolveSectionThemeColor(
          styles.colors.borderLight,
          styles.colors.borderDark,
          options.dark,
          options.fallbackBorder
        )
      : undefined,
  };
}

export function getCardSurfaceOverrides(
  styles: BuilderSectionStyles | undefined,
  options: {
    dark: boolean;
    fallbackBackground: string;
    fallbackBorder: string;
    fallbackShadow?: string;
  }
): CSSProperties {
  if (!styles) {
    return {};
  }

  const baseBackground = resolveSectionThemeColor(
    styles.colors.cardBackgroundLight,
    styles.colors.cardBackgroundDark,
    options.dark,
    options.fallbackBackground
  );
  const borderColor = resolveSectionThemeColor(
    styles.colors.borderLight,
    styles.colors.borderDark,
    options.dark,
    options.fallbackBorder
  );

  const shadow =
    styles.card.shadow === 'none'
      ? 'none'
      : styles.card.shadow === 'soft'
        ? '0 14px 34px rgba(2,6,23,0.12)'
        : styles.card.shadow === 'strong'
          ? '0 36px 84px rgba(2,6,23,0.28)'
          : options.fallbackShadow;

  const glow =
    styles.card.glow === 'soft'
      ? options.dark
        ? '0 0 0 1px rgba(56,189,248,0.12), 0 0 34px rgba(56,189,248,0.12)'
        : '0 0 0 1px rgba(37,99,235,0.08), 0 0 28px rgba(37,99,235,0.08)'
      : styles.card.glow === 'medium'
        ? options.dark
          ? '0 0 0 1px rgba(56,189,248,0.16), 0 0 46px rgba(56,189,248,0.18)'
          : '0 0 0 1px rgba(37,99,235,0.12), 0 0 34px rgba(37,99,235,0.12)'
        : '';

  const background =
    styles.card.gradient === 'soft'
      ? options.dark
        ? `linear-gradient(180deg, rgba(15,23,42,0.8), ${baseBackground})`
        : `linear-gradient(180deg, rgba(255,255,255,0.94), ${baseBackground})`
      : styles.card.gradient === 'studio'
        ? options.dark
          ? 'linear-gradient(135deg, rgba(2,6,23,0.98), rgba(15,23,42,0.82), rgba(14,165,233,0.14))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92), rgba(37,99,235,0.08))'
        : styles.card.gradient === 'spotlight'
          ? options.dark
            ? 'radial-gradient(circle at top right, rgba(56,189,248,0.18), transparent 34%), linear-gradient(180deg, rgba(15,23,42,0.8), rgba(2,6,23,0.92))'
            : 'radial-gradient(circle at top right, rgba(37,99,235,0.14), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.92))'
          : baseBackground;

  return {
    background,
    border: `1px solid ${borderColor}`,
    borderRadius: styles.card.borderRadius,
    boxShadow: [shadow, glow].filter(Boolean).join(', ') || undefined,
    backdropFilter: styles.card.glassEffect ? 'blur(18px)' : undefined,
  };
}

export function resolveImagePosition(
  preset: BuilderImagePositionPreset,
  fallback: 'left' | 'right' | 'center' | 'split'
) {
  if (preset === 'left' || preset === 'right' || preset === 'center' || preset === 'split') {
    return preset;
  }

  return fallback;
}
