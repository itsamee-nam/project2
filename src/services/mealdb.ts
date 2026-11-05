import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealType, Recipe } from '../types';
import { MEALDB_BASE } from '../lib/config';

/** Raw TheMealDB meal object. */
type RawMeal = Record<string, string | null | undefined>;

const TTL_MS = 24 * 60 * 60 * 1000; // cache API answers for a day (free tier is rate limited)

interface CacheEntry<T> {
  t: number;
  v: T;
}

async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = TTL_MS): Promise<T> {
  const k = `mealdb:${key}`;
  let stale: CacheEntry<T> | null = null;
  try {
    const raw = await AsyncStorage.getItem(k);
    if (raw) {
      const e = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() - e.t < ttl) return e.v;
      stale = e;
    }
  } catch {
    /* ignore cache read errors */
  }
  try {
    const v = await fetcher();
    AsyncStorage.setItem(k, JSON.stringify({ t: Date.now(), v } satisfies CacheEntry<T>)).catch(() => {});
    return v;
  } catch (err) {
    if (stale) return stale.v; // offline: an old answer beats no answer
    throw err;
  }
}

async function getJson(path: string): Promise<{ meals: RawMeal[] | null }> {
  const res = await fetch(`${MEALDB_BASE}/${path}`);
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  const text = await res.text();
  if (!text) return { meals: null }; // the free key returns an empty body for some misses
  return JSON.parse(text);
}

/** Map TheMealDB categories to the four meal types used in the app. */
const CATEGORY_MEAL_TYPES: Record<string, MealType[]> = {
  Breakfast: ['Breakfast'],
  Dessert: ['Snacks'],
  Starter: ['Snacks'],
  Side: ['Snacks', 'Lunch'],
  Beef: ['Lunch', 'Dinner'],
  Chicken: ['Lunch', 'Dinner'],
  Lamb: ['Dinner'],
  Goat: ['Dinner'],
  Pork: ['Lunch', 'Dinner'],
  Pasta: ['Lunch', 'Dinner'],
  Seafood: ['Lunch', 'Dinner'],
  Vegetarian: ['Lunch', 'Dinner'],
  Vegan: ['Lunch', 'Dinner'],
  Miscellaneous: ['Lunch', 'Dinner'],
};

export function mealTypesForCategory(category: string): MealType[] {
  return CATEGORY_MEAL_TYPES[category] ?? ['Lunch', 'Dinner'];
}

function stepsFrom(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(step\s*)?\d+[.)]?\s*/i, '').trim())
    .filter((l) => l.length > 2);
  return lines.length > 1 ? lines : text.split(/(?<=\.)\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
}

export function toRecipe(m: RawMeal): Recipe {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (m[`strIngredient${i}`] ?? '').trim();
    if (!name) continue;
    ingredients.push({ name, measure: (m[`strMeasure${i}`] ?? '').trim() });
  }
  const category = m.strCategory ?? 'Miscellaneous';
  return {
    id: String(m.idMeal),
    title: m.strMeal ?? 'Untitled',
    category,
    area: m.strArea ?? '',
    thumb: m.strMealThumb ?? undefined,
    instructions: stepsFrom(m.strInstructions ?? ''),
    ingredients,
    servings: 4, // TheMealDB does not provide servings; most recipes serve about four
    mealTypes: mealTypesForCategory(category),
    source: 'themealdb',
    youtube: m.strYoutube || undefined,
  };
}

/** Light summaries (id, title, thumb) of meals that use an ingredient. */
export function filterByIngredient(ingredient: string): Promise<{ id: string; title: string }[]> {
  const q = encodeURIComponent(ingredient.trim().toLowerCase().replace(/\s+/g, '_'));
  return cached(`filter:${q}`, async () => {
    const { meals } = await getJson(`filter.php?i=${q}`);
    return (meals ?? []).map((m) => ({ id: String(m.idMeal), title: m.strMeal ?? '' }));
  });
}

export function lookupMeal(id: string): Promise<Recipe | null> {
  return cached(`lookup:${id}`, async () => {
    const { meals } = await getJson(`lookup.php?i=${encodeURIComponent(id)}`);
    return meals && meals[0] ? toRecipe(meals[0]) : null;
  }, 7 * TTL_MS);
}

export function searchByName(query: string): Promise<Recipe[]> {
  const q = encodeURIComponent(query.trim());
  return cached(`search:${q}`, async () => {
    const { meals } = await getJson(`search.php?s=${q}`);
    return (meals ?? []).map(toRecipe);
  });
}
