import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { QueryProvider } from './app/providers/QueryProvider';
import { GlobalErrorBoundary } from './app/providers/GlobalErrorBoundary';
import { validateFileSizeConfig } from './shared/config/fileSizeLimits';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('main');

// Validate file size configuration at startup
try {
  validateFileSizeConfig();
} catch (error: unknown) {
  logger.error('File size configuration validation failed', error instanceof Error ? error : new Error(String(error)));
  throw error;
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
