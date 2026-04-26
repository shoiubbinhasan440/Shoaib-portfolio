import type { GlobalSettingsConfig } from '@/lib/global-settings';

export const NAVIGATION_SETTINGS_KEY = 'site_navigation_config';
export const DEFAULT_USER_LOGIN_ROUTE = '/client/login';

export type NavigationItemType =
  | 'internal'
  | 'external'
  | 'section'
  | 'dropdown'
  | 'button';

export type NavigationActiveMode = 'exact' | 'prefix' | 'none';
export type NavigationDropdownAlignment = 'left' | 'center' | 'right';
export type NavigationDropdownTrigger = 'hover' | 'click';
export type LoginButtonDestination = 'admin' | 'user' | 'custom' | 'hidden';
export type LoginButtonStyle = 'filled' | 'outline' | 'ghost' | 'glass';
export type NavbarLayoutStyle = 'centered' | 'left-right' | 'split';
export type NavbarWidthStyle = 'full' | 'contained' | 'wide';
export type NavbarHeightPreset = 'compact' | 'default' | 'spacious';
export type MobileMenuStyle = 'drawer' | 'dropdown' | 'fullscreen';
export type MobileMenuPosition = 'left' | 'right';
export type MobileMenuAnimation = 'slide' | 'fade' | 'scale';
export type ThemeTogglePosition = 'before-login' | 'after-login' | 'mobile-only';
export type ThemeToggleStyle = 'icon-only' | 'pill' | 'text-icon';
export type NavbarLogoSize = 'sm' | 'md' | 'lg';

export type NavigationItem = {
  activeMode: NavigationActiveMode;
  children: NavigationItem[];
  dropdownAlignment: NavigationDropdownAlignment;
  dropdownTrigger: NavigationDropdownTrigger;
  href: string;
  icon: string;
  id: string;
  label: string;
  newTab: boolean;
  order: number;
  type: NavigationItemType;
  visible: boolean;
};

export type NavigationLoginButton = {
  customUrl: string;
  destinationType: LoginButtonDestination;
  icon: string;
  label: string;
  newTab: boolean;
  style: LoginButtonStyle;
  visible: boolean;
};

export type NavigationThemeToggle = {
  position: ThemeTogglePosition;
  style: ThemeToggleStyle;
  visible: boolean;
};

export type NavigationLogoSettings = {
  brandColor: string;
  imageLogoUrl: string;
  logoLink: string;
  logoSize: NavbarLogoSize;
  showImageLogo: boolean;
  showTextLogo: boolean;
  textLogo: string;
};

export type NavigationMobileSettings = {
  animation: MobileMenuAnimation;
  position: MobileMenuPosition;
  showLoginButton: boolean;
  showThemeToggle: boolean;
  style: MobileMenuStyle;
};

export type NavigationDesignSettings = {
  accentColor: string;
  activeLinkColor: string;
  backgroundDark: string;
  backgroundLight: string;
  blur: boolean;
  border: boolean;
  heightPreset: NavbarHeightPreset;
  hoverColor: string;
  layout: NavbarLayoutStyle;
  logo: NavigationLogoSettings;
  mobile: NavigationMobileSettings;
  shadow: boolean;
  sticky: boolean;
  textColorDark: string;
  textColorLight: string;
  transparentOnTop: boolean;
  width: NavbarWidthStyle;
};

export type NavigationConfig = {
  design: NavigationDesignSettings;
  items: NavigationItem[];
  loginButton: NavigationLoginButton;
  themeToggle: NavigationThemeToggle;
  version: number;
};

export type LegacyNavigationItem = {
  href: string;
  id?: string;
  label: string;
  order_num?: number;
  visible?: boolean;
};

export type NavigationPresetOption = {
  group: 'Internal pages' | 'Homepage sections' | 'Utility routes' | 'Custom';
  label: string;
  type: NavigationItemType;
  value: string;
};

const DEFAULT_TEXT_LOGO = 'Md. Minhajul Hoque';

export const NAVIGATION_ICON_SUGGESTIONS = [
  '',
  '•',
  '⌘',
  '✦',
  '★',
  '→',
  '↗',
  '☼',
  '☰',
  '⌂',
  '⚙',
  '✉',
  '☎',
  '▶',
  '♦',
] as const;

