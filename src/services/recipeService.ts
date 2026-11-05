import type { Diet, MealType, PantryItem, Recipe, RecipeMatch } from '../types';
import bundled from '../data/bhutanese_recipes.json';
import { fitsDiets } from '../utils/diet';
import { matchRecipe, rankMatches } from '../utils/matching';
import { normalizeName } from '../utils/text';
import { filterByIngredient, lookupMeal, searchByName } from './mealdb';

export const LOCAL_RECIPES = bundled as unknown as Recipe[];

/** In-memory index so the detail screen can open any recipe the list has shown. */
const memory = new Map<string, Recipe>();
LOCAL_RECIPES.forEach((r) => memory.set(r.id, r));

export function remember(recipe: Recipe) {
  memory.set(recipe.id, recipe);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const hit = memory.get(id);
  if (hit) return hit;
  try {
    const r = await lookupMeal(id);
    if (r) remember(r);
    return r;
  } catch {
    return null;
  }
}

export interface SearchParams {
  pantry: PantryItem[];
  maxMissing: 0 | 1 | 2;
  avoid: Diet[];
  mealType: MealType | null;
  assumeStaples: boolean;
}

export interface SearchResult {
  matches: RecipeMatch[];
  /** True if TheMealDB could not be reached (only bundled/cached recipes are shown). */
  offline: boolean;
}

/** Limits that keep us inside TheMealDB's free tier. */
const MAX_INGREDIENT_QUERIES = 6;
const MAX_DETAIL_LOOKUPS = 24;

function applyFilters(recipes: Recipe[], p: SearchParams): RecipeMatch[] {
  const names = p.pantry.map((i) => i.name);
  return rankMatches(
    recipes
      .filter((r) => (p.mealType ? r.mealTypes.includes(p.mealType) : true))
      .filter((r) => fitsDiets(r, p.avoid))
      .map((r) => matchRecipe(r, names, { assumeStaples: p.assumeStaples }))
      .filter((m) => m.missing.length <= p.maxMissing),
  );
}

/** Instant, offline results from the bundled Bhutanese recipes. */
export function searchLocal(p: SearchParams): RecipeMatch[] {
  return applyFilters(LOCAL_RECIPES, p);
}

/** Full search: bundled recipes + TheMealDB candidates for the user's ingredients. */
export async function searchAll(p: SearchParams): Promise<SearchResult> {
  const pantryNames = Array.from(new Set(p.pantry.map((i) => normalizeName(i.name)).filter(Boolean)));
  if (!pantryNames.length) return { matches: searchLocal(p), offline: false };

  let offline = false;
  // Query the ingredients most likely to be main ingredients first (longest names are usually more specific).
  const queries = pantryNames.slice(0, MAX_INGREDIENT_QUERIES);
  const lists = await Promise.all(
    queries.map((q) =>
      filterByIngredient(q).catch(() => {
        offline = true;
        return [] as { id: string; title: string }[];
      }),
    ),
  );

  // A candidate that uses several of the user's ingredients is a better bet.
  const score = new Map<string, number>();
  lists.flat().forEach((m) => score.set(m.id, (score.get(m.id) ?? 0) + 1));
  const ids = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_DETAIL_LOOKUPS).map(([id]) => id);

  const details = await Promise.all(
    ids.map((id) => (memory.has(id) ? Promise.resolve(memory.get(id)!) : lookupMeal(id).catch(() => null))),
  );
  const remote = details.filter((r): r is Recipe => !!r);
  remote.forEach(remember);

  const merged = new Map<string, Recipe>();
  [...LOCAL_RECIPES, ...remote].forEach((r) => merged.set(r.id, r));
  return { matches: applyFilters([...merged.values()], p), offline };
}

/** Free-text recipe search by name (used by the search box). */
export async function searchByTitle(query: string, p: SearchParams): Promise<SearchResult> {
  const q = query.trim().toLowerCase();
  if (!q) return searchAll(p);
  const local = LOCAL_RECIPES.filter((r) => r.title.toLowerCase().includes(q));
  let remote: Recipe[] = [];
  let offline = false;
  try {
    remote = await searchByName(q);
    remote.forEach(remember);
  } catch {
    offline = true;
  }
  const names = p.pantry.map((i) => i.name);
  const all = [...local, ...remote]
    .filter((r) => (p.mealType ? r.mealTypes.includes(p.mealType) : true))
    .filter((r) => fitsDiets(r, p.avoid))
    .map((r) => matchRecipe(r, names, { assumeStaples: p.assumeStaples }));
  // typed searches are not restricted by "missing" count, only ranked by it
  return { matches: rankMatches(all), offline };
}
