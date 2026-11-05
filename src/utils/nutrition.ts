import { lookupNutrition } from '../data/nutrition';
import type { Macros, Recipe } from '../types';
import { measureToGrams } from './measure';
import { normalizeName } from './text';

export interface MacroEstimate {
  perServing: Macros;
  total: Macros;
  /** Fraction (0-1) of ingredients that could be measured and looked up. */
  coverage: number;
}

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/**
 * Estimates macros for a whole recipe from ingredient names + measures.
 * `portions` is how many servings the recipe makes at the *current* scale; the per-serving
 * result is independent of scaling (everything scales together).
 */
export function estimateMacros(recipe: Recipe): MacroEstimate {
  const total = { ...ZERO };
  let known = 0;
  for (const ing of recipe.ingredients) {
    const entry = lookupNutrition(normalizeName(ing.name));
    if (!entry) continue;
    const grams = measureToGrams(ing.measure, entry);
    if (grams === null) continue;
    known += 1;
    const f = grams / 100;
    total.kcal += entry.per100[0] * f;
    total.protein += entry.per100[1] * f;
    total.carbs += entry.per100[2] * f;
    total.fat += entry.per100[3] * f;
  }
  const s = Math.max(1, recipe.servings);
  return {
    total: { kcal: round(total.kcal), protein: round(total.protein, 1), carbs: round(total.carbs, 1), fat: round(total.fat, 1) },
    perServing: {
      kcal: round(total.kcal / s),
      protein: round(total.protein / s, 1),
      carbs: round(total.carbs / s, 1),
      fat: round(total.fat / s, 1),
    },
    coverage: recipe.ingredients.length ? known / recipe.ingredients.length : 0,
  };
}

export function sumMacros(list: Macros[]): Macros {
  const t = { ...ZERO };
  for (const m of list) {
    t.kcal += m.kcal;
    t.protein += m.protein;
    t.carbs += m.carbs;
    t.fat += m.fat;
  }
  return { kcal: round(t.kcal), protein: round(t.protein, 1), carbs: round(t.carbs, 1), fat: round(t.fat, 1) };
}
