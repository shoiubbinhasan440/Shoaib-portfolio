'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

function applyTheme(theme: Theme) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#0a0a0a' : '#ffffff';
  const fg = isDark ? '#ffffff' : '#111111';

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.background = bg;
  document.documentElement.style.color = fg;
  document.body.style.background = bg;
  document.body.style.color = fg;

  // Inject a style tag to override all hardcoded backgrounds
  const styleId = 'theme-override';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  if (isDark) {
    styleEl.innerHTML = '';
  } else {
    styleEl.innerHTML = `
      [style*="background: rgb(10, 10, 10)"],
      [style*="background: rgba(8, 8, 8"],
      [style*="background: rgba(10, 10, 10"],
      [style*="background:#0a0a0a"],
      [style*="background: #0a0a0a"],
      [style*="background-color: rgb(10, 10, 10)"] {
        background: #f8f8f8 !important;
      }
      [style*="color: rgb(255, 255, 255)"],
      [style*="color: #fff"],
      [style*="color: white"] {
        color: #111 !important;
      }
      [style*="color: rgb(85, 85, 85)"],
      [style*="color: #555"],
      [style*="color: #666"] {
        color: #444 !important;
      }
      [style*="borderBottom"][style*="rgba(255,255,255"],
      [style*="border-bottom"][style*="rgba(255,255,255"] {
        border-color: rgba(0,0,0,0.1) !important;
      }
      [style*="background: rgba(255, 255, 255, 0.05)"],
      [style*="background: rgba(255,255,255,0.05)"] {
        background: rgba(0,0,0,0.05) !important;
      }
    `;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);