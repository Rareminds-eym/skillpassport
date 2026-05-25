import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import TagManager from 'react-gtm-module';
import App from './App.tsx';
import './index.css';
import { QueryProvider } from './app/providers/QueryProvider';
import { GlobalErrorBoundary } from './app/providers/GlobalErrorBoundary';
import { validateFileSizeConfig } from './shared/config/fileSizeLimits';
import { getLogger } from '@/shared/config/logging';
import { getAnalyticsConfig, validateAnalyticsConfig } from '@/shared/config/analytics';

const logger = getLogger('main');

// Validate file size configuration at startup
try {
  validateFileSizeConfig();
} catch (error: unknown) {
  logger.error('File size configuration validation failed', error instanceof Error ? error : new Error(String(error)));
  throw error;
}

// Initialize Google Tag Manager
try {
  const analyticsConfig = getAnalyticsConfig();
  validateAnalyticsConfig();

  if (analyticsConfig.gtmId) {
    TagManager.initialize({
      gtmId: analyticsConfig.gtmId,
      dataLayer: {
        // Initial dataLayer values
        platform: 'web',
        environment: import.meta.env.MODE,
      },
      dataLayerName: 'dataLayer',
      // Enable preview mode in development
      auth: analyticsConfig.debugMode ? undefined : undefined,
      preview: analyticsConfig.debugMode ? undefined : undefined,
    });

    if (analyticsConfig.debugMode) {
      logger.info('[Analytics] GTM initialized', {
        gtmId: analyticsConfig.gtmId,
        environment: import.meta.env.MODE,
      });
    }
  } else {
    logger.warn('[Analytics] GTM ID not configured. Analytics tracking is disabled.');
  }
} catch (error: unknown) {
  logger.error('[Analytics] Failed to initialize GTM', error instanceof Error ? error : new Error(String(error)));
  // Don't throw - analytics failures should not break the app
}

// Initialize Zustand stores
import { initializeStores } from '@/shared/model/authStore';

// Initialize stores before rendering
initializeStores();

// Unregister any existing service workers to prevent Workbox warnings
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryProvider>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </QueryProvider>
    </HelmetProvider>
  </StrictMode>
);
