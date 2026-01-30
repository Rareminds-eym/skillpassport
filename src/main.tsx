import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import './styles/scroll-fix.css'; // Emergency scroll fix
import { QueryProvider } from './providers/QueryProvider';

// Emergency scroll unlock on app initialization
if (typeof window !== 'undefined') {
  // Force unlock immediately
  document.body.style.setProperty('overflow', 'auto', 'important');
  document.body.style.setProperty('position', 'static', 'important');
  document.body.style.top = '';
  document.documentElement.style.setProperty('overflow', 'auto', 'important');
  document.body.classList.remove('tour-scroll-locked');
  console.log('✅ Emergency scroll unlock on main.tsx load');
}

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
