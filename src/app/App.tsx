import { useEffect, useRef, useState } from 'react';
import { Activity, BarChart3, CalendarDays, ChevronRight, Dumbbell, Ellipsis, House, Scale, Settings, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { desktopRoutes, mobileRoutes, routes, type AppRoute } from './navigation';
import { TodayPage } from '../features/today/TodayPage';
import { useAppData } from '../hooks/useAppData';
import { ProgramsPage } from '../features/programs/ProgramsPage';
import { WorkoutPage } from '../features/workout/WorkoutPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { BodyPage } from '../features/body/BodyPage';
import { NutritionPage } from '../features/nutrition/NutritionPage';
import { DataManagement } from '../features/settings/DataManagement';
import { commonFoods } from '../data/foods/catalog';
import '../styles/global.css';

const icons: Record<AppRoute, LucideIcon> = {
  today: House,
  programs: CalendarDays,
  workout: Dumbbell,
  history: Activity,
  progress: BarChart3,
  body: Scale,
  nutrition: Utensils,
  settings: Settings,
  more: Ellipsis,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches === true);
  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 640px)');
    if (!query) return;
    const update = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return isMobile;
}

export function App() {
  const [route, setRoute] = useState<AppRoute>('today');
  const isMobile = useIsMobile();
  const { data, error, saveProgram, deleteProgram, saveExercise, startWorkout, updateSession, finishWorkout, discardWorkout, saveBodyProfile, saveBodyMeasurement, deleteBodyMeasurement, saveNutritionTarget, saveCustomFood, addFoodEntry, deleteFoodEntry, replaceData, resetData } = useAppData();
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = routes.find((item) => item.id === route) ?? routes[0]!;
  const navigationRoutes = isMobile ? mobileRoutes : desktopRoutes;

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [route]);

  function moveFocus(index: number, direction: number) {
    const next = (index + direction + navigationRoutes.length) % navigationRoutes.length;
    navRefs.current[next]?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <div className="brand" aria-label="Forge">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Forge</span>
        </div>
        <nav className="navigation" aria-label={isMobile ? 'Mobile primary' : 'Desktop primary'}>
          {navigationRoutes.map((item, index) => {
            const Icon = icons[item.id];
            const isActive = route === item.id || (item.id === 'more' && ['history', 'body', 'nutrition', 'settings'].includes(route));
            return (
              <button
                key={item.id}
                ref={(node) => { navRefs.current[index] = node; }}
                type="button"
                className={isActive ? 'nav-item active' : 'nav-item'}
                aria-current={isActive ? 'page' : undefined}
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
            <p className="eyebrow">Training log</p>
            <h1>{active.label}</h1>
          </div>
          <div className="status-pill">Stored locally</div>
        </header>
        {error && <div className="error-banner" role="alert">Stored data could not be loaded. {error}</div>}
        {route === 'today' ? (
          <TodayPage
            programs={data.programs}
            sessions={data.sessions}
            onPrimaryAction={() => setRoute(data.programs.length === 0 ? 'programs' : 'workout')}
            bodyMeasurements={data.body.measurements}
            nutritionEntries={data.nutrition.diary}
            nutritionTargets={data.nutrition.targets}
            onLogWeight={() => setRoute('body')}
            onAddFood={() => setRoute('nutrition')}
          />
        ) : route === 'programs' ? (
          <ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={saveProgram} onDelete={deleteProgram} onSaveExercise={saveExercise} />
        ) : route === 'workout' ? (
          <WorkoutPage programs={data.programs} sessions={data.sessions} lastSelectedProgramId={data.settings.lastSelectedProgramId} keepScreenAwake={data.settings.keepScreenAwake} onStart={startWorkout} onChange={updateSession} onFinish={finishWorkout} onDiscard={discardWorkout} />
        ) : route === 'history' ? (
          <HistoryPage sessions={data.sessions} />
        ) : route === 'progress' ? (
          <ProgressPage sessions={data.sessions} />
        ) : route === 'body' ? (
          <BodyPage profile={data.body.profile} measurements={data.body.measurements} onSaveProfile={saveBodyProfile} onSaveMeasurement={saveBodyMeasurement} onDeleteMeasurement={deleteBodyMeasurement} onSaveNutritionTarget={saveNutritionTarget} />
        ) : route === 'nutrition' ? (
          <NutritionPage foods={[...commonFoods, ...data.nutrition.customFoods]} entries={data.nutrition.diary} targets={data.nutrition.targets} onAddEntry={addFoodEntry} onDeleteEntry={deleteFoodEntry} onSaveCustomFood={saveCustomFood} onSaveNutritionTarget={saveNutritionTarget} />
        ) : route === 'settings' ? (
          <DataManagement data={data} onImport={replaceData} onReset={resetData} />
        ) : route === 'more' ? (
          <section className="more-page" aria-label="More destinations">
            <p className="more-intro">Your history, body log, meals, and local data controls.</p>
            <div className="more-list">{desktopRoutes.filter((item) => ['history', 'body', 'nutrition', 'settings'].includes(item.id)).map((item) => { const Icon = icons[item.id]; return <button type="button" key={item.id} aria-label={`Open ${item.label}`} onClick={() => setRoute(item.id)}><span className="metric-icon"><Icon size={18} aria-hidden="true" /></span><span><strong>{item.label}</strong><small>{item.description}</small></span><ChevronRight size={18} aria-hidden="true" /></button>; })}</div>
          </section>
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
