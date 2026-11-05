import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { RecipeCard } from '../../components/RecipeCard';
import { useData } from '../../store/data';
import { matchRecipe } from '../../utils/matching';

export default function SavedScreen() {
  const router = useRouter();
  const saved = useData((s) => s.saved);
  const pantry = useData((s) => s.pantry);
  const assumeStaples = useData((s) => s.prefs.assumeStaples);

  const matches = useMemo(
    () => saved.map((r) => matchRecipe(r, pantry.map((p) => p.name), { assumeStaples })),
    [saved, pantry, assumeStaples],
  );

  return (
    <FlatList
      data={matches}
      keyExtractor={(m) => m.recipe.id}
      contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
      renderItem={({ item }) => (
        <RecipeCard match={item} onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: item.recipe.id } })} />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="No saved recipes yet"
          body="Tap the heart on any recipe to keep it here. Saved recipes sync to all your devices."
          actionLabel="Find recipes"
          onAction={() => router.push('/recipes')}
        />
      }
    />
  );
}
