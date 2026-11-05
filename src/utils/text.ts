/**
 * Ingredient-name normalisation and matching.
 * Risk from the proposal: "chilli" vs "chili", "tomatoes" vs "tomato" etc.
 */

const ALIASES: Record<string, string> = {
  chilli: 'chili',
  chillies: 'chili',
  chilies: 'chili',
  chile: 'chili',
  chiles: 'chili',
  chilis: 'chili',
  capsicum: 'bell pepper',
  coriander: 'cilantro',
  aubergine: 'eggplant',
  courgette: 'zucchini',
  scallion: 'spring onion',
  scallions: 'spring onion',
  'green onion': 'spring onion',
  'green onions': 'spring onion',
  yoghurt: 'yogurt',
  prawns: 'shrimp',
  prawn: 'shrimp',
  mince: 'ground meat',
  'cooking oil': 'oil',
  'vegetable oil': 'oil',
  'sunflower oil': 'oil',
  'mustard oil': 'oil',
  'tea leaves': 'tea',
  'tea leaf': 'tea',
};

/** Words that carry no identity ("fresh", "chopped", …). */
const NOISE = new Set([
  'fresh', 'dried', 'chopped', 'sliced', 'minced', 'grated', 'ground', 'large', 'small', 'medium',
  'whole', 'raw', 'cooked', 'peeled', 'diced', 'finely', 'roughly', 'ripe', 'frozen', 'organic',
  'red', 'green', 'yellow', 'white', 'black', 'of', 'the', 'a', 'and', 'or', 'to', 'taste',
]);

/** Words where a trailing "s" is not a plural. */
const KEEP_S = new Set(['asparagus', 'hummus', 'couscous', 'molasses', 'lemongrass', 'swiss', 'cress', 'watercress']);

export function singular(word: string): string {
  if (word.length <= 3 || KEEP_S.has(word)) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (/(oes|ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('ss') || word.endsWith('us')) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** lowercase, no punctuation, aliases applied, singular. Keeps colour words ("red onion"). */
export function normalizeName(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  // phrase-level aliases first, then word-level
  for (const [from, to] of Object.entries(ALIASES)) {
    if (from.includes(' ') && s.includes(from)) s = s.replace(from, to);
  }
  s = s
    .split(' ')
    .map((w) => {
      const sg = singular(w);
      return ALIASES[w] ?? ALIASES[sg] ?? sg;
    })
    .join(' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** Identity tokens: normalised words minus noise (colour/prep words). */
export function coreTokens(raw: string): string[] {
  const n = normalizeName(raw);
  const toks = n.split(' ').filter((t) => t && !NOISE.has(t));
  // if everything was noise (e.g. "red"), fall back to the raw words
  return toks.length ? toks : n.split(' ').filter(Boolean);
}

/**
 * Does a pantry item satisfy a recipe ingredient?
 * True when all tokens of the shorter name appear in the longer one:
 *   pantry "cheese"  <-> recipe "cheddar cheese"   yes
 *   pantry "chicken breast" <-> recipe "chicken"   yes
 *   pantry "oil" <-> recipe "vegetable oil"        yes (alias -> oil)
 */
export function ingredientMatches(pantryName: string, recipeIngredient: string): boolean {
  const a = coreTokens(pantryName);
  const b = coreTokens(recipeIngredient);
  if (!a.length || !b.length) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.every((t) => long.includes(t));
}

export function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
