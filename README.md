# DormChef (React Native)

Cross-platform (Android + iOS) rebuild of DormChef for CTE308 Project II.
Track your pantry, get recipe ideas from what you already have, reduce food waste.

**Stack:** React Native + Expo (managed workflow) · TypeScript · Expo Router · Zustand ·
Firebase Auth + Cloud Firestore · TheMealDB · expo-notifications · react-native-paper

---

## 1. Run it (5 minutes)

```bash
npm install --legacy-peer-deps
cp .env.example .env        # then fill in your Firebase keys (step 2)
npx expo start -c
```

Scan the QR code with **Expo Go** (Android or iOS). No Mac is needed for iOS testing.
Press `a` / `i` to open an Android emulator / iOS simulator instead.

> `--legacy-peer-deps` is needed because `react-native-paper` and `react-dom` declare
> slightly different React peer ranges. It is safe here.

## 2. Firebase setup

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Sign-in method** → enable **Email/Password** (and **Google** if you want it).
3. **Build → Firestore Database → Create database** (production mode, any region).
4. **Firestore → Rules** → paste the contents of `firestore.rules` → Publish.
5. **Project settings → Your apps → Add app → Web (`</>`)**. Copy the config values into `.env`:
   `EXPO_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`,
   `..._MESSAGING_SENDER_ID`, `..._APP_ID`.
6. Restart with `npx expo start -c` (the cache flag matters, env vars are read at bundle time).

Until `.env` is filled in, the app shows a "Connect Firebase" screen instead of crashing.

**Google sign-in (optional):** create OAuth client IDs in Google Cloud Console and set the
`EXPO_PUBLIC_GOOGLE_*` values. The button only appears when `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set.
Google sign-in does **not** work inside Expo Go; it needs a development build
(`npx expo run:android` / `eas build --profile development`). Email sign-up works everywhere.

## 3. How the proposal maps to the code

| Proposal objective / feature | Where |
|---|---|
| Same app on Android + iOS | whole project (Expo); Android and iOS bundles verified with `expo export` |
| Login + cloud sync (email, Google) | `src/store/auth.ts`, `src/app/(auth)/*`, `src/services/db.ts`, `src/hooks/useCloudSync.ts` |
| Pantry add/edit/delete, quantity, expiry, "expiring soon" | `src/app/(tabs)/pantry.tsx`, `src/components/PantryFormModal.tsx`, `PantryRow.tsx` |
| Recipe filtering: ingredients (0-2 missing), diet, meal type | `src/app/(tabs)/recipes.tsx`, `src/services/recipeService.ts`, `src/utils/{matching,diet}.ts` |
| TheMealDB + caching + call limits | `src/services/mealdb.ts` (24 h AsyncStorage cache, max 6 ingredient queries and 24 lookups per search) |
| 16 Bhutanese seed recipes | `src/data/bhutanese_recipes.json` (the 8 from Project I plus 8 new) |
| Ingredient name normalisation ("chilli"/"chili") + autocomplete | `src/utils/text.ts`, `src/data/ingredients.ts` |
| Recipe detail, save, "I cooked this" | `src/app/recipe/[id].tsx` |
| Serving size adjustment | `src/utils/measure.ts` (fractions, ranges, mixed numbers) |
| Expiry + low-stock local notifications | `src/services/notifications.ts` (pure `planReminders`, unit-tested) |
| Auto grocery list, tick moves item to pantry | `src/app/(tabs)/grocery.tsx`, `src/store/data.ts` |
| Macro tracker (optional) | `src/app/(tabs)/tracker.tsx`, `src/utils/nutrition.ts`, `src/data/nutrition.ts` |
| Dark mode, notification prefs, logout | `src/app/settings.tsx` |
| Barcode scan (optional) | `src/components/BarcodeScanner.tsx` (Open Food Facts lookup) |

## 4. Things to know

- **Macros are estimates.** TheMealDB has no nutrition data, so calories/protein/carbs/fat are computed
  from ingredient amounts using a built-in table (`src/data/nutrition.ts`). The UI says so.
- **Diet filters are keyword-based** (e.g. "cheese" = lactose, "flour" = gluten but "buckwheat flour" is not).
  They are a helpful filter, not an allergy guarantee.
- **Bundled recipes** live in the app (works offline) instead of a Firestore collection.
  `firestore.rules` already allows a shared `recipes` collection if you later want user-submitted recipes.
- **Notifications:** one reminder per expiring item (N days before, 09:00) plus one grouped low-stock reminder.
  They are re-planned automatically whenever the pantry or settings change. Test with *Settings → Send a test reminder*.
  Test on a real device early; Expo Go's notification support differs by platform and SDK.
- **Offline:** Firestore writes queue and sync when back online (the UI never waits on the network).
  Without internet, recipe search falls back to bundled and previously cached recipes with a banner.
- App icons and splash are the Expo template defaults; replace the files in `assets/` before submission.

## 5. Scripts

```bash
npm test            # 30 unit tests: scaling, matching, diet, nutrition, reminder planning
npm run typecheck   # tsc --noEmit
npx expo start -c
```

## 6. Testing checklist (Work-plan week 5)

- [ ] Sign up, log out, log in; log in on a 2nd device and see the same pantry
- [ ] Add pantry items with and without expiry; check the "expiring soon" chip and tab badge
- [ ] Recipes: change 0/1/2 missing, meal type, each diet filter; try airplane mode
- [ ] Open a recipe, change servings, confirm amounts and fractions look right
- [ ] "Add missing to grocery list", tick an item, confirm it appears in the pantry (and Undo works)
- [ ] Set an expiry for tomorrow and use *Send a test reminder*; check Android and iOS
- [ ] "I cooked this" adds to the Tracker; delete an entry
- [ ] Dark mode toggle; run with at least 5 users and note issues for your report
