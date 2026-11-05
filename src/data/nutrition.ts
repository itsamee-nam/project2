import type { GramHints } from '../utils/measure';

/** [kcal, protein g, carbs g, fat g] per 100 g, plus optional gram hints. Approximate values (USDA-style). */
export interface NutritionEntry extends GramHints {
  per100: [number, number, number, number];
}

/**
 * Keys are matched as substrings of the normalised ingredient name; the longest key wins.
 * TheMealDB has no nutrition endpoint, so macros are ESTIMATED from this table.
 */
export const NUTRITION: Record<string, NutritionEntry> = {
  'chili powder': { per100: [282, 13, 50, 14], tbspG: 8 },
  'dried red chili': { per100: [282, 12, 50, 14], pieceG: 2 },
  chili: { per100: [40, 2, 9, 0.4], pieceG: 8 },
  'bell pepper': { per100: [31, 1, 6, 0.3], pieceG: 120 },
  onion: { per100: [40, 1.1, 9.3, 0.1], pieceG: 110, cupG: 160 },
  'spring onion': { per100: [32, 1.8, 7.3, 0.2], pieceG: 15, cupG: 100 },
  tomato: { per100: [18, 0.9, 3.9, 0.2], pieceG: 120, cupG: 180 },
  garlic: { per100: [149, 6.4, 33, 0.5], pieceG: 40, tbspG: 9 },
  ginger: { per100: [80, 1.8, 18, 0.8], tbspG: 6 },
  potato: { per100: [77, 2, 17, 0.1], pieceG: 150, cupG: 150 },
  carrot: { per100: [41, 0.9, 10, 0.2], pieceG: 60, cupG: 128 },
  cabbage: { per100: [25, 1.3, 5.8, 0.1], pieceG: 600, cupG: 70 },
  spinach: { per100: [23, 2.9, 3.6, 0.4], cupG: 30 },
  'bok choy': { per100: [13, 1.5, 2.2, 0.2], cupG: 70 },
  'turnip leaf': { per100: [32, 1.5, 7, 0.3], cupG: 55 },
  daikon: { per100: [18, 0.6, 4.1, 0.1], cupG: 120 },
  radish: { per100: [16, 0.7, 3.4, 0.1], cupG: 116 },
  leek: { per100: [61, 1.5, 14, 0.3], pieceG: 90 },
  cilantro: { per100: [23, 2.1, 3.7, 0.5], cupG: 16 },
  mushroom: { per100: [22, 3.1, 3.3, 0.3], cupG: 70 },
  'mixed vegetable': { per100: [65, 3, 12, 0.5], cupG: 150 },
  cucumber: { per100: [15, 0.7, 3.6, 0.1], pieceG: 200 },
  pumpkin: { per100: [26, 1, 6.5, 0.1], cupG: 116 },
  eggplant: { per100: [25, 1, 6, 0.2], pieceG: 250 },
  cauliflower: { per100: [25, 1.9, 5, 0.3], cupG: 100 },
  broccoli: { per100: [34, 2.8, 7, 0.4], cupG: 90 },
  'green bean': { per100: [31, 1.8, 7, 0.1], cupG: 100 },
  pea: { per100: [81, 5, 14, 0.4], cupG: 145 },
  fern: { per100: [34, 4.5, 5.5, 0.4], cupG: 90 },
  banana: { per100: [89, 1.1, 23, 0.3], pieceG: 120 },
  apple: { per100: [52, 0.3, 14, 0.2], pieceG: 180 },
  lemon: { per100: [29, 1.1, 9, 0.3], pieceG: 60 },
  lime: { per100: [30, 0.7, 11, 0.2], pieceG: 45 },
  cheese: { per100: [350, 22, 2, 28], cupG: 110 },
  paneer: { per100: [321, 21, 3.6, 25], cupG: 150 },
  butter: { per100: [717, 0.9, 0.1, 81], tbspG: 14, cupG: 227 },
  ghee: { per100: [900, 0, 0, 100], tbspG: 13 },
  milk: { per100: [61, 3.2, 4.8, 3.3], cupG: 245 },
  yogurt: { per100: [61, 3.5, 4.7, 3.3], cupG: 245 },
  cream: { per100: [340, 2, 3, 36], cupG: 240 },
  egg: { per100: [143, 12.6, 0.7, 9.5], pieceG: 50 },
  oil: { per100: [884, 0, 0, 100], tbspG: 14, cupG: 216 },
  'pork belly': { per100: [518, 9, 0, 53], cupG: 150 },
  pork: { per100: [242, 27, 0, 14], cupG: 140 },
  chicken: { per100: [165, 31, 0, 3.6], cupG: 140 },
  beef: { per100: [250, 26, 0, 15], cupG: 140 },
  lamb: { per100: [258, 25, 0, 17], cupG: 140 },
  fish: { per100: [206, 22, 0, 12], cupG: 140 },
  shrimp: { per100: [99, 24, 0.2, 0.3], cupG: 145 },
  'chicken stock': { per100: [5, 0.5, 0.4, 0.2], cupG: 240, tbspG: 15 },
  stock: { per100: [5, 0.5, 0.4, 0.2], cupG: 240 },
  broth: { per100: [5, 0.5, 0.4, 0.2], cupG: 240 },
  'ground meat': { per100: [250, 26, 0, 15], cupG: 225 },
  'cooked rice': { per100: [130, 2.7, 28, 0.3], cupG: 160 },
  rice: { per100: [365, 7, 80, 0.7], cupG: 185 },
  'buckwheat flour': { per100: [335, 13, 71, 3.4], cupG: 120 },
  flour: { per100: [364, 10, 76, 1], cupG: 125, tbspG: 8 },
  noodle: { per100: [138, 4.5, 25, 2], cupG: 160 },
  pasta: { per100: [371, 13, 75, 1.5], cupG: 100 },
  bread: { per100: [265, 9, 49, 3.2], pieceG: 30 },
  lentil: { per100: [353, 25, 60, 1], cupG: 192 },
  dal: { per100: [353, 25, 60, 1], cupG: 192 },
  bean: { per100: [333, 23, 60, 1.2], cupG: 180 },
  tofu: { per100: [76, 8, 1.9, 4.8], cupG: 250 },
  sugar: { per100: [387, 0, 100, 0], tbspG: 12.5, cupG: 200 },
  honey: { per100: [304, 0.3, 82, 0], tbspG: 21 },
  yeast: { per100: [325, 40, 41, 7], tbspG: 9 },
  'baking powder': { per100: [53, 0, 28, 0], tbspG: 12 },
  turmeric: { per100: [312, 10, 67, 3], tbspG: 9 },
  cumin: { per100: [375, 18, 44, 22], tbspG: 6 },
  pepper: { per100: [251, 10, 64, 3.3], tbspG: 7 },
  'soy sauce': { per100: [53, 8, 5, 0.6], tbspG: 16 },
  'sesame oil': { per100: [884, 0, 0, 100], tbspG: 14 },
  'tomato sauce': { per100: [24, 1.2, 5.3, 0.3], cupG: 245 },
  'coconut milk': { per100: [230, 2.3, 6, 24], cupG: 240 },
  tea: { per100: [1, 0, 0.3, 0], tbspG: 2 },
  salt: { per100: [0, 0, 0, 0], tbspG: 18 },
  water: { per100: [0, 0, 0, 0], cupG: 240 },
};

const KEYS = Object.keys(NUTRITION).sort((a, b) => b.length - a.length);

/** Find the best nutrition entry for a normalised ingredient name. */
export function lookupNutrition(normalizedName: string): NutritionEntry | null {
  const padded = ` ${normalizedName} `;
  for (const k of KEYS) {
    if (padded.includes(` ${k} `) || normalizedName.includes(k)) return NUTRITION[k];
  }
  return null;
}