export const NAVIGATION_PRESET_OPTIONS: NavigationPresetOption[] = [
  { value: '/', label: 'Home', type: 'internal', group: 'Internal pages' },
  { value: '/portfolio', label: 'Portfolio', type: 'internal', group: 'Internal pages' },
  { value: '/about', label: 'About', type: 'internal', group: 'Internal pages' },
  { value: '/contact', label: 'Contact', type: 'internal', group: 'Internal pages' },
  { value: '/tutorial', label: 'Tutorial', type: 'internal', group: 'Internal pages' },
  { value: '/#portfolio', label: 'Homepage / Portfolio', type: 'section', group: 'Homepage sections' },
  { value: '/#about', label: 'Homepage / About', type: 'section', group: 'Homepage sections' },
  { value: '/#contact', label: 'Homepage / Contact', type: 'section', group: 'Homepage sections' },
  { value: '/admin/login', label: 'Admin login', type: 'internal', group: 'Utility routes' },
  { value: DEFAULT_USER_LOGIN_ROUTE, label: 'Client login', type: 'internal', group: 'Utility routes' },
  { value: '', label: 'Custom URL', type: 'external', group: 'Custom' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function oneOf<T extends string>(value: unknown, fallback: T, values: readonly T[]) {
  return typeof value === 'string' && values.includes(value as T) ? (value as T) : fallback;
}

function normalizeHref(value: string, type: NavigationItemType) {
  if (!value.trim()) {
    return type === 'section' ? '/#section' : '/';
  }

  if (type === 'external') {
    return value.trim();
  }

  if (type === 'section') {
    if (value.startsWith('/#')) {
      return value;
    }

    if (value.startsWith('#')) {
      return `/${value}`;
    }
  }

  return value.trim();
}

function inferItemType(href: string): NavigationItemType {
  if (!href) {
    return 'internal';
  }

  if (href.startsWith('/#') || href.startsWith('#')) {
    return 'section';
  }

  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return 'external';
  }

  return 'internal';
}

function createDefaultItem(index: number): NavigationItem {
  return {
    activeMode: 'exact',
    children: [],
    dropdownAlignment: 'left',
    dropdownTrigger: 'hover',
    href: '/',
    icon: '',
    id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    newTab: false,
    order: index,
    type: 'internal',
    visible: true,
  };
}

export function createNavigationItem(order: number): NavigationItem {
  return createDefaultItem(order);
}

export function createDropdownChild(order: number): NavigationItem {
  return {
    ...createDefaultItem(order),
    id: `nav-child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

function sanitizeItem(value: unknown, fallback: NavigationItem, nested = false): NavigationItem {
  if (!isRecord(value)) {
    return fallback;
  }

  const type = oneOf(
    value.type,
    inferItemType(text(value.href, fallback.href)),
    ['internal', 'external', 'section', 'dropdown', 'button'] as const
  );

  const base: NavigationItem = {
    activeMode: oneOf(value.activeMode, fallback.activeMode, ['exact', 'prefix', 'none'] as const),
    children: [],
    dropdownAlignment: oneOf(
      value.dropdownAlignment,
      fallback.dropdownAlignment,
      ['left', 'center', 'right'] as const
    ),
    dropdownTrigger: oneOf(
      value.dropdownTrigger,
      fallback.dropdownTrigger,
      ['hover', 'click'] as const
    ),
    href: normalizeHref(text(value.href, fallback.href), type),
    icon: text(value.icon, fallback.icon),
    id: text(value.id, fallback.id),
    label: text(value.label, fallback.label),
    newTab: bool(value.newTab, fallback.newTab),
    order: numberValue(value.order, fallback.order),
    type,
    visible: bool(value.visible, fallback.visible),
  };

  const fallbackChildren = fallback.children || [];
  const rawChildren = Array.isArray(value.children) ? value.children : [];

  base.children =
    type === 'dropdown' && !nested
      ? rawChildren.map((child, index) =>
          sanitizeItem(child, fallbackChildren[index] || createDropdownChild(index), true)
        )
      : [];

  return base;
}

function sortItems(items: NavigationItem[]): NavigationItem[] {
  return [...items]
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order)
    .map((item, index) => ({
      ...item,
      order: index,
      children: sortItems(item.children || []),
    }));
}

export function createDefaultNavigationConfig(): NavigationConfig {
  const items: NavigationItem[] = [
    {
      ...createDefaultItem(0),
      id: 'nav-home',
      label: 'Home',
      href: '/',
    },
    {
      ...createDefaultItem(1),
      id: 'nav-portfolio',
      label: 'Portfolio',
      href: '/portfolio',
    },
    {
      ...createDefaultItem(2),
      id: 'nav-tutorial',
      label: 'Tutorial',
      href: '/tutorial',
    },
    {
      ...createDefaultItem(3),
      id: 'nav-about',
      label: 'About',
      href: '/about',
    },
    {
      ...createDefaultItem(4),
      id: 'nav-contact',
      label: 'Contact',
      href: '/contact',
    },
  ];

  return {
    version: 1,
    items,
    loginButton: {
      customUrl: '',
      destinationType: 'admin',
      icon: '',
      label: 'Login',
      newTab: false,
      style: 'glass',
      visible: true,
    },
    themeToggle: {
      position: 'before-login',
      style: 'icon-only',
      visible: true,
    },
    design: {
      accentColor: '#38bdf8',
      activeLinkColor: '#ffffff',
      backgroundDark: 'rgba(10, 10, 20, 0.68)',
      backgroundLight: 'rgba(255, 255, 255, 0.88)',
      blur: true,
      border: true,
      heightPreset: 'default',
      hoverColor: '#38bdf8',
      layout: 'left-right',
      logo: {
        brandColor: '#38bdf8',
        imageLogoUrl: '',
        logoLink: '/',
        logoSize: 'md',
        showImageLogo: false,
        showTextLogo: true,
        textLogo: DEFAULT_TEXT_LOGO,
      },
      mobile: {
        animation: 'slide',
        position: 'right',
        showLoginButton: true,
        showThemeToggle: true,
        style: 'fullscreen',
      },
      shadow: false,
      sticky: true,
      textColorDark: 'rgba(255,255,255,0.74)',
      textColorLight: '#0f172a',
      transparentOnTop: false,
      width: 'wide',
    },
  };
}

export function legacyNavigationToItems(items: LegacyNavigationItem[]) {
  return sortItems(
    items.map((item, index) => {
      const type = inferItemType(item.href);
      return {
        ...createDefaultItem(index),
        href: normalizeHref(item.href, type),
        id: item.id || `legacy-nav-${index}`,
        label: item.label,
        order: typeof item.order_num === 'number' ? item.order_num : index,
        type,
        visible: item.visible ?? true,
      };
    })
  );
}

export function parseNavigationConfig(
  rawValue: string | undefined,
  options: {
    legacyItems?: LegacyNavigationItem[];
  } = {}
): NavigationConfig {
  const fallback = createDefaultNavigationConfig();
  const legacyItems = options.legacyItems || [];

  if (!rawValue) {
    return legacyItems.length > 0
      ? { ...fallback, items: legacyNavigationToItems(legacyItems) }
      : fallback;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return fallback;
    }

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items =
      rawItems.length > 0
        ? sortItems(rawItems.map((item, index) => sanitizeItem(item, createDefaultItem(index))))
        : legacyItems.length > 0
          ? legacyNavigationToItems(legacyItems)
          : fallback.items;

    return {
      version: numberValue(parsed.version, 1),
      items,
      loginButton: isRecord(parsed.loginButton)
        ? {
            customUrl: text(parsed.loginButton.customUrl, fallback.loginButton.customUrl),
            destinationType: oneOf(
              parsed.loginButton.destinationType,
              fallback.loginButton.destinationType,
              ['admin', 'user', 'custom', 'hidden'] as const
            ),
            icon: text(parsed.loginButton.icon, fallback.loginButton.icon),
            label: text(parsed.loginButton.label, fallback.loginButton.label),
            newTab: bool(parsed.loginButton.newTab, fallback.loginButton.newTab),
            style: oneOf(
              parsed.loginButton.style,
              fallback.loginButton.style,
              ['filled', 'outline', 'ghost', 'glass'] as const
            ),
            visible: bool(parsed.loginButton.visible, fallback.loginButton.visible),
          }
        : fallback.loginButton,
      themeToggle: isRecord(parsed.themeToggle)
        ? {
            position: oneOf(
              parsed.themeToggle.position,
              fallback.themeToggle.position,
              ['before-login', 'after-login', 'mobile-only'] as const
            ),
            style: oneOf(
              parsed.themeToggle.style,
              fallback.themeToggle.style,
              ['icon-only', 'pill', 'text-icon'] as const
            ),
            visible: bool(parsed.themeToggle.visible, fallback.themeToggle.visible),
          }
        : fallback.themeToggle,
      design: isRecord(parsed.design)
        ? {
            accentColor: text(parsed.design.accentColor, fallback.design.accentColor),
            activeLinkColor: text(parsed.design.activeLinkColor, fallback.design.activeLinkColor),
            backgroundDark: text(parsed.design.backgroundDark, fallback.design.backgroundDark),
            backgroundLight: text(parsed.design.backgroundLight, fallback.design.backgroundLight),
            blur: bool(parsed.design.blur, fallback.design.blur),
            border: bool(parsed.design.border, fallback.design.border),
            heightPreset: oneOf(
              parsed.design.heightPreset,
              fallback.design.heightPreset,
              ['compact', 'default', 'spacious'] as const
            ),
            hoverColor: text(parsed.design.hoverColor, fallback.design.hoverColor),
            layout: oneOf(
              parsed.design.layout,
              fallback.design.layout,
              ['centered', 'left-right', 'split'] as const
            ),
            logo: isRecord(parsed.design.logo)
              ? {
                  brandColor: text(parsed.design.logo.brandColor, fallback.design.logo.brandColor),
                  imageLogoUrl: text(
                    parsed.design.logo.imageLogoUrl,
                    fallback.design.logo.imageLogoUrl
                  ),
                  logoLink: text(parsed.design.logo.logoLink, fallback.design.logo.logoLink),
                  logoSize: oneOf(
                    parsed.design.logo.logoSize,
                    fallback.design.logo.logoSize,
                    ['sm', 'md', 'lg'] as const
                  ),
                  showImageLogo: bool(
                    parsed.design.logo.showImageLogo,
                    fallback.design.logo.showImageLogo
                  ),
                  showTextLogo: bool(
                    parsed.design.logo.showTextLogo,
                    fallback.design.logo.showTextLogo
                  ),
                  textLogo: text(parsed.design.logo.textLogo, fallback.design.logo.textLogo),
                }
              : fallback.design.logo,
            mobile: isRecord(parsed.design.mobile)
              ? {
                  animation: oneOf(
                    parsed.design.mobile.animation,
                    fallback.design.mobile.animation,
                    ['slide', 'fade', 'scale'] as const
                  ),
                  position: oneOf(
                    parsed.design.mobile.position,
                    fallback.design.mobile.position,
                    ['left', 'right'] as const
                  ),
                  showLoginButton: bool(
                    parsed.design.mobile.showLoginButton,
                    fallback.design.mobile.showLoginButton
                  ),
                  showThemeToggle: bool(
                    parsed.design.mobile.showThemeToggle,
                    fallback.design.mobile.showThemeToggle
                  ),
                  style: oneOf(
                    parsed.design.mobile.style,
                    fallback.design.mobile.style,
                    ['drawer', 'dropdown', 'fullscreen'] as const
                  ),
                }
              : fallback.design.mobile,
            shadow: bool(parsed.design.shadow, fallback.design.shadow),
            sticky: bool(parsed.design.sticky, fallback.design.sticky),
            textColorDark: text(parsed.design.textColorDark, fallback.design.textColorDark),
            textColorLight: text(parsed.design.textColorLight, fallback.design.textColorLight),
            transparentOnTop: bool(
              parsed.design.transparentOnTop,
              fallback.design.transparentOnTop
            ),
            width: oneOf(parsed.design.width, fallback.design.width, ['full', 'contained', 'wide'] as const),
          }
        : fallback.design,
    };
  } catch {
    return legacyItems.length > 0
      ? { ...fallback, items: legacyNavigationToItems(legacyItems) }
      : fallback;
  }
}

export function serializeNavigationConfig(config: NavigationConfig) {
  return JSON.stringify({
    ...config,
    items: sortItems(config.items),
  });
}

export function getNextNavigationOrder(items: NavigationItem[]) {
  if (items.length === 0) {
    return 0;
  }

  return Math.max(...items.map(item => item.order)) + 1;
}

export function getVisibleNavigationItems(items: NavigationItem[]) {
  return sortItems(items).filter(item => item.visible);
}

export function resolveLoginButton(
  config: NavigationConfig,
  options: {
    userLoginRoute?: string | null;
  } = {}
) {
  const destinationType = config.loginButton.destinationType;
  const visible = config.loginButton.visible && destinationType !== 'hidden';
  const userLoginRoute = options.userLoginRoute || DEFAULT_USER_LOGIN_ROUTE;

  if (!visible) {
    return {
      href: '',
      visible: false,
      warning: '',
    };
  }

  if (destinationType === 'custom') {
    return {
      href: config.loginButton.customUrl.trim(),
      visible: Boolean(config.loginButton.customUrl.trim()),
      warning: config.loginButton.customUrl.trim() ? '' : 'Custom URL is empty.',
    };
  }

  if (destinationType === 'user') {
    if (userLoginRoute) {
      return {
        href: userLoginRoute,
        visible: true,
        warning: '',
      };
    }

    return {
      href: '/admin/login',
      visible: true,
      warning: 'User login route is unavailable, so admin login is used as a fallback.',
    };
  }

  return {
    href: '/admin/login',
    visible: true,
    warning: '',
  };
}

export function getNavigationBranding(
  config: NavigationConfig,
  globalSettings?: GlobalSettingsConfig
) {
  const siteName = globalSettings?.siteIdentity.siteName || DEFAULT_TEXT_LOGO;
  const siteLogo = globalSettings?.siteIdentity.logoUrl || '';
  const logoAlt = globalSettings?.siteIdentity.logoAlt || siteName;

  return {
    imageLogoUrl: config.design.logo.imageLogoUrl || siteLogo,
    logoAlt,
    logoLink: config.design.logo.logoLink || '/',
    textLogo: config.design.logo.textLogo || siteName,
  };
}

export function isKnownNavigationPreset(value: string) {
  return NAVIGATION_PRESET_OPTIONS.some(option => option.value === value);
}
