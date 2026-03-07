import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { QueryProvider } from './providers/QueryProvider';

// Initialize Zustand stores
import { initializeStores } from './stores';

// Initialize stores before rendering
initializeStores().then(() => {
  console.log('[Zustand] Stores initialized');
});

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
        <App />
      </QueryProvider>
    </HelmetProvider>
  </StrictMode>
);
