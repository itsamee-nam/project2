import { useEffect } from 'react';
import { syncReminders } from '../services/notifications';
import { useAuth } from '../store/auth';
import { useData } from '../store/data';

/** Subscribes to the signed-in user's Firestore data for as long as the app is open. */
export function useCloudSync() {
  const uid = useAuth((s) => s.user?.uid);
  const startSync = useData((s) => s.startSync);
  const reset = useData((s) => s.reset);

  useEffect(() => {
    if (!uid) {
      reset();
      return;
    }
    const stop = startSync(uid);
    return () => {
      stop();
      reset();
    };
  }, [uid, startSync, reset]);
}

/** Re-plans local notifications whenever the pantry or notification settings change. */
export function useReminderSync() {
  const pantry = useData((s) => s.pantry);
  const loaded = useData((s) => s.loaded);
  const prefs = useData((s) => s.prefs);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      syncReminders(pantry, prefs).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [pantry, loaded, prefs]);
}
