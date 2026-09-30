import type { Registry as Services } from '@ember/service';

// localStorage keys the app no longer reads. A visitor's browser keeps a key
// forever unless something removes it, so when a persisted setting (or any
// other stored value) goes away, move its key here: every boot removes these,
// so each visitor's browser is cleaned up on their next visit. Removing a key
// that isn't there is a no-op, so an entry can stay for as long as a returning
// visitor might still carry it.
export const RETIRED_STORAGE_KEYS: readonly string[] = [
  // The "close the station panel by clicking the map" toggle; that is now
  // simply how the map behaves (#157).
  'settings.mapClickClosesPanel',
  // The "spin the refresh button when refreshing" toggle; the button now
  // always spins (#172).
  'settings.refreshButtonSpin',
];

// Goes through the tracked-local-storage service rather than raw
// `localStorage`, so the service's in-memory cells stay in step with storage.
export function removeRetiredStorageKeys(
  storage: Services['tracked-local-storage']
): void {
  for (const key of RETIRED_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}
