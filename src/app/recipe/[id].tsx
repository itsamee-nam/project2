import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Divider, IconButton, Portal, Surface, Text, useTheme } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { RecipeThumb } from '../../components/RecipeCard';
import { getRecipe } from '../../services/recipeService';
import { useData } from '../../store/data';
import { toast } from '../../store/toast';
import type { Recipe } from '../../types';
import { matchRecipe } from '../../utils/matching';
import { scaleMeasure } from '../../utils/measure';
import { estimateMacros } from '../../utils/nutrition';

function Stepper({ value, onChange, min = 1, max = 24, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconButton icon="minus" mode="contained-tonal" size={18} disabled={value <= min} onPress={() => onChange(value - 1)} accessibilityLabel={`Fewer ${label}`} />
      <Text variant="titleMedium" style={{ minWidth: 28, textAlign: 'center' }}>{value}</Text>
      <IconButton icon="plus" mode="contained-tonal" size={18} disabled={value >= max} onPress={() => onChange(value + 1)} accessibilityLabel={`More ${label}`} />
    </View>
  );
}

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { pantry, prefs, saved, toggleSaved, addToGrocery, logCooked } = useData();
  const savedCopy = saved.find((r) => r.id === id);

  const [recipe, setRecipe] = useState<Recipe | null>(savedCopy ?? null);
  const [loading, setLoading] = useState(!savedCopy);
  const [servings, setServings] = useState<number | null>(null);
  const [ateOpen, setAteOpen] = useState(false);
  const [ate, setAte] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = (await getRecipe(String(id))) ?? savedCopy ?? null;
      if (!alive) return;
      setRecipe(r);
      setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const base = recipe?.servings ?? 1;
  const current = servings ?? base;
  const factor = current / base;

  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, pantry.map((p) => p.name), { assumeStaples: prefs.assumeStaples }) : null),
    [recipe, pantry, prefs.assumeStaples],
  );
  const macros = useMemo(() => (recipe ? estimateMacros(recipe) : null), [recipe]);
  const isSaved = !!recipe && saved.some((r) => r.id === recipe.id);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!recipe || !match || !macros) {
    return <EmptyState icon="alert-circle-outline" title="Recipe not found" body="It may have been removed, or you are offline and it was never saved." />;
  }

  const missingSet = new Set(match.missing);
  const missingItems = recipe.ingredients.filter((i) => missingSet.has(i.name));

  const addMissing = () => {
    const added = addToGrocery(
      missingItems.map((i) => ({ name: i.name, quantity: scaleMeasure(i.measure, factor) })),
      'recipe',
      recipe.title,
    );
    toast(added ? `Added ${added} ${added === 1 ? 'item' : 'items'} to your grocery list` : 'Those items are already on your list');
  };

  const confirmCooked = () => {
    logCooked(recipe, ate, macros.perServing);
    setAteOpen(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon={isSaved ? 'heart' : 'heart-outline'}
              iconColor={isSaved ? theme.colors.error : undefined}
              onPress={() => toggleSaved(recipe)}
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save recipe'}
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.hero}>
          {recipe.thumb ? (
            <Image source={{ uri: recipe.thumb }} style={styles.heroImg} accessibilityIgnoresInvertColors />
          ) : (
            <View style={[styles.heroImg, { backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 80 }}>{recipe.emoji ?? '🍽️'}</Text>
            </View>
          )}
        </View>

        <View style={styles.pad}>
          <Text variant="headlineSmall" style={{ fontWeight: '700' }}>{recipe.title}</Text>
          <View style={styles.tags}>
            {recipe.area ? <Chip compact>{recipe.area}</Chip> : null}
            <Chip compact>{recipe.category}</Chip>
            {recipe.mealTypes.map((m) => <Chip key={m} compact>{m}</Chip>)}
          </View>

          {/* Servings */}
          <Surface elevation={1} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium">Servings</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Amounts update automatically</Text>
              </View>
              <Stepper value={current} onChange={setServings} label="servings" />
            </View>
          </Surface>

          {/* Ingredients */}
          <Text variant="titleLarge" style={styles.h}>Ingredients</Text>
          <Surface elevation={1} style={[styles.card, { padding: 0 }]}>
            {recipe.ingredients.map((ing, idx) => {
              const have = !missingSet.has(ing.name);
              return (
                <View key={`${ing.name}-${idx}`}>
                  {idx > 0 ? <Divider /> : null}
                  <View style={styles.ingRow}>
                    <IconButton
                      icon={have ? 'check-circle' : 'close-circle-outline'}
                      iconColor={have ? theme.colors.primary : theme.colors.error}
                      size={20}
                      style={{ margin: 0 }}
                      accessibilityLabel={have ? 'In your pantry' : 'Missing'}
                    />
                    <Text variant="bodyLarge" style={{ flex: 1 }}>{ing.name}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {scaleMeasure(ing.measure, factor)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Surface>
          {missingItems.length > 0 ? (
            <Button mode="contained-tonal" icon="cart-plus" onPress={addMissing} style={{ marginTop: 12 }}>
              Add {missingItems.length} missing to grocery list
            </Button>
          ) : (
            <Text variant="labelLarge" style={{ color: theme.colors.primary, marginTop: 12 }}>
              ✓ You have everything for this recipe
            </Text>
          )}

          {/* Macros */}
          <Text variant="titleLarge" style={styles.h}>Nutrition (estimated)</Text>
          <Surface elevation={1} style={styles.card}>
            <View style={styles.macroRow}>
              {([['Calories', macros.perServing.kcal, 'kcal'], ['Protein', macros.perServing.protein, 'g'], ['Carbs', macros.perServing.carbs, 'g'], ['Fat', macros.perServing.fat, 'g']] as const).map(([l, v, u]) => (
                <View key={l} style={{ alignItems: 'center' }}>
                  <Text variant="titleLarge">{Math.round(v)}<Text variant="labelMedium"> {u}</Text></Text>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{l}</Text>
                </View>
              ))}
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
              Per serving. Estimated from ingredient amounts
              {macros.coverage < 0.7 ? ` (only ${Math.round(macros.coverage * 100)}% of ingredients could be measured, so treat this as rough)` : ''}.
            </Text>
          </Surface>

          {/* Steps */}
          <Text variant="titleLarge" style={styles.h}>Method</Text>
          {recipe.instructions.map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text variant="bodyLarge" style={{ flex: 1, lineHeight: 24 }}>{s}</Text>
            </View>
          ))}
          {recipe.youtube ? (
            <Button icon="youtube" mode="text" onPress={() => Linking.openURL(recipe.youtube!)}>Watch video</Button>
          ) : null}

          <Button
            mode="contained"
            icon="silverware-fork-knife"
            onPress={() => { setAte(1); setAteOpen(true); }}
            style={{ marginTop: 24 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            I cooked this
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={ateOpen} onDismiss={() => setAteOpen(false)}>
          <Dialog.Title>Add to today’s log</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">How many servings did you eat?</Text>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Stepper value={ate} onChange={setAte} max={10} label="servings eaten" />
            </View>
            <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              ≈ {Math.round(macros.perServing.kcal * ate)} kcal
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAteOpen(false)}>Cancel</Button>
            <Button onPress={confirmCooked}>Log it</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%' },
  heroImg: { width: '100%', height: 220 },
  pad: { padding: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 12 },
  card: { padding: 16, borderRadius: 16 },
  h: { marginTop: 24, marginBottom: 8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
