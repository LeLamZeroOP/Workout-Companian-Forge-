import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export function AppNotifications() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return <Toaster theme={theme} position="bottom-right" closeButton offset={24} mobileOffset={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16 }} toastOptions={{ duration: 3500, style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '1rem', fontFamily: 'inherit', boxShadow: 'var(--shadow-floating)' } }} />;
}
