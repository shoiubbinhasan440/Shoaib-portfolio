'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import type { GlobalSettingsConfig } from '@/lib/global-settings';
import {
  DEFAULT_USER_LOGIN_ROUTE,
  getNavigationBranding,
  getVisibleNavigationItems,
  resolveLoginButton,
  type NavigationConfig,
  type NavigationItem,
} from '@/lib/navigation-config';

type NavbarClientProps = {
  globalSettings: GlobalSettingsConfig;
  navigationConfig: NavigationConfig;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
}

function matchesActive(pathname: string, item: NavigationItem) {
  if (item.activeMode === 'none') {
    return false;
  }

  if (item.type === 'section') {
    return pathname === '/';
  }

  if (item.activeMode === 'prefix') {
    return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
  }

  return pathname === item.href;
}

function getContainerWidth(width: NavigationConfig['design']['width']) {
  if (width === 'full') {
    return '100%';
  }

  if (width === 'contained') {
    return '1080px';
  }

  return '1320px';
}

function getHeightPreset(heightPreset: NavigationConfig['design']['heightPreset']) {
  if (heightPreset === 'compact') {
    return { navPadding: '10px 18px', panelPadding: '14px 16px' };
  }

  if (heightPreset === 'spacious') {
    return { navPadding: '16px 24px', panelPadding: '18px 20px' };
  }

  return { navPadding: '12px 20px', panelPadding: '16px 18px' };
}

function getLogoSize(size: NavigationConfig['design']['logo']['logoSize']) {
  if (size === 'sm') {
    return { image: 34, text: 18 };
  }

  if (size === 'lg') {
    return { image: 54, text: 26 };
  }

  return { image: 42, text: 22 };
}

function renderThemeLabel(theme: 'dark' | 'light', mounted: boolean) {
  if (!mounted) {
    return {
      icon: '◐',
      label: 'Theme',
      sr: 'Toggle theme',
    };
  }

  return theme === 'dark'
    ? { icon: '☀', label: 'Light mode', sr: 'Switch to light mode' }
    : { icon: '☾', label: 'Dark mode', sr: 'Switch to dark mode' };
}

function NavLink({
  active,
  accentColor,
  children,
  href,
  newTab,
  onClick,
  style,
}: {
  active?: boolean;
  accentColor?: string;
  children: React.ReactNode;
  href: string;
  newTab?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const sharedStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: active ? accentColor : undefined,
    ...style,
  };

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        onClick={onClick}
        style={sharedStyle}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noreferrer noopener' : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      style={sharedStyle}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer noopener' : undefined}
    >
      {children}
    </Link>
  );
}

