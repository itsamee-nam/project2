import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as db from '../services/db';
import {
  DEFAULT_PREFS, type GroceryItem, type LogEntry, type Macros, type PantryItem, type Prefs, type Recipe, type Unit, UNITS,
} from '../types';
import { splitMeasure } from '../utils/measure';
import { ingredientMatches, normalizeName, titleCase } from '../utils/text';
import { todayISO } from '../utils/dates';
import { useAuth } from './auth';
import { toast } from './toast';

const PREFS_KEY = 'dormchef:prefs';

interface DataState {
  pantry: PantryItem[];
  grocery: GroceryItem[];
  saved: Recipe[];
  log: LogEntry[];
  prefs: Prefs;
  /** pantry snapshot received at least once */
  loaded: boolean;

  // lifecycle
  startSync: (uid: string) => () => void;
  loadLocalPrefs: () => Promise<void>;
  reset: () => void;

  // pantry
  addPantryItem: (input: Omit<PantryItem, 'id' | 'createdAt'>) => void;
  updatePantryItem: (item: PantryItem) => void;
  deletePantryItem: (id: string) => void;

  // grocery
  addToGrocery: (items: { name: string; quantity?: string }[], source: GroceryItem['source'], recipeTitle?: string) => number;
  removeGroceryItem: (id: string) => void;
  tickGroceryItem: (item: GroceryItem) => void;
  clearGrocery: () => void;

  // recipes
  isSaved: (id: string) => boolean;
  toggleSaved: (recipe: Recipe) => void;

  // tracker
  logCooked: (recipe: Recipe, servings: number, perServing: Macros) => void;
  deleteLogEntry: (id: string) => void;

  // settings
  setPrefs: (patch: Partial<Prefs>) => void;
}

const uid = () => useAuth.getState().user?.uid ?? null;

/** Fire a Firestore write without blocking the UI (it also works offline and syncs later). */
function write(p: Promise<unknown>) {
  p.catch((e: Error) => toast(`Could not sync: ${e.message}`));
}

/** "200g" -> {200, g};  "2 tbsp" -> {2, tbsp};  "to taste" / "1 medium" -> {1, pcs}. */
export function parseQuantityText(text: string | undefined): { quantity: number; unit: Unit } {
  if (!text) return { quantity: 1, unit: 'pcs' };
  const { amount, rest } = splitMeasure(text);
  if (amount === null || amount <= 0) return { quantity: 1, unit: 'pcs' };
  const u = rest.toLowerCase().split(/\s+/)[0] ?? '';
  const map: Record<string, Unit> = {
    g: 'g', gm: 'g', gram: 'g', grams: 'g', kg: 'kg', ml: 'ml', l: 'L', litre: 'L', liter: 'L',
    cup: 'cups', cups: 'cups', tbsp: 'tbsp', tsp: 'tsp', pack: 'packs', packs: 'packs',
  };
  const unit = map[u];
  return unit && UNITS.includes(unit) ? { quantity: amount, unit } : { quantity: Math.max(1, Math.round(amount)), unit: 'pcs' };
}

function guessCategory(name: string): PantryItem['category'] {
  const n = normalizeName(name);
  const has = (...w: string[]) => w.some((x) => n.includes(x));
  if (has('milk', 'cheese', 'butter', 'egg', 'yogurt', 'cream', 'paneer', 'ghee')) return 'Dairy & Eggs';
  if (has('chicken', 'pork', 'beef', 'fish', 'lamb', 'shrimp', 'meat', 'sausage', 'bacon')) return 'Meat & Fish';
  if (has('rice', 'flour', 'lentil', 'dal', 'bean', 'noodle', 'pasta', 'bread', 'oat')) return 'Grains & Pulses';
  if (has('salt', 'pepper', 'turmeric', 'cumin', 'sauce', 'oil', 'sugar', 'masala', 'spice', 'powder', 'yeast')) return 'Spices & Sauces';
  if (has('tea', 'coffee', 'juice')) return 'Drinks';
  if (has('apple', 'banana', 'orange', 'lemon', 'lime', 'mango', 'fruit')) return 'Fruits';
  if (has('onion', 'tomato', 'potato', 'chili', 'garlic', 'ginger', 'carrot', 'cabbage', 'spinach', 'mushroom', 'leek', 'radish', 'cilantro', 'fern', 'bok choy', 'leaf')) return 'Vegetables';
  return 'Other';
}

