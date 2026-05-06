'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import PremiumPortfolioLoader, {
  type PremiumPortfolioLoaderImage,
} from '@/components/PremiumPortfolioLoader';
import type { GlobalSettingsConfig } from '@/lib/global-settings';

type GlobalRouteLoaderProps = {
  images: PremiumPortfolioLoaderImage[];
  loader: GlobalSettingsConfig['loader'];
  mode: GlobalSettingsConfig['theme']['defaultTheme'];
};

function shouldHandleAnchor(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  if (anchor.target && anchor.target !== '_self') {
    return false;
  }

  if (anchor.hasAttribute('download')) {
    return false;
  }

  const nextUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) {
    return false;
  }

  return nextUrl.pathname !== currentUrl.pathname || nextUrl.search !== currentUrl.search;
}

export default function GlobalRouteLoader({ images, loader, mode }: GlobalRouteLoaderProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const startedAt = useRef(0);
  const hideTimer = useRef<number | null>(null);
  const maxTimer = useRef<number | null>(null);
  const currentRoute = pathname;
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const routeEnabled = loader.enabled && (isAdminRoute ? loader.applyToAdmin : loader.applyToPublic);

  useEffect(() => {
    if (!routeEnabled) {
      return undefined;
    }

    const initialTimer = window.setTimeout(() => {
      startedAt.current = performance.now();
      setVisible(true);
      maxTimer.current = window.setTimeout(() => setVisible(false), 6500);
    }, 0);

    function clearTimers() {
      window.clearTimeout(initialTimer);

      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      if (maxTimer.current) {
        window.clearTimeout(maxTimer.current);
        maxTimer.current = null;
      }
    }

    function showLoader() {
      clearTimers();
      startedAt.current = performance.now();
      setVisible(true);
      maxTimer.current = window.setTimeout(() => setVisible(false), 6500);
    }

    function scheduleLoader() {
      window.setTimeout(showLoader, 0);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;

      if (anchor && shouldHandleAnchor(anchor)) {
        scheduleLoader();
      }
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) {
        return;
      }

      const method = (form.method || 'get').toLowerCase();
      if (method === 'get') {
        scheduleLoader();
      }
    }

    document.addEventListener('click', onClick, { capture: false });
    document.addEventListener('submit', onSubmit, { capture: true });

    return () => {
      clearTimers();
      document.removeEventListener('click', onClick, { capture: false });
      document.removeEventListener('submit', onSubmit, { capture: true });
    };
  }, [routeEnabled]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const elapsed = performance.now() - startedAt.current;
    const remaining = Math.max(0, loader.minimumDuration - elapsed);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
    }, remaining);

    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [currentRoute, loader.minimumDuration, visible]);

  if (!routeEnabled || !visible) {
    return null;
  }

  return (
    <div className="global-route-loader" aria-hidden={!visible}>
      <PremiumPortfolioLoader
        images={images}
        minimumDuration={loader.minimumDuration}
        mode={mode}
        rotationSpeed={loader.rotationSpeed}
        showProgressDots={loader.showProgressDots}
        showRotatingStroke={loader.showRotatingStroke}
        style={loader.style}
        text={loader.text}
      />
      <style>{`
        .global-route-loader {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          pointer-events: auto;
        }

        .global-route-loader .premium-loader {
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
