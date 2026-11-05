import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import type { RecipeMatch } from '../types';

interface Props {
  match: RecipeMatch;
  onPress: () => void;
}

export function RecipeThumb({ recipe, size }: { recipe: RecipeMatch['recipe']; size: number }) {
  const theme = useTheme();
  if (recipe.thumb) {
    return (
      <Image
        source={{ uri: recipe.thumb.endsWith('.jpg') ? `${recipe.thumb}/small` : recipe.thumb }}
        style={{ width: size, height: size, borderRadius: 12, backgroundColor: theme.colors.surfaceVariant }}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.primaryContainer,
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{recipe.emoji ?? '🍽️'}</Text>
    </View>
  );
}

export function RecipeCard({ match, onPress }: Props) {
  const theme = useTheme();
  const { recipe, missing, owned } = match;
  const complete = missing.length === 0;
  return (
    <Surface elevation={1} style={styles.card}>
      <Pressable onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={`Open ${recipe.title}`}>
        <RecipeThumb recipe={recipe} size={88} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="titleMedium" numberOfLines={2}>{recipe.title}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
            {[recipe.area, recipe.category].filter(Boolean).join(' · ')}
          </Text>
          <Text
            variant="labelLarge"
            style={{ color: complete ? theme.colors.primary : theme.colors.tertiary }}
            numberOfLines={2}
          >
            {complete
              ? 'You have everything'
              : `Missing ${missing.length}: ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? '…' : ''}`}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {owned.length} of {recipe.ingredients.length} ingredients in your pantry
          </Text>
        </View>
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 5, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, padding: 10 },
});
