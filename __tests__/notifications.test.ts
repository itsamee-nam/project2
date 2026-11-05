jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { planReminders } from '../src/services/notifications';
import { DEFAULT_PREFS, type PantryItem } from '../src/types';

const item = (over: Partial<PantryItem>): PantryItem => ({
  id: 'x', name: 'Milk', category: 'Dairy & Eggs', quantity: 5, unit: 'pcs', lowStockAt: 0, expiryDate: null, createdAt: 0, ...over,
});

// 4 Nov 2026, 10:00 local
const now = new Date(2026, 10, 4, 10, 0, 0);

describe('planReminders', () => {
  it('schedules expiry reminders daysBefore at 09:00', () => {
    const plan = planReminders([item({ expiryDate: '2026-11-10' })], DEFAULT_PREFS, now); // daysBefore=2
    expect(plan).toHaveLength(1);
    expect(plan[0].at.getFullYear()).toBe(2026);
    expect(plan[0].at.getMonth()).toBe(10);
    expect(plan[0].at.getDate()).toBe(8);
    expect(plan[0].at.getHours()).toBe(9);
  });
  it('never schedules in the past: falls back to next 09:00', () => {
    const plan = planReminders([item({ expiryDate: '2026-11-05' })], DEFAULT_PREFS, now);
    expect(plan).toHaveLength(1);
    expect(plan[0].at.getTime()).toBeGreaterThan(now.getTime());
    expect(plan[0].at.getDate()).toBe(5);
  });
  it('skips already expired items and items without dates', () => {
    const plan = planReminders([item({ id: 'a', expiryDate: '2026-11-01' }), item({ id: 'b' })], DEFAULT_PREFS, now);
    expect(plan).toHaveLength(0);
  });
  it('skips when the next 09:00 is after the expiry day', () => {
    // expires today (4 Nov) but 09:00 today has passed; tomorrow is too late
    const plan = planReminders([item({ expiryDate: '2026-11-04' })], DEFAULT_PREFS, now);
    expect(plan).toHaveLength(0);
  });
  it('groups low-stock items into a single reminder', () => {
    const plan = planReminders(
      [item({ id: '1', name: 'Rice', quantity: 1, lowStockAt: 2 }), item({ id: '2', name: 'Oil', quantity: 0, lowStockAt: 1 }), item({ id: '3', name: 'Salt', quantity: 9, lowStockAt: 2 })],
      DEFAULT_PREFS,
      now,
    );
    const low = plan.filter((p) => p.key === 'low-stock');
    expect(low).toHaveLength(1);
    expect(low[0].body).toContain('Rice');
    expect(low[0].body).toContain('Oil');
    expect(low[0].body).not.toContain('Salt');
  });
  it('respects the notification switches', () => {
    const items = [item({ expiryDate: '2026-11-10', quantity: 0, lowStockAt: 1 })];
    expect(planReminders(items, { ...DEFAULT_PREFS, expiryNotify: false, lowStockNotify: false }, now)).toHaveLength(0);
    expect(planReminders(items, { ...DEFAULT_PREFS, expiryNotify: false }, now)).toHaveLength(1);
  });
});
