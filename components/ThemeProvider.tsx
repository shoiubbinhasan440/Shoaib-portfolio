'use client';

import { createContext, useContext, useLayoutEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  mounted: boolean;
  theme: Theme;
  toggleTheme: () => void;
}>({ mounted: false, theme: 'dark', toggleTheme: () => {} });

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const saved = localStorage.getItem('sf_theme');
    const nextTheme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    applyTheme(nextTheme);

    const frame = requestAnimationFrame(() => {
      setTheme(nextTheme);
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }

    localStorage.setItem('sf_theme', theme);
    applyTheme(theme);
  }, [mounted, theme]);

  function toggleTheme() {
    setTheme(currentTheme => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme-switching', 'true');
      applyTheme(nextTheme);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.removeAttribute('data-theme-switching');
        });
      });

      return nextTheme;
    });
  }

  return (
    <ThemeContext.Provider value={{ mounted, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
