
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './app';

// Register service worker for offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered.', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);