export const useData = create<DataState>((set, get) => ({
  pantry: [],
  grocery: [],
  saved: [],
  log: [],
  prefs: DEFAULT_PREFS,
  loaded: false,

  startSync: (userId) => {
    const onErr = (e: Error) => toast(`Sync problem: ${e.message}`);
    const unsubs = [
      db.listenPantry(userId, (pantry) => set({ pantry, loaded: true }), onErr),
      db.listenGrocery(userId, (grocery) => set({ grocery }), onErr),
      db.listenSaved(userId, (saved) => set({ saved }), onErr),
      db.listenLog(userId, (log) => set({ log }), onErr),
      db.listenPrefs(userId, (cloud) => {
        if (cloud) {
          const prefs = { ...get().prefs, ...cloud };
          set({ prefs });
          AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
        }
      }, onErr),
    ];
    return () => unsubs.forEach((u) => u());
  },

  loadLocalPrefs: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw) set({ prefs: { ...DEFAULT_PREFS, ...JSON.parse(raw) } });
    } catch { /* ignore */ }
  },

  reset: () => set({ pantry: [], grocery: [], saved: [], log: [], loaded: false }),

  // Pantry ----------------------------------------------------------------------------------------
  addPantryItem: (input) => {
    const u = uid();
    if (!u) return;
    const name = titleCase(input.name.trim());
    const norm = normalizeName(name);
    const existing = get().pantry.find((p) => normalizeName(p.name) === norm && p.unit === input.unit);
    if (existing) {
      // Same ingredient already in the pantry: top it up instead of creating a duplicate.
      const merged: PantryItem = {
        ...existing,
        quantity: existing.quantity + input.quantity,
        expiryDate: input.expiryDate ?? existing.expiryDate,
        lowStockAt: input.lowStockAt,
      };
      write(db.savePantryItem(u, merged));
      toast(`Added to your existing ${existing.name}`);
      return;
    }
    const item: PantryItem = { ...input, name, id: db.newId(), createdAt: Date.now() };
    write(db.savePantryItem(u, item));
  },

  updatePantryItem: (item) => {
    const u = uid();
    if (u) write(db.savePantryItem(u, { ...item, name: titleCase(item.name.trim()) }));
  },

  deletePantryItem: (id) => {
    const u = uid();
    if (u) write(db.removePantryItem(u, id));
  },

  // Grocery ---------------------------------------------------------------------------------------
  addToGrocery: (items, source, recipeTitle) => {
    const u = uid();
    if (!u) return 0;
    let added = 0;
    const current = [...get().grocery];
    for (const it of items) {
      const dup = current.some((g) => ingredientMatches(g.name, it.name) && normalizeName(g.name) === normalizeName(it.name));
      if (dup) continue;
      const entry: GroceryItem = {
        id: db.newId(), name: titleCase(it.name.trim()), quantity: it.quantity ?? '', source, recipeTitle, createdAt: Date.now() + added,
      };
      current.push(entry);
      write(db.saveGroceryItem(u, entry));
      added += 1;
    }
    return added;
  },

  removeGroceryItem: (id) => {
    const u = uid();
    if (u) write(db.removeGroceryItem(u, id));
  },

  /** Ticking an item off buys it: it leaves the list and goes into the pantry. */
  tickGroceryItem: (item) => {
    const u = uid();
    if (!u) return;
    const { quantity, unit } = parseQuantityText(item.quantity);
    get().addPantryItem({
      name: item.name, category: guessCategory(item.name), quantity, unit, lowStockAt: 0, expiryDate: null,
    });
    write(db.removeGroceryItem(u, item.id));
    toast(`${item.name} moved to your pantry`, {
      label: 'Undo',
      onPress: () => {
        // undo: put it back on the list and take it out of the pantry again
        const pantryItem = get().pantry.find((p) => normalizeName(p.name) === normalizeName(item.name));
        if (pantryItem) {
          if (pantryItem.quantity > quantity) get().updatePantryItem({ ...pantryItem, quantity: pantryItem.quantity - quantity });
          else get().deletePantryItem(pantryItem.id);
        }
        write(db.saveGroceryItem(u, item));
      },
    });
  },

  clearGrocery: () => {
    const u = uid();
    if (u) get().grocery.forEach((g) => write(db.removeGroceryItem(u, g.id)));
  },

  // Recipes ---------------------------------------------------------------------------------------
  isSaved: (id) => get().saved.some((r) => r.id === id),

  toggleSaved: (recipe) => {
    const u = uid();
    if (!u) return;
    if (get().isSaved(recipe.id)) {
      write(db.unsaveRecipe(u, recipe.id));
      toast('Removed from saved');
    } else {
      write(db.saveRecipe(u, recipe));
      toast('Recipe saved');
    }
  },

  // Tracker ---------------------------------------------------------------------------------------
  logCooked: (recipe, servings, perServing) => {
    const u = uid();
    if (!u) return;
    const entry: LogEntry = {
      id: db.newId(),
      date: todayISO(),
      recipeId: recipe.id,
      title: recipe.title,
      servings,
      kcal: Math.round(perServing.kcal * servings),
      protein: Math.round(perServing.protein * servings * 10) / 10,
      carbs: Math.round(perServing.carbs * servings * 10) / 10,
      fat: Math.round(perServing.fat * servings * 10) / 10,
      createdAt: Date.now(),
    };
    write(db.saveLogEntry(u, entry));
    toast(`Logged ${entry.kcal} kcal for today`);
  },

  deleteLogEntry: (id) => {
    const u = uid();
    if (u) write(db.removeLogEntry(u, id));
  },

  // Settings --------------------------------------------------------------------------------------
  setPrefs: (patch) => {
    const prefs = { ...get().prefs, ...patch };
    set({ prefs });
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
    const u = uid();
    if (u) write(db.savePrefs(u, prefs));
  },
}));
