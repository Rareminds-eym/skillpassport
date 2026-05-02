/**
 * Utility to suppress Recharts dimension warnings in development
 * These warnings occur when charts try to render before containers are properly sized
 */

let originalWarn = null;
let isSuppressionActive = false;

export const suppressRechartsWarnings = () => {
  if (isSuppressionActive || typeof window === 'undefined') {
    return;
  }

  originalWarn = console.warn;
  isSuppressionActive = true;

  console.warn = (...args) => {
    const message = args[0];
    
    // Suppress specific Recharts dimension warnings
    if (typeof message === 'string') {
      const isRechartsWarning = 
        message.includes('width') && 
        message.includes('height') && 
        (message.includes('chart should be greater than 0') || 
         message.includes('minWidth') || 
         message.includes('minHeight'));
      
      if (isRechartsWarning) {
        // Log a single suppressed message instead of the full warning
        console.log('📊 Recharts dimension warning suppressed (chart initializing...)');
        return;
      }
    }
    
    // Allow all other warnings through
    originalWarn.apply(console, args);
  };
};

export const restoreWarnings = () => {
  if (!isSuppressionActive || !originalWarn) {
    return;
  }

  console.warn = originalWarn;
  originalWarn = null;
  isSuppressionActive = false;
};

// Auto-initialize in development
// Note: This is a module-level side effect that runs on import
// to suppress Recharts dimension warnings during chart initialization
if (import.meta.env.DEV) {
  suppressRechartsWarnings();
}