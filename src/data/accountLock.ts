export type AccountLock = <T>(userId: string, action: () => Promise<T>, requireCrossTab?: boolean) => Promise<T>;
const chains = new Map<string, Promise<unknown>>();

export const accountLock: AccountLock = async (userId, action, requireCrossTab = false) => {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(`forge-account-${userId}`, action);
  if (requireCrossTab) throw new Error('Safe merge requires a browser with Web Locks. Open Forge in a current browser.');
  // Reads and ordinary offline logging still work in older browsers; merge fails closed.
  const before = chains.get(userId) ?? Promise.resolve();
  const next = before.catch(() => {}).then(action);
  chains.set(userId, next);
  try { return await next; } finally { if (chains.get(userId) === next) chains.delete(userId); }
};
