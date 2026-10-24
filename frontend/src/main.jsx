import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { Provider } from 'react-redux';

import './assets/base.scss';
import configureAppStore from './config/configureStore';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

const store = configureAppStore();
const rootElement = document.getElementById('root');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </HashRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
