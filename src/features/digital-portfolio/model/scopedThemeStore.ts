import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

type ScopedTheme = 'light' | 'dark' | 'system';

interface ScopedThemeState {
  theme: ScopedTheme;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: ScopedTheme) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
  initSystemThemeListener: () => (() => void) | undefined;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: ScopedTheme): 'light' | 'dark' => {
  if (theme === 'system') return getSystemTheme();
  return theme;
};

/**
 * Scoped Theme Store for Digital Portfolio
 * This store manages theme state WITHOUT manipulating document.documentElement
 * Theme is applied via a scoped wrapper component only
 */
export const useScopedThemeStore = create<ScopedThemeState>()(
  devtools(
    immer(
      persist(
        (set, get) => ({
          theme: 'light',
          resolvedTheme: 'light',

          toggleTheme: () => {
            set((state) => {
              const newTheme = state.resolvedTheme === 'light' ? 'dark' : 'light';
              state.theme = newTheme;
              state.resolvedTheme = newTheme;
            });
            // Note: No document.documentElement manipulation
            // Theme is applied via DigitalPortfolioThemeProvider wrapper
          },

          setTheme: (theme) => {
            set((state) => {
              state.theme = theme;
              state.resolvedTheme = resolveTheme(theme);
            });
          },

          setResolvedTheme: (resolvedTheme) => {
            set((state) => {
              state.resolvedTheme = resolvedTheme;
            });
          },

          // Initialize system theme listener
          initSystemThemeListener: () => {
            if (typeof window === 'undefined') return;
            
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
              const { theme } = get();
              if (theme === 'system') {
                get().setResolvedTheme(e.matches ? 'dark' : 'light');
              }
            };
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
          },
        }),
        {
          name: 'digital-portfolio-theme-storage',
          partialize: (state) => ({ theme: state.theme }),
          onRehydrateStorage: () => (state) => {
            if (state) {
              const resolved = resolveTheme(state.theme);
              state.resolvedTheme = resolved;
              // No DOM manipulation - theme is scoped to wrapper
            }
          },
        }
      )
    ),
    { name: 'ScopedThemeStore' }
  )
);

// Hook for components that need theme
export const useScopedTheme = () => {
  const theme = useScopedThemeStore((state) => state.theme);
  const resolvedTheme = useScopedThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useScopedThemeStore((state) => state.toggleTheme);
  const setTheme = useScopedThemeStore((state) => state.setTheme);

  return { theme, resolvedTheme, toggleTheme, setTheme };
};

// Hook for just checking if dark mode (scoped)
export const useIsScopedDark = () => useScopedThemeStore((state) => state.resolvedTheme === 'dark');
