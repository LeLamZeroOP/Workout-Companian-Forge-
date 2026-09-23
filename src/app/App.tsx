import { useRef, useState } from 'react';
import { Activity, BarChart3, CalendarDays, Dumbbell, House, Settings, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { routes, type AppRoute } from './navigation';
import { TodayPage } from '../features/today/TodayPage';
import { useAppData } from '../hooks/useAppData';
import '../styles/global.css';

const icons: Record<AppRoute, LucideIcon> = {
  today: House,
  programs: CalendarDays,
  workout: Dumbbell,
  history: Activity,
  progress: BarChart3,
  muscles: UsersRound,
  settings: Settings,
};

export function App() {
  const [route, setRoute] = useState<AppRoute>('today');
  const { data, error } = useAppData();
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = routes.find((item) => item.id === route) ?? routes[0]!;

  function moveFocus(index: number, direction: number) {
    const next = (index + direction + routes.length) % routes.length;
    navRefs.current[next]?.focus();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" aria-label="Forge">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Forge</span>
        </div>
        <nav className="navigation" aria-label="Primary">
          {routes.map((item, index) => {
            const Icon = icons[item.id];
            return (
              <button
                key={item.id}
                ref={(node) => { navRefs.current[index] = node; }}
                type="button"
                className={route === item.id ? 'nav-item active' : 'nav-item'}
                aria-current={route === item.id ? 'page' : undefined}
                onClick={() => setRoute(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveFocus(index, 1);
                  }
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveFocus(index, -1);
                  }
                  if (event.key === 'Enter' || event.key === ' ') setRoute(item.id);
                }}
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <p className="local-note">Saved on this device</p>
      </aside>

      <main id="main-content" className="main-content" tabIndex={-1}>
        <header className="page-header">
          <div>
            <p className="eyebrow">Workout companion</p>
            <h1>{active.label}</h1>
          </div>
          <div className="status-pill"><span aria-hidden="true" /> Local mode</div>
        </header>
        {error && <div className="error-banner" role="alert">Stored data could not be loaded. {error}</div>}
        {route === 'today' ? (
          <TodayPage
            programs={data.programs}
            sessions={data.sessions}
            onPrimaryAction={() => setRoute(data.programs.length === 0 ? 'programs' : 'workout')}
          />
        ) : (
          <section className="empty-stage" aria-labelledby="stage-title">
            <p className="eyebrow">Coming in the next build</p>
            <h2 id="stage-title">{active.description}</h2>
            <p>The foundation is ready for this feature.</p>
          </section>
        )}
      </main>
    </div>
  );
}
