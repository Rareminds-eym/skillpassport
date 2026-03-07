import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
  applyTheme: () => void;
  initSystemThemeListener: () => (() => void) | undefined;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') return getSystemTheme();
  return theme;
};

export const useThemeStore = create<ThemeState>()(
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
            get().applyTheme();
          },

          setTheme: (theme) => {
            set((state) => {
              state.theme = theme;
              state.resolvedTheme = resolveTheme(theme);
            });
            get().applyTheme();
          },

          setResolvedTheme: (resolvedTheme) => {
            set((state) => {
              state.resolvedTheme = resolvedTheme;
            });
          },

          applyTheme: () => {
            const { resolvedTheme } = get();
            const root = document.documentElement;
            if (resolvedTheme === 'dark') {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          },

          // Initialize system theme listener
          initSystemThemeListener: () => {
            if (typeof window === 'undefined') return;
            
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
              const { theme } = get();
              if (theme === 'system') {
                get().setResolvedTheme(e.matches ? 'dark' : 'light');
                get().applyTheme();
              }
            };
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
          },
        }),
        {
          name: 'theme-storage',
          partialize: (state) => ({ theme: state.theme }),
          onRehydrateStorage: () => (state) => {
            if (state) {
              const resolved = resolveTheme(state.theme);
              state.resolvedTheme = resolved;
              // Apply theme after rehydration
              const root = document.documentElement;
              if (resolved === 'dark') {
                root.classList.add('dark');
              } else {
                root.classList.remove('dark');
              }
            }
          },
        }
      )
    ),
    { name: 'ThemeStore' }
  )
);

// Hook for components that need theme
export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return { theme, resolvedTheme, toggleTheme, setTheme };
};

// Hook for just checking if dark mode
export const useIsDark = () => useThemeStore((state) => state.resolvedTheme === 'dark');
