import type { Diet, Recipe } from '../types';
import { normalizeName } from './text';

const DAIRY = [
  'milk', 'cheese', 'butter', 'cream', 'yogurt', 'curd', 'ghee', 'paneer', 'whey', 'cheddar', 'mozzarella',
  'parmesan', 'feta', 'ricotta', 'mascarpone', 'custard', 'ice cream', 'buttermilk', 'datshi', 'condensed milk',
];
const GLUTEN = [
  'flour', 'bread', 'pasta', 'noodle', 'spaghetti', 'macaroni', 'wheat', 'barley', 'rye', 'semolina', 'couscous',
  'breadcrumb', 'bun', 'tortilla', 'pita', 'naan', 'soy sauce', 'biscuit', 'cracker', 'lasagne', 'lasagna',
  'pastry', 'dough', 'cake', 'oat', 'beer', 'puff', 'filo', 'phyllo', 'wrap', 'dumpling wrapper', 'bulgur',
];
const MEAT = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat', 'bacon', 'ham', 'sausage', 'salami', 'turkey', 'duck',
  'veal', 'venison', 'yak', 'fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'prawn', 'shrimp', 'crab',
  'lobster', 'squid', 'mussel', 'oyster', 'clam', 'gelatin', 'gelatine', 'lard', 'suet', 'chorizo', 'mince',
  'ground meat', 'meat', 'steak', 'ribs', 'liver', 'tripe', 'stock cube', 'chicken stock', 'beef stock', 'fish sauce',
];
const MEAT_CATEGORIES = new Set(['Beef', 'Chicken', 'Lamb', 'Pork', 'Goat', 'Seafood']);

/** Words that look like gluten/dairy but are not. */
const SAFE_OVERRIDES: Record<Diet, string[]> = {
  gluten: ['buckwheat flour', 'buckwheat', 'rice flour', 'corn flour', 'cornflour', 'gram flour', 'chickpea flour', 'almond flour', 'coconut flour', 'rice noodle', 'glass noodle'],
  lactose: ['coconut milk', 'almond milk', 'soy milk', 'oat milk', 'cocoa butter', 'peanut butter', 'butternut', 'butter bean', 'coconut cream', 'cream of tartar'],
  meat: ['peanut butter', 'egg', 'fish sauce vegetarian'],
};

function hasWord(name: string, list: string[]): boolean {
  const padded = ` ${name} `;
  return list.some((k) => padded.includes(` ${k} `) || padded.includes(` ${k}s `) || (k.length > 4 && name.includes(k)));
}

function ingredientHas(diet: Diet, rawName: string): boolean {
  const n = normalizeName(rawName);
  // longest phrases first so "buckwheat flour" is removed whole, not just "buckwheat"
  const safe = [...SAFE_OVERRIDES[diet]].sort((a, b) => b.length - a.length);
  // remove safe phrases so "buckwheat flour" does not trigger "flour"
  let cleaned = n;
  for (const s of safe) cleaned = cleaned.replace(s, ' ');
  const list = diet === 'lactose' ? DAIRY : diet === 'gluten' ? GLUTEN : MEAT;
  return hasWord(cleaned, list);
}

/** Which of the user's avoided diets does this recipe violate? */
export function violations(recipe: Recipe): Diet[] {
  const out: Diet[] = [];
  const names = recipe.ingredients.map((i) => i.name);
  if (names.some((n) => ingredientHas('lactose', n))) out.push('lactose');
  if (names.some((n) => ingredientHas('gluten', n))) out.push('gluten');
  if (MEAT_CATEGORIES.has(recipe.category) || names.some((n) => ingredientHas('meat', n))) out.push('meat');
  return out;
}

/** True when the recipe contains none of the things the user avoids. */
export function fitsDiets(recipe: Recipe, avoid: Diet[]): boolean {
  if (!avoid.length) return true;
  const v = violations(recipe);
  return !avoid.some((d) => v.includes(d));
}
