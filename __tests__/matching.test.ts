import { LOCAL_RECIPES } from '../src/services/recipeService';
import type { Recipe } from '../src/types';
import { fitsDiets, violations } from '../src/utils/diet';
import { matchRecipe } from '../src/utils/matching';
import { estimateMacros } from '../src/utils/nutrition';
import { ingredientMatches, normalizeName } from '../src/utils/text';

const byTitle = (t: string) => LOCAL_RECIPES.find((r) => r.title === t) as Recipe;

describe('normalizeName', () => {
  it('unifies spelling and plurals', () => {
    expect(normalizeName('Chilli')).toBe('chili');
    expect(normalizeName('Chillies')).toBe('chili');
    expect(normalizeName('Tomatoes')).toBe('tomato');
    expect(normalizeName('Potatoes')).toBe('potato');
    expect(normalizeName('  Green   Chilies ')).toBe('green chili');
    expect(normalizeName('Eggs')).toBe('egg');
  });
});

describe('ingredientMatches', () => {
  it('matches across qualifiers', () => {
    expect(ingredientMatches('cheese', 'Cheddar Cheese')).toBe(true);
    expect(ingredientMatches('chicken breast', 'Chicken')).toBe(true);
    expect(ingredientMatches('chilli', 'Chili Peppers')).toBe(true);
    expect(ingredientMatches('Green Chilies', 'chili peppers')).toBe(true);
    // any cooking oil can stand in for "vegetable oil"
    expect(ingredientMatches('olive oil', 'Vegetable Oil')).toBe(true);
    expect(ingredientMatches('oil', 'Vegetable Oil')).toBe(true);
  });
  it('does not match unrelated items', () => {
    expect(ingredientMatches('onion', 'garlic')).toBe(false);
    expect(ingredientMatches('butter', 'peanut')).toBe(false);
  });
});

describe('matchRecipe', () => {
  it('counts missing ingredients and assumes water/salt', () => {
    const ema = byTitle('Ema Datshi');
    const m = matchRecipe(ema, ['chili', 'onion', 'tomato', 'garlic', 'cheese'], { assumeStaples: true });
    // only Vegetable Oil is missing (water and salt are staples)
    expect(m.missing).toEqual(['Vegetable Oil']);
    const strict = matchRecipe(ema, ['chili', 'onion', 'tomato', 'garlic', 'cheese'], { assumeStaples: false });
    expect(strict.missing.sort()).toEqual(['Salt', 'Vegetable Oil', 'Water'].sort());
  });
  it('reports 0% for an empty pantry (apart from staples)', () => {
    const m = matchRecipe(byTitle('Suja'), []);
    expect(m.owned.sort()).toEqual(['Salt', 'Water']);
  });
});

describe('diet filters', () => {
  it('flags dairy in datshi dishes', () => {
    expect(violations(byTitle('Ema Datshi'))).toContain('lactose');
    expect(fitsDiets(byTitle('Ema Datshi'), ['lactose'])).toBe(false);
  });
  it('treats buckwheat flour as gluten-free but wheat flour as not', () => {
    expect(violations(byTitle('Khuley'))).not.toContain('gluten');
    expect(violations(byTitle('Tingmo'))).toContain('gluten');
  });
  it('flags meat by category and ingredient', () => {
    expect(violations(byTitle('Phaksha Paa'))).toContain('meat');
    expect(violations(byTitle('Beef Momo'))).toContain('meat');
    expect(violations(byTitle('Bhutanese Dal'))).not.toContain('meat');
  });
  it('vegetarian dal is fine for all three filters', () => {
    expect(fitsDiets(byTitle('Bhutanese Dal'), ['lactose', 'gluten', 'meat'])).toBe(true);
  });
  it('coconut milk and peanut butter are not dairy', () => {
    const r = { ingredients: [{ name: 'Coconut Milk', measure: '1 cup' }, { name: 'Peanut Butter', measure: '2 tbsp' }], category: 'Misc' } as unknown as Recipe;
    expect(violations(r)).not.toContain('lactose');
  });
});

describe('estimateMacros', () => {
  it('gives plausible values for every bundled recipe', () => {
    for (const r of LOCAL_RECIPES) {
      const e = estimateMacros(r);
      expect(e.perServing.kcal).toBeGreaterThan(20);
      expect(e.perServing.kcal).toBeLessThan(1500);
      expect(e.coverage).toBeGreaterThan(0.5);
    }
  });
  it('puts a high-protein dish above a vegetable dish', () => {
    expect(estimateMacros(byTitle('Jasha Maru')).perServing.protein).toBeGreaterThan(estimateMacros(byTitle('Kewa Datshi')).perServing.protein);
  });
});

describe('bundled data', () => {
  it('has 15-20 Bhutanese recipes with unique ids', () => {
    expect(LOCAL_RECIPES.length).toBeGreaterThanOrEqual(15);
    expect(new Set(LOCAL_RECIPES.map((r) => r.id)).size).toBe(LOCAL_RECIPES.length);
    LOCAL_RECIPES.forEach((r) => {
      expect(r.ingredients.length).toBeGreaterThan(2);
      expect(r.instructions.length).toBeGreaterThan(2);
      expect(r.mealTypes.length).toBeGreaterThan(0);
    });
  });
});
