export type AppRoute = 'today' | 'programs' | 'workout' | 'history' | 'progress' | 'body' | 'nutrition' | 'settings' | 'more';

export type AppRouteItem = { id: AppRoute; label: string; description: string };

export const desktopRoutes: AppRouteItem[] = [
  { id: 'today', label: 'Today', description: 'Your training day at a glance.' },
  { id: 'programs', label: 'Programs', description: 'Build and organize your workout programs.' },
  { id: 'workout', label: 'Workout', description: 'Follow your session, one set at a time.' },
  { id: 'history', label: 'History', description: 'Review every completed workout.' },
  { id: 'progress', label: 'Progress', description: 'See weight and volume change over time.' },
  { id: 'body', label: 'Body', description: 'Track weight and measurements, and estimate your calorie target.' },
  { id: 'nutrition', label: 'Nutrition', description: 'Log meals and compare daily macros with your target.' },
  { id: 'settings', label: 'Settings', description: 'Rest alerts, backups, and your saved data.' },
];

export const mobileRoutes: AppRouteItem[] = [desktopRoutes[0]!, desktopRoutes[2]!, desktopRoutes[1]!, desktopRoutes[4]!, { id: 'more', label: 'More', description: 'History, body, nutrition, and settings.' }];
export const routes = [...desktopRoutes, mobileRoutes[4]!];
