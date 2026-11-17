import { useEffect, useState } from 'react';

type Props = { showCheck: boolean; onToday: boolean; blockedReason?: string; onOpenToday: () => void };

export function AppUpdate({ showCheck, onToday, blockedReason, onOpenToday }: Props) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let disposed = false;
    let current: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const inspect = () => { if (!disposed) setReady(Boolean(current?.waiting)); };
    const watch = () => {
      installing?.removeEventListener('statechange', inspect);
      installing = current?.installing ?? null;
      installing?.addEventListener('statechange', inspect);
      inspect();
    };
    const refresh = () => {
      if (document.visibilityState === 'visible') void current?.update().catch(() => undefined);
    };
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(value => {
      if (disposed) return;
      current = value;
      setRegistration(value);
      watch();
      value.addEventListener('updatefound', watch);
      document.addEventListener('visibilitychange', refresh);
      void value.update().catch(() => undefined);
    }).catch(() => { if (!disposed) setMessage('Could not check for updates. Reconnect and try again.'); });
    return () => {
      disposed = true;
      current?.removeEventListener('updatefound', watch);
      installing?.removeEventListener('statechange', inspect);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  async function check() {
    if (!registration) return;
    setBusy(true);
    setMessage('');
    try {
      await registration.update();
      if (!registration.waiting && !registration.installing) setMessage('You’re using the latest available version.');
    } catch { setMessage('Could not check for updates. Reconnect and try again.'); }
    finally { setBusy(false); }
  }

  function apply() {
    if (!registration?.waiting || blockedReason || !onToday) return;
    setBusy(true);
    setMessage('');
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', reload);
      channel.port1.close();
      setBusy(false);
      setMessage('Finish your edits, close all Forge tabs and app windows, then reopen Forge to complete the update.');
    }, 10000);
    function reload() {
      window.clearTimeout(timer);
      channel.port1.close();
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    channel.port1.onmessage = () => {
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', reload);
      channel.port1.close();
      setBusy(false);
      setMessage('Close other Forge tabs and app windows, then try Update and reload again.');
    };
    registration.waiting.postMessage({ type: 'FORGE_APPLY_UPDATE' }, [channel.port2]);
  }

  if (!ready && !showCheck) return null;
  return <section className="analytics-card app-update" aria-label="App updates">
    {!ready && <p className="eyebrow">This device</p>}<h2>{ready ? 'A Forge update is ready' : 'App updates'}</h2>
    <p>{ready ? 'Save your edits before updating. Your saved records stay on this device.' : 'Check for the latest features on this device.'}</p>
    {ready && blockedReason && <p>{blockedReason}</p>}
    <div className="form-actions">
      {ready ? onToday ? <button type="button" className="primary-action" disabled={busy || Boolean(blockedReason)} onClick={apply}>{busy ? 'Updating…' : 'Update and reload'}</button> : <button type="button" className="secondary-action" onClick={onOpenToday}>Go to Today to update</button> : <button type="button" className="secondary-action" disabled={busy || !registration} onClick={() => void check()}>{busy ? 'Checking…' : 'Check for updates'}</button>}
    </div>
    {message && <p role="status">{message}</p>}
  </section>;
}
