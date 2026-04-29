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
    return { image: '34px', text: '18px' };
  }

  if (size === 'lg') {
    return { image: '54px', text: '26px' };
  }

  return { image: '42px', text: '22px' };
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
  className,
  href,
  newTab,
  onClick,
  style,
}: {
  active?: boolean;
  accentColor?: string;
  children: React.ReactNode;
  className?: string;
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
        className={className}
        data-active={active ? 'true' : undefined}
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
      className={className}
      data-active={active ? 'true' : undefined}
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
  const readableActiveLinkColor = dark ? activeLinkColor : '#0f172a';
  const activeLinkBackground = dark
    ? 'rgba(56,189,248,0.14)'
    : 'rgba(14,165,233,0.13)';
  const activeLinkBorder = dark
    ? 'rgba(125,211,252,0.22)'
    : 'rgba(14,165,233,0.22)';
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
        className="site-navbar-action"
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
        className="site-navbar-action"
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
  const mobileBottomItems = [
    { href: '/portfolio', label: 'Portfolio', icon: '▦' },
    { href: '/tutorial', label: 'Tutorial', icon: '▶' },
    { href: '/contact', label: 'Contact', icon: '✉' },
  ];

  function renderBrand() {
    return (
      <NavLink
        href={branding.logoLink}
        className="site-navbar-brand"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          color: design.logo.brandColor,
          fontWeight: 900,
          minWidth: 0,
          maxWidth: 'min(260px, calc(100vw - 142px))',
          overflow: 'hidden',
        }}
      >
        {design.logo.showImageLogo && branding.imageLogoUrl ? (
          <img
            src={branding.imageLogoUrl}
            alt={branding.logoAlt}
            suppressHydrationWarning
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
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
          active={active}
          className="site-nav-link"
          href={item.href}
          newTab={item.newTab}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: active ? readableActiveLinkColor : navTextColor,
            fontSize: 14,
            fontWeight: active || item.type === 'button' ? 800 : 650,
            padding: item.type === 'button' ? '10px 14px' : '10px 12px',
            borderRadius: 999,
            border: active ? `1px solid ${activeLinkBorder}` : '1px solid transparent',
            background:
              active
                ? activeLinkBackground
                : item.type === 'button'
                ? dark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(15,23,42,0.05)'
                : 'transparent',
            boxShadow: active
              ? dark
                ? '0 12px 30px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 12px 28px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.76)'
              : 'none',
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
          className="site-nav-link site-nav-button"
          data-active={active || dropdownOpen ? 'true' : undefined}
          type="button"
          onClick={() =>
            setOpenDropdownId(current => (current === item.id ? null : item.id))
          }
          style={{
            background: active || dropdownOpen ? activeLinkBackground : 'transparent',
            border: `1px solid ${active || dropdownOpen ? activeLinkBorder : 'transparent'}`,
            borderRadius: 999,
            color: active || dropdownOpen ? readableActiveLinkColor : navTextColor,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
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
            className="site-navbar-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 16px)',
              minWidth: 240,
              padding: 12,
              borderRadius: 20,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
              background: dark ? 'rgba(2,6,23,0.96)' : 'rgba(255,255,255,0.96)',
              boxShadow: '0 24px 50px rgba(15,23,42,0.16)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              zIndex: 80,
              ...alignStyle,
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              {childItems.map(child => (
                <NavLink
                  key={child.id}
                  active={matchesActive(pathname, child)}
                  className="site-navbar-dropdown-link"
                  href={child.href}
                  newTab={child.newTab}
                  onClick={() => setOpenDropdownId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 14,
                    color: matchesActive(pathname, child) ? readableActiveLinkColor : dark ? '#e2e8f0' : '#0f172a',
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
          active={active}
          className="site-navbar-mobile-link"
          href={item.href}
          newTab={item.newTab}
          onClick={() => setMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 12px',
            borderRadius: 16,
            border: `1px solid ${active ? activeLinkBorder : 'transparent'}`,
            color: active ? readableActiveLinkColor : dark ? '#f8fafc' : '#0f172a',
            background: active ? activeLinkBackground : 'transparent',
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
          className="site-navbar-mobile-link"
          data-active={active || open ? 'true' : undefined}
          type="button"
          onClick={() => setOpenDropdownId(current => (current === item.id ? null : item.id))}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: active || open ? activeLinkBackground : 'transparent',
            border: `1px solid ${active || open ? activeLinkBorder : 'transparent'}`,
            borderRadius: 16,
            color: active || open ? readableActiveLinkColor : dark ? '#f8fafc' : '#0f172a',
            padding: '12px',
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
                active={matchesActive(pathname, child)}
                className="site-navbar-mobile-link"
                href={child.href}
                newTab={child.newTab}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  marginLeft: 10,
                  color: matchesActive(pathname, child) ? readableActiveLinkColor : dark ? '#cbd5e1' : '#334155',
                  background: matchesActive(pathname, child)
                    ? activeLinkBackground
                    : dark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(15,23,42,0.04)',
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

  function renderBottomNavItem(item: (typeof mobileBottomItems)[number]) {
    const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

    return (
      <NavLink
        key={item.href}
        active={active}
        className="site-mobile-bottom-nav-item"
        href={item.href}
        style={{
          color: active ? readableActiveLinkColor : dark ? 'rgba(226,232,240,0.76)' : 'rgba(15,23,42,0.64)',
          background: active
            ? dark
              ? 'rgba(56,189,248,0.18)'
              : 'rgba(14,165,233,0.14)'
            : 'transparent',
          border: `1px solid ${active ? activeLinkBorder : 'transparent'}`,
          boxShadow: active
            ? dark
              ? '0 10px 26px rgba(14,165,233,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 10px 24px rgba(14,165,233,0.16), inset 0 1px 0 rgba(255,255,255,0.72)'
            : 'none',
        }}
      >
        <span className="site-mobile-bottom-nav-icon">{item.icon}</span>
        <span>{item.label}</span>
      </NavLink>
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
          padding: '88px 18px calc(26px + env(safe-area-inset-bottom))',
          overflowY: 'auto',
        };

  return (
    <>
      <style>{`
        @keyframes navbarDropIn {
          from {
            opacity: 0;
            translate: 0 -8px;
            scale: 0.98;
          }
          to {
            opacity: 1;
            translate: 0 0;
            scale: 1;
          }
        }
        @keyframes mobilePanelIn {
          from {
            opacity: 0;
            translate: 0 -10px;
            scale: 0.98;
          }
          to {
            opacity: 1;
            translate: 0 0;
            scale: 1;
          }
        }
        .site-navbar {
          will-change: background, box-shadow, border-color;
        }
        .site-navbar a,
        .site-navbar button {
          -webkit-tap-highlight-color: transparent;
        }
        .site-navbar-brand,
        .site-nav-link,
        .site-navbar-action,
        .site-navbar-mobile-link {
          transform: translate3d(0, 0, 0);
          transition:
            color 180ms ease,
            background 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease,
            opacity 180ms ease,
            transform 220ms cubic-bezier(.2,.8,.2,1);
          will-change: transform;
        }
        .site-navbar-brand:hover,
        .site-nav-link:hover,
        .site-navbar-action:hover,
        .site-navbar-mobile-link:hover {
          transform: translate3d(0, -1px, 0);
        }
        .site-navbar-brand img {
          transition: transform 260ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease;
        }
        .site-navbar-brand:hover img {
          transform: rotate(-2deg) scale(1.04);
          box-shadow: 0 12px 28px rgba(14,165,233,0.18);
        }
        .site-nav-link {
          position: relative;
          overflow: hidden;
        }
        .site-nav-link::after {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 5px;
          height: 2px;
          border-radius: 999px;
          background: ${navAccent};
          content: "";
          opacity: 0;
          transform: scaleX(0);
          transform-origin: center;
          transition: opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1);
        }
        .site-nav-link:hover::after,
        .site-nav-link[data-active="true"]::after {
          opacity: 1;
          transform: scaleX(1);
        }
        .site-navbar-dropdown {
          animation: navbarDropIn 180ms cubic-bezier(.2,.8,.2,1);
          transform-origin: top center;
        }
        .site-navbar-dropdown-link,
        .site-navbar-mobile-link {
          transition:
            color 180ms ease,
            background 220ms ease,
            border-color 220ms ease,
            transform 220ms cubic-bezier(.2,.8,.2,1);
        }
        .site-navbar-dropdown-link:hover,
        .site-navbar-mobile-link:hover {
          transform: translate3d(3px, 0, 0);
        }
        .site-navbar-mobile-panel {
          animation: mobilePanelIn 200ms cubic-bezier(.2,.8,.2,1);
          transform-origin: top right;
        }
        .site-navbar-mobile-backdrop {
          animation: mobilePanelIn 180ms cubic-bezier(.2,.8,.2,1);
        }
        .site-navbar-mobile-panel .site-navbar-action {
          width: 100%;
          min-height: 38px;
          justify-content: center;
        }
        .site-navbar-mobile-panel .site-navbar-mobile-link {
          width: 100%;
          box-shadow: none;
        }
        .site-mobile-bottom-nav {
          animation: mobilePanelIn 240ms cubic-bezier(.2,.8,.2,1);
          backdrop-filter: blur(22px) saturate(1.28);
          -webkit-backdrop-filter: blur(22px) saturate(1.28);
        }
        .site-mobile-bottom-nav-item {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border-radius: 15px;
          padding: 4px 5px;
          flex-direction: column;
          font-size: 9px;
          font-weight: 850;
          line-height: 1;
          overflow: hidden;
          transform: translate3d(0, 0, 0);
          transition:
            color 180ms ease,
            background 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease,
            transform 220ms cubic-bezier(.2,.8,.2,1);
        }
        .site-mobile-bottom-nav-item::before {
          position: absolute;
          inset: 3px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(56,189,248,0.18), rgba(37,99,235,0.06));
          content: "";
          opacity: 0;
          transition: opacity 220ms ease;
        }
        .site-mobile-bottom-nav-item[data-active="true"]::before,
        .site-mobile-bottom-nav-item:hover::before {
          opacity: 1;
        }
        .site-mobile-bottom-nav-item:hover {
          transform: translate3d(0, -3px, 0);
        }
        .site-mobile-bottom-nav-item > span {
          position: relative;
          z-index: 1;
        }
        .site-mobile-bottom-nav-icon {
          display: inline-flex;
          width: 18px;
          height: 15px;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          line-height: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .site-navbar *,
          .site-navbar-mobile-backdrop,
          .site-navbar-dropdown,
          .site-navbar-mobile-panel,
          .site-mobile-bottom-nav,
          .site-mobile-bottom-nav-item {
            animation: none !important;
            transition: none !important;
          }
        }
        .site-navbar a:hover,
        .site-navbar button:hover {
          color: ${hoverColor};
        }
        @media (min-width: 960px) {
          .site-navbar-mobile {
            display: none !important;
          }
          .site-mobile-bottom-nav {
            display: none !important;
          }
        }
        @media (max-width: 959px) {
          body {
            padding-bottom: calc(60px + env(safe-area-inset-bottom));
          }
          .site-navbar-desktop {
            display: none !important;
          }
        }
      `}</style>

      {menuOpen ? (
        <>
          <div
            className="site-navbar-mobile-backdrop"
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: dark ? '#020617' : '#ffffff',
              zIndex: 999,
            }}
          />
          <div
            className="site-navbar-mobile-panel"
            style={{
              ...mobilePanelStyle,
              background: dark ? '#020617' : '#ffffff',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
              boxShadow: dark
                ? '0 30px 80px rgba(0,0,0,0.5)'
                : '0 30px 80px rgba(15,23,42,0.22)',
              zIndex: 1001,
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
        </>
      ) : null}

      <nav
        className="site-navbar"
        style={{
          position: design.sticky ? 'sticky' : 'relative',
          top: 0,
          zIndex: menuOpen ? 1000 : 60,
          padding: heightPreset.navPadding,
          transition: 'background 260ms ease, border-color 260ms ease, box-shadow 260ms ease, padding 260ms ease',
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
              design.layout === 'centered'
                ? 'minmax(0, 1fr) auto minmax(0, 1fr)'
                : design.layout === 'split'
                  ? 'minmax(0, auto) minmax(0, 1fr) auto'
                  : 'minmax(0, auto) minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: 18,
            position: 'relative',
            zIndex: menuOpen ? 1002 : 1,
          }}
        >
          <div
            style={{
            justifySelf: design.layout === 'centered' ? 'start' : 'start',
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            position: 'relative',
            zIndex: menuOpen ? 1002 : 1,
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
                className="site-navbar-action"
                onClick={toggleTheme}
                type="button"
                aria-label={themeRender.sr}
                style={{
                  ...actionButtonBase,
                  ...themeButtonStyle['icon-only'],
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}`,
                  color: dark ? '#f8fafc' : '#0f172a',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.64)',
                  position: 'relative',
                  zIndex: 1002,
                }}
              >
                {themeRender.icon}
              </button>
            ) : null}
            <button
              className="site-navbar-action"
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
                position: 'relative',
                zIndex: 1002,
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>
      </nav>

      {!menuOpen ? (
        <div
          className="site-mobile-bottom-nav"
          style={{
            position: 'fixed',
            left: 'max(12px, env(safe-area-inset-left))',
            right: 'max(12px, env(safe-area-inset-right))',
            bottom: 'calc(7px + env(safe-area-inset-bottom))',
            zIndex: 70,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 4,
            padding: 4,
            borderRadius: 20,
            border: `1px solid ${dark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.1)'}`,
            background: dark
              ? 'linear-gradient(135deg, rgba(2,6,23,0.68), rgba(15,23,42,0.5))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(241,245,249,0.58))',
            boxShadow: dark
              ? '0 22px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 22px 56px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.72)',
          }}
        >
          {mobileBottomItems.map(renderBottomNavItem)}
        </div>
      ) : null}
    </>
  );
}
