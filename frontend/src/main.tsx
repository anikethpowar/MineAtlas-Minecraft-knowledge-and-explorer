import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Main application entrypoint.
 * Mounts the React component tree into the DOM root element.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

