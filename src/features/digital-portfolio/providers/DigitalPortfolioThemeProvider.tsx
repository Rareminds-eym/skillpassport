import React, { useEffect } from 'react';
import { useScopedThemeStore } from '../model/scopedThemeStore';

interface DigitalPortfolioThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider for Digital Portfolio
 * 
 * This component wraps the entire digital portfolio feature and applies
 * a scoped theme using the `portfolio-dark` class instead of the global `dark` class.
 * 
 * This ensures that theme changes in the digital portfolio ONLY affect
 * digital portfolio components and do not bleed into other parts of the application.
 * 
 * Usage:
 * <DigitalPortfolioThemeProvider>
 *   <YourDigitalPortfolioComponents />
 * </DigitalPortfolioThemeProvider>
 */
export const DigitalPortfolioThemeProvider: React.FC<DigitalPortfolioThemeProviderProps> = ({ 
  children 
}) => {
  const resolvedTheme = useScopedThemeStore((state) => state.resolvedTheme);
  const initSystemThemeListener = useScopedThemeStore((state) => state.initSystemThemeListener);

  // Initialize system theme listener on mount
  // Note: Empty dependency array is correct here because Zustand store selectors are stable references
  // The initSystemThemeListener function is the same reference across renders
  useEffect(() => {
    const cleanup = initSystemThemeListener();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      className={resolvedTheme === 'dark' ? 'portfolio-dark' : 'portfolio-light'}
      data-theme-scope="digital-portfolio"
    >
      {children}
    </div>
  );
};
