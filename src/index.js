import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Suppress uncaught promise rejections from showing dev overlay (handled per component)
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.isAxiosError) e.preventDefault();
});
