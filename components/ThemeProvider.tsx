'use client';

import { createContext, useContext, useLayoutEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const saved = localStorage.getItem('sf_theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    localStorage.setItem('sf_theme', theme);
    applyTheme(theme);
  }, [theme]);

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
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
