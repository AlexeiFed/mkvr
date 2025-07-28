/**
 * @file: main.tsx
 * @description: Точка входа в приложение
 * @dependencies: react, react-dom, App.tsx
 * @created: 2024-07-06
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
