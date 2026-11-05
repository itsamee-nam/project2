export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

/** The user can say "I avoid …". A recipe is hidden if it contains the thing avoided. */
export type Diet = 'lactose' | 'gluten' | 'meat';
export const DIET_LABELS: Record<Diet, string> = {
  lactose: 'Lactose-free',
  gluten: 'Gluten-free',
  meat: 'Vegetarian (no meat)',
};

export interface RecipeIngredient {
  name: string;
  measure: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  area: string;
  /** Remote image URL (TheMealDB). Local recipes use `emoji` instead. */
  thumb?: string;
  emoji?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  servings: number;
  mealTypes: MealType[];
  source: 'local' | 'themealdb';
  youtube?: string;
}

export interface RecipeMatch {
  recipe: Recipe;
  owned: string[];
  missing: string[];
  /** 0-100 */
  matchPct: number;
}

export const PANTRY_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Meat & Fish',
  'Grains & Pulses',
  'Spices & Sauces',
  'Drinks',
  'Other',
] as const;
export type PantryCategory = (typeof PANTRY_CATEGORIES)[number];

export const UNITS = ['pcs', 'g', 'kg', 'ml', 'L', 'cups', 'tbsp', 'tsp', 'packs'] as const;
export type Unit = (typeof UNITS)[number];

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  quantity: number;
  unit: Unit;
  /** Remind me when quantity drops to this number or below. 0 = never. */
  lowStockAt: number;
  /** ISO date (YYYY-MM-DD) or null */
  expiryDate: string | null;
  createdAt: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  /** Free text, e.g. "200g" */
  quantity: string;
  source: 'recipe' | 'low-stock' | 'manual';
  recipeTitle?: string;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  /** ISO date YYYY-MM-DD (local) */
  date: string;
  recipeId: string;
  title: string;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Prefs {
  theme: ThemeMode;
  expiryNotify: boolean;
  /** Remind this many days before the expiry date */
  daysBefore: number;
  lowStockNotify: boolean;
  calorieGoal: number;
  /** Treat water and salt as always available */
  assumeStaples: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  expiryNotify: true,
  daysBefore: 2,
  lowStockNotify: true,
  calorieGoal: 2000,
  assumeStaples: true,
};

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}
