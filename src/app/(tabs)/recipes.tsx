import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Banner, Chip, Searchbar, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { RecipeCard } from '../../components/RecipeCard';
import { searchAll, searchByTitle, searchLocal, type SearchParams } from '../../services/recipeService';
import { useData } from '../../store/data';
import { DIET_LABELS, MEAL_TYPES, type Diet, type MealType, type RecipeMatch } from '../../types';

export default function RecipesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const pantry = useData((s) => s.pantry);
  const assumeStaples = useData((s) => s.prefs.assumeStaples);

  const [mealType, setMealType] = useState<MealType | null>(null);
  const [avoid, setAvoid] = useState<Diet[]>([]);
  const [maxMissing, setMaxMissing] = useState<'0' | '1' | '2'>('1');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const runId = useRef(0);

  // Re-run whenever filters or pantry change. Bundled recipes appear instantly; TheMealDB results follow.
  useEffect(() => {
    const id = ++runId.current;
    const params: SearchParams = {
      pantry, mealType, avoid, assumeStaples, maxMissing: Number(maxMissing) as 0 | 1 | 2,
    };
    const typed = query.trim().length > 0;
    if (!typed) setMatches(searchLocal(params));
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = typed ? await searchByTitle(query, params) : await searchAll(params);
        if (id !== runId.current) return;
        setMatches(res.matches);
        setOffline(res.offline);
      } catch {
        if (id === runId.current) setOffline(true);
      } finally {
        if (id === runId.current) setLoading(false);
      }
    }, typed ? 450 : 150);
    return () => clearTimeout(t);
  }, [pantry, mealType, avoid, maxMissing, query, assumeStaples]);

  const toggleDiet = (d: Diet) => setAvoid((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const header = (
    <View style={{ gap: 10, paddingBottom: 8 }}>
      <Searchbar placeholder="Search recipes by name" value={query} onChangeText={setQuery} style={styles.pad} />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[null, ...MEAL_TYPES] as (MealType | null)[]}
        keyExtractor={(m) => m ?? 'any'}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <Chip selected={mealType === item} showSelectedOverlay onPress={() => setMealType(item)}>
            {item ?? 'Any meal'}
          </Chip>
        )}
      />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={Object.keys(DIET_LABELS) as Diet[]}
        keyExtractor={(d) => d}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <Chip selected={avoid.includes(item)} showSelectedOverlay onPress={() => toggleDiet(item)}>
            {DIET_LABELS[item]}
          </Chip>
        )}
      />
      <View style={styles.pad}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
          Missing ingredients allowed
        </Text>
        <SegmentedButtons
          value={maxMissing}
          onValueChange={(v) => setMaxMissing(v as '0' | '1' | '2')}
          buttons={[
            { value: '0', label: '0 (have all)' },
            { value: '1', label: 'Up to 1' },
            { value: '2', label: 'Up to 2' },
          ]}
        />
      </View>
      {offline ? (
        <Banner visible icon="wifi-off" style={{ marginHorizontal: 0 }}>
          Can’t reach TheMealDB right now. Showing Bhutanese recipes and anything saved from earlier searches.
        </Banner>
      ) : null}
      <View style={[styles.pad, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
        <Text variant="titleSmall" style={{ flex: 1 }}>
          {matches.length} {matches.length === 1 ? 'recipe' : 'recipes'} found
        </Text>
        {loading ? <ActivityIndicator size="small" /> : null}
      </View>
    </View>
  );

  return (
    <FlatList
      data={matches}
      keyExtractor={(m) => m.recipe.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <RecipeCard match={item} onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: item.recipe.id } })} />
      )}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      ListEmptyComponent={
        loading ? undefined : pantry.length === 0 && !query ? (
          <EmptyState
            icon="food-apple-outline"
            title="Add ingredients first"
            body="Recipes are matched against what is in your pantry. Add a few items and come back."
            actionLabel="Go to pantry"
            onAction={() => router.push('/pantry')}
          />
        ) : (
          <EmptyState
            icon="chef-hat"
            title="No recipes match"
            body="Allow more missing ingredients, remove a diet filter, or add more items to your pantry."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
});
