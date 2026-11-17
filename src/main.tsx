import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppNotifications } from './components/AppNotifications';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AppNotifications />
  </StrictMode>,
);

