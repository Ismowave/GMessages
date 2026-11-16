import {createRoot} from 'react-dom/client';
import '@fontsource/google-sans/latin-400.css';
import '@fontsource/google-sans/latin-500.css';
import '@fontsource/google-sans/latin-600.css';
import '@fontsource/google-sans/latin-700.css';
import App from './App.tsx';
import './index.css';

if (
  'serviceWorker' in navigator &&
  window.location.hostname !== 'appassets.androidplatform.net'
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
