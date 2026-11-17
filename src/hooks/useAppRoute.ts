import { useCallback, useEffect, useState } from 'react';
import { routes, type AppRoute } from '../app/navigation';

function routeFromHash(): AppRoute | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return 'today';
  return routes.find(route => route.id === hash)?.id ?? null;
}

export function useAppRoute(guard?: (proceed: () => void) => void) {
  const [route, updateRoute] = useState<AppRoute>(() => routeFromHash() ?? 'today');
  useEffect(() => {
    const receive = () => {
      const next = routeFromHash();
      // Other anchors, including the skip link and authentication callbacks,
      // do not select a different section or rewrite their URL.
      if (next && next !== route) {
        if (!guard) updateRoute(next);
        else {
          let proceeded = false;
          let deferred = false;
          guard(() => {
            proceeded = true;
            if (deferred) window.history.pushState(null, '', '#' + next);
            updateRoute(next);
          });
          deferred = true;
          if (!proceeded) window.history.replaceState(null, '', '#' + route);
        }
      }
    };
    window.addEventListener('popstate', receive);
    window.addEventListener('hashchange', receive);
    return () => { window.removeEventListener('popstate', receive); window.removeEventListener('hashchange', receive); };
  }, [route, guard]);
  const navigate = useCallback((next: AppRoute) => {
    if (next === route) return;
    const proceed = () => {
      if (window.location.hash !== `#${next}`) window.history.pushState(null, '', `#${next}`);
      updateRoute(next);
    };
    if (guard) guard(proceed); else proceed();
  }, [route, guard]);
  return [route, navigate] as const;
}
