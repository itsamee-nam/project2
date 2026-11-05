import type { Recipe, RecipeMatch } from '../types';
import { ingredientMatches, normalizeName } from './text';

export const STAPLES = ['water', 'salt'];

export interface MatchOptions {
  assumeStaples: boolean;
}

/** Compare one recipe with the pantry. */
export function matchRecipe(recipe: Recipe, pantryNames: string[], opts: MatchOptions = { assumeStaples: true }): RecipeMatch {
  const owned: string[] = [];
  const missing: string[] = [];
  for (const ing of recipe.ingredients) {
    const n = normalizeName(ing.name);
    const isStaple = opts.assumeStaples && STAPLES.includes(n);
    const has = isStaple || pantryNames.some((p) => ingredientMatches(p, ing.name));
    (has ? owned : missing).push(ing.name);
  }
  const total = recipe.ingredients.length;
  return { recipe, owned, missing, matchPct: total ? Math.round((owned.length / total) * 100) : 0 };
}

/** Sort best first: fewest missing, then highest match, then title. */
export function rankMatches(list: RecipeMatch[]): RecipeMatch[] {
  return [...list].sort(
    (a, b) => a.missing.length - b.missing.length || b.matchPct - a.matchPct || a.recipe.title.localeCompare(b.recipe.title),
  );
}