export default function NavbarClient({
  globalSettings,
  navigationConfig,
}: NavbarClientProps) {
  const pathname = usePathname();
  const { mounted, theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const syncScroll = () => setScrolled(window.scrollY > 12);
    syncScroll();
    window.addEventListener('scroll', syncScroll, { passive: true });
    return () => window.removeEventListener('scroll', syncScroll);
  }, [isAdmin]);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMenuOpen(false);
      setOpenDropdownId(null);
    });
  }, [pathname]);

  const items = useMemo(() => getVisibleNavigationItems(navigationConfig.items), [navigationConfig.items]);
  const branding = useMemo(
    () => getNavigationBranding(navigationConfig, globalSettings),
    [globalSettings, navigationConfig]
  );
  const loginButton = resolveLoginButton(navigationConfig, {
    userLoginRoute: DEFAULT_USER_LOGIN_ROUTE,
  });

  if (isAdmin) {
    return null;
  }

  const currentTheme = mounted ? theme : 'dark';
  const dark = currentTheme === 'dark';
  const design = navigationConfig.design;
  const themeToggle = navigationConfig.themeToggle;
  const themeRender = renderThemeLabel(currentTheme, mounted);
  const shellBackground =
    design.transparentOnTop && !scrolled
      ? 'transparent'
      : dark
        ? design.backgroundDark
        : design.backgroundLight;
  const navTextColor = dark ? design.textColorDark : design.textColorLight;
  const navAccent = design.accentColor;
  const activeLinkColor = design.activeLinkColor;
  const hoverColor = design.hoverColor || navAccent;
  const containerWidth = getContainerWidth(design.width);
  const heightPreset = getHeightPreset(design.heightPreset);
  const logoSize = getLogoSize(design.logo.logoSize);

  const loginStyle: Record<string, React.CSSProperties> = {
    filled: {
      background: navAccent,
      color: '#ffffff',
      border: '1px solid transparent',
      boxShadow: '0 16px 30px rgba(2, 132, 199, 0.24)',
    },
    outline: {
      background: 'transparent',
      color: navAccent,
      border: `1px solid ${navAccent}`,
    },
    ghost: {
      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
      color: dark ? '#f8fafc' : '#0f172a',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}`,
    },
    glass: {
      background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.62)',
      color: navAccent,
      border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.66)'}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
  };

  const themeButtonStyle: Record<string, React.CSSProperties> = {
    'icon-only': {
      width: 40,
      height: 40,
      padding: 0,
      justifyContent: 'center',
      borderRadius: 999,
    },
    pill: {
      padding: '10px 14px',
      borderRadius: 999,
    },
    'text-icon': {
      padding: '10px 14px',
      borderRadius: 16,
    },
  };

  const actionButtonBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    textDecoration: 'none',
    cursor: 'pointer',
  };

  function renderThemeButton(
    key: string,
    styleOverride?: React.CSSProperties
  ) {
    if (!themeToggle.visible) {
      return null;
    }

    return (
      <button
        key={key}
        onClick={toggleTheme}
        type="button"
        aria-label={themeRender.sr}
        style={{
          ...actionButtonBase,
          ...themeButtonStyle[themeToggle.style],
          border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
          color: dark ? '#f8fafc' : '#0f172a',
          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.64)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          ...styleOverride,
        }}
      >
        <span>{themeRender.icon}</span>
        {themeToggle.style === 'icon-only' ? null : <span>{themeRender.label}</span>}
      </button>
    );
  }

  function renderLoginAction(key: string) {
    if (!loginButton.visible || !loginButton.href) {
      return null;
    }

    return (
      <NavLink
        key={key}
        href={loginButton.href}
        newTab={navigationConfig.loginButton.newTab}
        style={{
          ...actionButtonBase,
          ...loginStyle[navigationConfig.loginButton.style],
          padding: '10px 16px',
          borderRadius: 999,
        }}
      >
        {navigationConfig.loginButton.icon ? (
          <span>{navigationConfig.loginButton.icon}</span>
        ) : null}
        <span>{navigationConfig.loginButton.label}</span>
      </NavLink>
    );
  }

  const desktopActions = [
    themeToggle.position === 'before-login' ? renderThemeButton('theme-before-login') : null,
    renderLoginAction('login-action'),
    themeToggle.position === 'after-login' ? renderThemeButton('theme-after-login') : null,
  ].filter(Boolean);

  function renderBrand() {
    return (
      <NavLink
        href={branding.logoLink}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          color: design.logo.brandColor,
          fontWeight: 900,
        }}
      >
        {design.logo.showImageLogo && branding.imageLogoUrl ? (
          <img
            src={branding.imageLogoUrl}
            alt={branding.logoAlt}
            style={{
              width: logoSize.image,
              height: logoSize.image,
              objectFit: 'cover',
              borderRadius: 14,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
            }}
          />
        ) : null}
        {design.logo.showTextLogo ? (
          <span
            style={{
              fontSize: logoSize.text,
              lineHeight: 1,
              color: design.logo.brandColor,
              whiteSpace: 'nowrap',
            }}
          >
            {branding.textLogo}
          </span>
        ) : null}
      </NavLink>
    );
  }

  function renderDesktopItem(item: NavigationItem) {
    const active = matchesActive(pathname, item);
    const hasChildren = item.type === 'dropdown' && item.children.some(child => child.visible);
    const childItems = item.children.filter(child => child.visible).sort((leftItem, rightItem) => leftItem.order - rightItem.order);
    const alignStyle =
      item.dropdownAlignment === 'center'
        ? { left: '50%', transform: 'translateX(-50%)' }
        : item.dropdownAlignment === 'right'
          ? { right: 0 }
          : { left: 0 };

    if (!hasChildren) {
      return (
        <NavLink
          key={item.id}
          href={item.href}
          newTab={item.newTab}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: active ? activeLinkColor : navTextColor,
            fontSize: 14,
            fontWeight: item.type === 'button' ? 800 : 600,
            padding: item.type === 'button' ? '10px 14px' : '8px 0',
            borderRadius: item.type === 'button' ? 999 : 0,
            background:
              item.type === 'button'
                ? dark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(15,23,42,0.05)'
                : 'transparent',
          }}
        >
          {item.icon ? <span>{item.icon}</span> : null}
          <span>{item.label}</span>
        </NavLink>
      );
    }

    const dropdownOpen = openDropdownId === item.id;

    return (
      <div
        key={item.id}
        onMouseEnter={() => {
          if (item.dropdownTrigger === 'hover') {
            setOpenDropdownId(item.id);
          }
        }}
        onMouseLeave={() => {
          if (item.dropdownTrigger === 'hover') {
            setOpenDropdownId(current => (current === item.id ? null : current));
          }
        }}
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          onClick={() =>
            setOpenDropdownId(current => (current === item.id ? null : item.id))
          }
          style={{
            background: 'transparent',
            border: 'none',
            color: active || dropdownOpen ? activeLinkColor : navTextColor,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 0',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {item.icon ? <span>{item.icon}</span> : null}
          <span>{item.label}</span>
          <span style={{ fontSize: 11 }}>{dropdownOpen ? '▲' : '▼'}</span>
        </button>

        {dropdownOpen ? (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 16px)',
              minWidth: 240,
              padding: 12,
              borderRadius: 20,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
              background: dark ? 'rgba(2,6,23,0.96)' : 'rgba(255,255,255,0.96)',
              boxShadow: '0 24px 50px rgba(15,23,42,0.16)',
              zIndex: 80,
              ...alignStyle,
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              {childItems.map(child => (
                <NavLink
                  key={child.id}
                  href={child.href}
                  newTab={child.newTab}
                  onClick={() => setOpenDropdownId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 14,
                    color: matchesActive(pathname, child) ? activeLinkColor : dark ? '#e2e8f0' : '#0f172a',
                    background: matchesActive(pathname, child)
                      ? dark
                        ? 'rgba(56,189,248,0.14)'
                        : 'rgba(14,165,233,0.12)'
                      : 'transparent',
                  }}
                >
                  {child.icon ? <span>{child.icon}</span> : null}
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderMobileItem(item: NavigationItem) {
    const childItems = item.children.filter(child => child.visible).sort((leftItem, rightItem) => leftItem.order - rightItem.order);
    const active = matchesActive(pathname, item);
    const hasChildren = item.type === 'dropdown' && childItems.length > 0;
    const open = openDropdownId === item.id;

    if (!hasChildren) {
      return (
        <NavLink
          key={item.id}
          href={item.href}
          newTab={item.newTab}
          onClick={() => setMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 0',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
            color: active ? activeLinkColor : dark ? '#f8fafc' : '#0f172a',
            fontWeight: 700,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {item.icon ? <span>{item.icon}</span> : null}
            <span>{item.label}</span>
          </span>
          <span style={{ color: navAccent }}>{item.newTab ? '↗' : '›'}</span>
        </NavLink>
      );
    }

    return (
      <div
        key={item.id}
        style={{
          padding: '12px 0',
          borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
        }}
      >
        <button
          type="button"
          onClick={() => setOpenDropdownId(current => (current === item.id ? null : item.id))}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: active ? activeLinkColor : dark ? '#f8fafc' : '#0f172a',
            padding: '4px 0',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {item.icon ? <span>{item.icon}</span> : null}
            <span>{item.label}</span>
          </span>
          <span>{open ? '−' : '+'}</span>
        </button>
        {open ? (
          <div style={{ display: 'grid', gap: 6, paddingTop: 10 }}>
            {childItems.map(child => (
              <NavLink
                key={child.id}
                href={child.href}
                newTab={child.newTab}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  marginLeft: 10,
                  color: matchesActive(pathname, child) ? activeLinkColor : dark ? '#cbd5e1' : '#334155',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {child.icon ? <span>{child.icon}</span> : null}
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const mobilePanelStyle: React.CSSProperties =
    design.mobile.style === 'dropdown'
      ? {
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: design.mobile.position === 'right' ? 0 : undefined,
          left: design.mobile.position === 'left' ? 0 : undefined,
          width: 'min(420px, calc(100vw - 32px))',
          maxHeight: '70vh',
          overflowY: 'auto',
          borderRadius: 24,
          padding: heightPreset.panelPadding,
        }
      : {
          position: 'fixed',
          top: 0,
          bottom: 0,
          [design.mobile.position]: 0,
          width: design.mobile.style === 'fullscreen' ? '100vw' : 'min(420px, 88vw)',
          borderRadius: design.mobile.style === 'fullscreen' ? 0 : 28,
          padding: '96px 24px 28px',
        };

  return (
    <>
      <style>{`
        .site-navbar a:hover,
        .site-navbar button:hover {
          color: ${hoverColor};
        }
        @media (min-width: 960px) {
          .site-navbar-mobile {
            display: none !important;
          }
        }
        @media (max-width: 959px) {
          .site-navbar-desktop {
            display: none !important;
          }
        }
      `}</style>

      <nav
        className="site-navbar"
        style={{
          position: design.sticky ? 'sticky' : 'relative',
          top: 0,
          zIndex: 60,
          padding: heightPreset.navPadding,
          transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
          backdropFilter: design.blur ? 'blur(22px)' : undefined,
          WebkitBackdropFilter: design.blur ? 'blur(22px)' : undefined,
          background: shellBackground,
          borderBottom: design.border
            ? `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`
            : 'none',
          boxShadow: design.shadow
            ? dark
              ? '0 20px 50px rgba(2,6,23,0.24)'
              : '0 18px 36px rgba(15,23,42,0.08)'
            : 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: containerWidth,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns:
              design.layout === 'centered' ? '1fr auto 1fr' : design.layout === 'split' ? 'auto 1fr auto' : 'auto 1fr auto',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              justifySelf: design.layout === 'centered' ? 'start' : 'start',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {renderBrand()}
          </div>

          <div
            className="site-navbar-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: design.layout === 'centered' ? 'center' : 'center',
              gap: 22,
              minWidth: 0,
              flexWrap: 'wrap',
            }}
          >
            {items.map(renderDesktopItem)}
          </div>

          <div
            className="site-navbar-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            {desktopActions}
          </div>

          <div
            className="site-navbar-mobile"
            style={{
              gridColumn: design.layout === 'centered' ? '3 / 4' : undefined,
              justifySelf: 'end',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {themeToggle.visible &&
            themeToggle.position !== 'mobile-only' &&
            design.mobile.showThemeToggle ? (
              <button
                onClick={toggleTheme}
                type="button"
                aria-label={themeRender.sr}
                style={{
                  ...actionButtonBase,
                  ...themeButtonStyle['icon-only'],
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
                  color: dark ? '#f8fafc' : '#0f172a',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.64)',
                }}
              >
                {themeRender.icon}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setMenuOpen(current => !current)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
                background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.64)',
                color: dark ? '#f8fafc' : '#0f172a',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>

            {menuOpen ? (
              <div
                style={{
                  ...mobilePanelStyle,
                  background: dark ? 'rgba(2,6,23,0.98)' : 'rgba(255,255,255,0.98)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
                  boxShadow: '0 30px 60px rgba(15,23,42,0.22)',
                  zIndex: 90,
                  animation:
                    design.mobile.animation === 'fade'
                      ? 'none'
                      : design.mobile.animation === 'scale'
                        ? 'none'
                        : 'none',
                }}
              >
                <div style={{ display: 'grid', gap: 2 }}>
                  {items.map(renderMobileItem)}
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                  {design.mobile.showLoginButton ? renderLoginAction('mobile-login-action') : null}
                  {design.mobile.showThemeToggle && themeToggle.visible
                    ? renderThemeButton('mobile-theme-toggle')
                    : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
}
