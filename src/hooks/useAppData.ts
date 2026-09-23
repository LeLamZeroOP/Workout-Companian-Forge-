import { useState } from 'react';
import type { AppDataV1 } from '../domain/models';
import { createDefaultData } from '../data/defaults';
import { LocalStorageWorkoutRepository } from '../data/localStorageRepository';

const repository = typeof window === 'undefined' ? null : new LocalStorageWorkoutRepository(window.localStorage);

export function useAppData() {
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AppDataV1>(() => {
    try { return repository?.load() ?? createDefaultData(); }
    catch (reason) { setTimeout(() => setError(reason instanceof Error ? reason.message : 'Could not load workout data.')); return createDefaultData(); }
  });

  function updateData(update: (current: AppDataV1) => AppDataV1) {
    setData((current) => {
      const next = update(current);
      try { repository?.save(next); setError(null); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save workout data.'); }
      return next;
    });
  }

  return { data, error, updateData };
}
