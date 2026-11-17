import { Activity } from 'lucide-react';

interface SignInPageProps {
  onGoogleSignIn: () => void;
  error?: string | null;
  busy?: boolean;
}

export function SignInPage({ onGoogleSignIn, error, busy = false }: SignInPageProps) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="brand-mark" aria-hidden="true"><Activity size={28} strokeWidth={2.4} /></span>
        <p className="eyebrow">Forge account</p>
        <h1>Your training, wherever you are.</h1>
        <p>Sign in to keep workouts, body logs, and meals together on your phone and computer. Google shares only your basic account identity with Forge.</p>
        {error && <p className="error-banner" role="alert">{error}</p>}
        <button className="primary-button" type="button" disabled={busy} onClick={onGoogleSignIn}>
          {busy ? 'Connecting…' : 'Continue with Google'}
        </button>
        <p className="auth-fineprint">You can export your data at any time. Offline changes sync after you reconnect.</p>
      </div>
    </main>
  );
}
