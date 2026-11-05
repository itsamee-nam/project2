import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GroceryItem, LogEntry, PantryItem, Prefs, Recipe } from '../types';

/**
 * Firestore layout (all private to the signed-in user):
 *   users/{uid}/pantry/{itemId}
 *   users/{uid}/grocery/{itemId}
 *   users/{uid}/saved/{recipeId}   (full recipe copy, so saved recipes work offline)
 *   users/{uid}/log/{entryId}
 *   users/{uid}/meta/prefs
 */
const col = (uid: string, name: string) => collection(db, 'users', uid, name);
const ref = (uid: string, name: string, id: string) => doc(db, 'users', uid, name, id);

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function listen<T>(uid: string, name: string, onData: (rows: T[]) => void, onError: (e: Error) => void, extra?: { orderField: string }): Unsubscribe {
  const q = extra ? query(col(uid, name), orderBy(extra.orderField, 'desc')) : col(uid, name);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T)),
    (e) => onError(e),
  );
}

export const listenPantry = (uid: string, cb: (r: PantryItem[]) => void, err: (e: Error) => void) => listen<PantryItem>(uid, 'pantry', cb, err);
export const listenGrocery = (uid: string, cb: (r: GroceryItem[]) => void, err: (e: Error) => void) => listen<GroceryItem>(uid, 'grocery', cb, err);
export const listenSaved = (uid: string, cb: (r: Recipe[]) => void, err: (e: Error) => void) => listen<Recipe>(uid, 'saved', cb, err);
export const listenLog = (uid: string, cb: (r: LogEntry[]) => void, err: (e: Error) => void) => listen<LogEntry>(uid, 'log', cb, err);

export function listenPrefs(uid: string, cb: (p: Partial<Prefs> | null) => void, err: (e: Error) => void): Unsubscribe {
  return onSnapshot(ref(uid, 'meta', 'prefs'), (d) => cb(d.exists() ? (d.data() as Partial<Prefs>) : null), err);
}

// Writes -----------------------------------------------------------------------------------------
export const savePantryItem = (uid: string, item: PantryItem) => setDoc(ref(uid, 'pantry', item.id), strip(item));
export const removePantryItem = (uid: string, id: string) => deleteDoc(ref(uid, 'pantry', id));

export const saveGroceryItem = (uid: string, item: GroceryItem) => setDoc(ref(uid, 'grocery', item.id), strip(item));
export const removeGroceryItem = (uid: string, id: string) => deleteDoc(ref(uid, 'grocery', id));

export const saveRecipe = (uid: string, r: Recipe) => setDoc(ref(uid, 'saved', r.id), strip(r));
export const unsaveRecipe = (uid: string, id: string) => deleteDoc(ref(uid, 'saved', id));

export const saveLogEntry = (uid: string, e: LogEntry) => setDoc(ref(uid, 'log', e.id), strip(e));
export const removeLogEntry = (uid: string, id: string) => deleteDoc(ref(uid, 'log', id));

export const savePrefs = (uid: string, p: Prefs) => setDoc(ref(uid, 'meta', 'prefs'), p, { merge: true });

/** Firestore rejects `undefined`; JSON round-trip drops it. */
function strip<T extends object>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}

