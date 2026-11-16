import {createRoot} from 'react-dom/client';
import '@fontsource/google-sans/latin-400.css';
import '@fontsource/google-sans/latin-500.css';
import '@fontsource/google-sans/latin-600.css';
import '@fontsource/google-sans/latin-700.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'caches' in window) {
  caches.delete('messages-offline-v1').catch(() => {});
}

if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.location.hostname !== 'appassets.androidplatform.net'
) {
  if (navigator.onLine) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((reg) => {
          if (import.meta.env.DEV && reg.active?.scriptURL.endsWith('/sw.js')) {
            reg.unregister().catch(() => {});
          } else {
            reg.update().catch(() => {});
          }
        });
      })
      .catch(() => {});
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        if (navigator.onLine) {
          registration.update().catch(() => {});
        }
        window.addEventListener('online', () => {
          registration.update().catch(() => {});
        });
      }
    },
    onRegisterError() {
      // Never block app rendering if SW registration fails
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
