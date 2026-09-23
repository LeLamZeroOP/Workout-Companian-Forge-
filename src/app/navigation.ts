export type AppRoute = 'today' | 'programs' | 'workout' | 'history' | 'progress' | 'muscles' | 'settings';

export const routes: Array<{ id: AppRoute; label: string; description: string }> = [
  { id: 'today', label: 'Today', description: 'Your training day at a glance.' },
  { id: 'programs', label: 'Programs', description: 'Build and organize your workout programs.' },
  { id: 'workout', label: 'Workout', description: 'Follow your session, one set at a time.' },
  { id: 'history', label: 'History', description: 'Review every completed workout.' },
  { id: 'progress', label: 'Progress', description: 'See weight and volume change over time.' },
  { id: 'muscles', label: 'Muscles', description: 'Understand effective sets by muscle group.' },
  { id: 'settings', label: 'Settings', description: 'Control alerts, units, and your local data.' },
];
