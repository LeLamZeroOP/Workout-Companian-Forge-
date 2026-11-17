import { UnsavedChanges } from '../components/UnsavedChanges';
import { ThemeControl } from '../components/ThemeControl';
import { toast } from 'sonner';
import { useAppRoute } from '../hooks/useAppRoute';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppUpdate } from '../components/AppUpdate';
import { Activity, BarChart3, CalendarDays, ChevronRight, Dumbbell, Ellipsis, House, Scale, Settings, ShieldCheck, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { desktopRoutes, mobileRoutes, routes, type AppRoute } from './navigation';
import { TodayPage } from '../features/today/TodayPage';
import { useAppData } from '../hooks/useAppData';
import { useCloudAppData } from '../hooks/useCloudAppData';
import { isCloudConfigured } from '../data/cloudClient';
import { SignInPage } from '../features/auth/SignInPage';
import { CloudDataManagement } from '../features/settings/CloudDataManagement';
import { ProgramsPage } from '../features/programs/ProgramsPage';
import { WorkoutPage } from '../features/workout/WorkoutPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { BodyPage } from '../features/body/BodyPage';
import { NutritionPage } from '../features/nutrition/NutritionPage';
import { DataManagement } from '../features/settings/DataManagement';
import { WorkoutPreferencesForm } from '../features/settings/WorkoutPreferencesForm';
import { LocalDataRecovery } from '../features/settings/LocalDataRecovery';
import { commonFoods } from '../data/foods/catalog';
import '../styles/global.css';
import '../styles/apple.css';
import { useInputModality } from '../hooks/useInputModality';
import { PageScene } from '../components/PageScene';
import { NavigationHighlight } from '../components/NavigationHighlight';
import '../styles/motion.css';

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

const mobileQuery = '(max-width: 640px)';
function announceSave(result: boolean | void, message: string) {
  // A cloud mutation queues asynchronously; its existing sync status is authoritative.
  if (result === true) toast.success(message);
  return result;
}
function subscribeToViewport(update: () => void) {
  const query = window.matchMedia?.(mobileQuery);
  query?.addEventListener('change', update);
  return () => query?.removeEventListener('change', update);
}
function useIsMobile() {
  return useSyncExternalStore(subscribeToViewport, () => window.matchMedia?.(mobileQuery).matches === true, () => false);
}

export function App() {
  return <UnsavedChanges>{guard => <AppContent guard={guard} />}</UnsavedChanges>;
}

function AppContent({ guard }: { guard: (proceed: () => void) => void }) {
  useInputModality();
  const [route, setRoute] = useAppRoute(guard);
  const isMobile = useIsMobile();
  const local = useAppData();
  const cloud = useCloudAppData();
  const source = isCloudConfigured ? cloud : local;
  const { data, error, saveProgram, deleteProgram, saveExercise, startWorkout, startCustomWorkout, updateSession, finishWorkout, discardWorkout, saveBodyProfile, saveBodyMeasurement, deleteBodyMeasurement, saveNutritionTarget, saveCustomFood, addFoodEntry, copyFoodEntries, deleteFoodEntry } = source;
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = routes.find((item) => item.id === route) ?? routes[0]!;
  const navigationRoutes = isMobile ? mobileRoutes : desktopRoutes;

  useEffect(() => {
    document.title = `${route === 'today' ? 'Today' : routes.find(item => item.id === route)?.label ?? 'Forge'} · Forge`;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [route]);

  function moveFocus(index: number, direction: number) {
    const next = (index + direction + navigationRoutes.length) % navigationRoutes.length;
    navRefs.current[next]?.focus();
  }

  if (isCloudConfigured && !cloud.authReady) return <div className="app-loading">Checking your Forge account…</div>;
  if (isCloudConfigured && !cloud.user) return <><AppUpdate showCheck={false} onToday onOpenToday={() => undefined} /><SignInPage onGoogleSignIn={() => void cloud.signIn()} error={cloud.error} busy={cloud.authBusy} /></>;
  if (!data) return <div className="app-loading" role="status">Loading your training data… {error && <span role="alert">{error} <button type="button" onClick={cloud.retry}>Retry</button></span>}</div>;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
      <aside className="sidebar">
        <div className="brand" aria-label="Forge">
          <span className="brand-mark" aria-hidden="true"><Activity size={24} strokeWidth={2.4} /></span>
          <span>Forge<small>Your personal training space</small></span>
        </div>
        <p className="nav-caption">Overview</p>
        <nav className="navigation" aria-label={isMobile ? 'Mobile primary' : 'Desktop primary'}>
          <NavigationHighlight destination={`${route}:${isMobile}`} />
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
        <div className="sidebar-footer"><ShieldCheck size={17} aria-hidden="true" /><p className="local-note">{isCloudConfigured ? cloud.user?.email : 'Saved on this device'}<small>{isCloudConfigured ? 'Your connected training log' : 'Your progress stays with you'}</small></p></div>
      </aside>

      <main id="main-content" className="main-content" tabIndex={-1}>
        <header className="page-header">
          <div key={route} className="page-title">
            <p className="eyebrow">Your personal training space</p>
            <h1>{active.label}</h1>
            <p className="page-description">{active.description}</p>
          </div>
          <div className="header-tools">
          <ThemeControl />
          <div className={isCloudConfigured ? 'status-pill cloud-status' : 'status-pill'}>{isCloudConfigured ? (cloud.conflictCount ? 'Sync needs review' : cloud.pendingCount ? `${cloud.pendingCount} pending` : cloud.offline ? 'Offline' : 'Synced') : 'Stored locally'}</div>
          </div>
        </header>
        {error && (isCloudConfigured || !local.loadError) && <div className="error-banner" role="alert">{error}</div>}
        <AppUpdate showCheck={route === 'settings'} onToday={route === 'today'} onOpenToday={() => setRoute('today')} blockedReason={data.sessions.some(session => session.completedAt === null) ? 'Finish your active workout before updating.' : isCloudConfigured && (cloud.pendingCount > 0 || cloud.conflictCount > 0) ? 'Wait for your changes to sync and resolve any conflicts before updating.' : error ? 'Resolve the save or loading error before updating.' : undefined} />
        {isCloudConfigured && cloud.pendingCount > 0 && <div className="sync-banner" role="status">{cloud.conflictCount ? 'A change conflicts with a newer edit. Your local copy is preserved.' : `${cloud.pendingCount} change${cloud.pendingCount === 1 ? '' : 's'} saved on this device, waiting to sync.`} <button type="button" onClick={cloud.retry}>Retry sync</button> {cloud.conflictCount > 0 && <button type="button" onClick={() => setRoute('settings')}>Review conflicts</button>}</div>}
        <PageScene key={route}>
        {!isCloudConfigured && local.loadError ? <LocalDataRecovery error={local.loadError} onRetry={local.retryLoad} onReplace={local.replaceData} onReset={() => local.resetData('all')} /> : route === 'today' ? (
          <TodayPage
            exercises={data.exercises}
            onStart={(programId, workoutId) => { startWorkout(programId, workoutId); setRoute('workout'); }}
            programs={data.programs}
            lastSelectedProgramId={data.settings.lastSelectedProgramId}
            sessions={data.sessions}
            onPrimaryAction={() => setRoute(data.sessions.some(session => session.completedAt === null) || data.programs.length > 0 ? 'workout' : 'programs')}
            bodyMeasurements={data.body.measurements}
            nutritionEntries={data.nutrition.diary}
            nutritionTargets={data.nutrition.targets}
            onLogWeight={() => setRoute('body')}
            onAddFood={() => setRoute('nutrition')}
          />
        ) : route === 'programs' ? (
          <ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={program => announceSave(saveProgram(program), 'Program saved')} onDelete={deleteProgram} onSaveExercise={saveExercise} />
        ) : route === 'workout' ? (
          <WorkoutPage saveStatus={isCloudConfigured ? cloud.conflictCount ? 'Saved on this device · sync needs review' : cloud.pendingCount ? 'Saved on this device · waiting to sync' : cloud.offline ? 'Saved on this device · offline' : 'Synced' : 'Saved on this device'} catalog={data.exercises} storageScope={isCloudConfigured ? cloud.user!.id : 'local'} programs={data.programs} sessions={data.sessions} lastSelectedProgramId={data.settings.lastSelectedProgramId} keepScreenAwake={data.settings.keepScreenAwake} restAlertSound={data.settings.restAlertSound} restAlertVibration={data.settings.restAlertVibration} onStart={startWorkout} onStartCustom={startCustomWorkout} onChange={updateSession} onSaveProgram={saveProgram} onFinish={finishWorkout} onDiscard={discardWorkout} />
        ) : route === 'history' ? (
          <HistoryPage onSave={updateSession} onDelete={source.deleteSession} sessions={data.sessions} onOpenWorkout={() => setRoute('workout')} />
        ) : route === 'progress' ? (
          <ProgressPage sessions={data.sessions} programs={data.programs} exerciseCatalog={data.exercises} onOpenWorkout={() => setRoute('workout')} />
        ) : route === 'body' ? (
          <BodyPage profile={data.body.profile} measurements={data.body.measurements} onSaveProfile={saveBodyProfile} onSaveMeasurement={measurement => announceSave(saveBodyMeasurement(measurement), 'Measurement saved')} onDeleteMeasurement={deleteBodyMeasurement} onSaveNutritionTarget={saveNutritionTarget} />
        ) : route === 'nutrition' ? (
          <NutritionPage onCopyEntries={copyFoodEntries} foods={[...commonFoods, ...data.nutrition.customFoods]} entries={data.nutrition.diary} targets={data.nutrition.targets} onAddEntry={entry => announceSave(addFoodEntry(entry), 'Food entry saved')} onDeleteEntry={deleteFoodEntry} onSaveCustomFood={saveCustomFood} onSaveNutritionTarget={saveNutritionTarget} />
        ) : route === 'settings' ? (
          <><WorkoutPreferencesForm settings={data.settings} onSave={source.saveWorkoutPreferences} />{isCloudConfigured ? <CloudDataManagement key={cloud.user?.id} accountName={cloud.user?.email ?? 'your account'} onPrepareMerge={cloud.prepareMerge} onCommitMerge={cloud.commitMerge} onReviewConflicts={cloud.reviewConflicts} onResolveConflicts={cloud.resolveConflicts} data={data} onSignOut={() => void cloud.signOut()} pendingCount={cloud.pendingCount} onImport={cloud.importData} onGetDeviceBackup={cloud.getDeviceBackup} /> : <DataManagement data={data} onImport={local.replaceData} onReset={local.resetData} />}</>
        ) : (
          <section className="more-page" aria-label="More destinations">
            <p className="more-intro">Your history, body log, meals, and local data controls.</p>
            <div className="more-list">{desktopRoutes.filter((item) => ['history', 'body', 'nutrition', 'settings'].includes(item.id)).map((item) => { const Icon = icons[item.id]; return <button type="button" key={item.id} aria-label={`Open ${item.label}`} onClick={() => setRoute(item.id)}><span className="metric-icon"><Icon size={18} aria-hidden="true" /></span><span><strong>{item.label}</strong><small>{item.description}</small></span><ChevronRight size={18} aria-hidden="true" /></button>; })}</div>
          </section>
        )}
        </PageScene>
      </main>
    </div>
  );
}
