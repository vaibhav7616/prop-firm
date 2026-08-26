import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDashboardArea: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'fundedshift_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();

  // Check if current route is in authenticated dashboard/admin area
  const isDashboardArea =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/checkout');

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      // Rule: Frontend marketing / public pages MUST ALWAYS remain in light (white) mode.
      // Dark mode is only activated for logged-in users inside the dashboard/admin areas.
      let current: 'light' | 'dark' = 'light';

      if (isDashboardArea && user) {
        if (theme === 'system') {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          current = systemDark ? 'dark' : 'light';
        } else {
          current = theme;
        }
      } else {
        // Frontend / public / logged out state is strictly forced to light
        current = 'light';
      }

      setResolvedTheme(current);

      if (current === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system' && isDashboardArea && user) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme, isDashboardArea, user, location.pathname]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore storage write errors in restricted iframe
    }
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, isDashboardArea }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
