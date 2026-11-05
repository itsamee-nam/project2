import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PantryItem, Prefs } from '../types';
import { addDays, daysUntil, fromISODate } from '../utils/dates';

/** Show notifications while the app is open too. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'pantry-reminders';
const REMINDER_HOUR = 9; // 9:00 local time

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Pantry reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export interface PlannedReminder {
  key: string;
  title: string;
  body: string;
  at: Date;
}

function atReminderHour(iso: string): Date {
  const d = fromISODate(iso);
  d.setHours(REMINDER_HOUR, 0, 0, 0);
  return d;
}

/**
 * Pure planning function (unit-tested): decides which notifications should exist.
 *  - Expiry: one per item, `daysBefore` days ahead at 09:00. If that moment already passed but the
 *    item has not expired yet, remind at the next 09:00 instead (never in the past).
 *  - Low stock: a single summary for all items at or below their threshold, at the next 09:00.
 */
export function planReminders(items: PantryItem[], prefs: Prefs, now: Date = new Date()): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  const nextNine = new Date(now);
  nextNine.setHours(REMINDER_HOUR, 0, 0, 0);
  if (nextNine.getTime() <= now.getTime() + 60_000) nextNine.setDate(nextNine.getDate() + 1);

  if (prefs.expiryNotify) {
    for (const it of items) {
      if (!it.expiryDate) continue;
      const left = daysUntil(it.expiryDate, now);
      if (left < 0) continue; // already expired
      let at = atReminderHour(addDays(it.expiryDate, -prefs.daysBefore));
      if (at.getTime() <= now.getTime() + 60_000) {
        at = nextNine;
        // If the next 09:00 is after the expiry day ends, there is no point reminding.
        if (daysUntil(it.expiryDate, at) < 0) continue;
      }
      const body =
        left === 0 ? `${it.name} expires today. Cook with it now!` :
        left === 1 ? `${it.name} expires tomorrow. Plan a recipe with it.` :
        `${it.name} expires in ${left} days. Plan a recipe with it.`;
      plan.push({ key: `exp-${it.id}`, title: 'Expiring soon', body, at });
    }
  }

  if (prefs.lowStockNotify) {
    const low = items.filter((i) => i.lowStockAt > 0 && i.quantity <= i.lowStockAt);
    if (low.length) {
      const names = low.slice(0, 4).map((i) => i.name).join(', ');
      const more = low.length > 4 ? ` and ${low.length - 4} more` : '';
      plan.push({
        key: 'low-stock',
        title: 'Running low',
        body: `${names}${more} ${low.length === 1 ? 'is' : 'are'} running low. Add to your grocery list?`,
        at: nextNine,
      });
    }
  }
  return plan;
}

let lastSignature = '';

/** Cancel everything and schedule the current plan. Cheap enough to run on every pantry change. */
export async function syncReminders(items: PantryItem[], prefs: Prefs): Promise<number> {
  const plan = planReminders(items, prefs);
  const signature = JSON.stringify(plan.map((p) => [p.key, p.at.getTime(), p.body]));
  if (signature === lastSignature) return plan.length;
  lastSignature = signature;

  const perm = await Notifications.getPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!perm.granted) return 0;

  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.key,
      content: { title: p.title, body: p.body, data: { key: p.key } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: CHANNEL_ID },
    });
  }
  return plan.length;
}

export async function cancelAllReminders() {
  lastSignature = '';
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** For the "Send test reminder" button in Settings. */
export async function sendTestNotification() {
  const ok = await ensurePermission();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'DormChef', body: 'Reminders are working. Your pantry is in good hands!' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL_ID },
  });
  return true;
}

