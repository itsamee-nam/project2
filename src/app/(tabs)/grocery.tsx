import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Checkbox, IconButton, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { useData } from '../../store/data';
import { toast } from '../../store/toast';
import { normalizeName } from '../../utils/text';

export default function GroceryScreen() {
  const theme = useTheme();
  const { grocery, pantry, addToGrocery, removeGroceryItem, tickGroceryItem, clearGrocery } = useData();
  const [text, setText] = useState('');

  // Pantry items at or below their low-stock level that are not on the list yet.
  const lowStock = useMemo(() => {
    const onList = new Set(grocery.map((g) => normalizeName(g.name)));
    return pantry.filter((p) => p.lowStockAt > 0 && p.quantity <= p.lowStockAt && !onList.has(normalizeName(p.name)));
  }, [pantry, grocery]);

  const addManual = () => {
    const name = text.trim();
    if (!name) return;
    const added = addToGrocery([{ name }], 'manual');
    if (!added) toast(`${name} is already on your list`);
    setText('');
  };

  const addLow = () => {
    addToGrocery(lowStock.map((p) => ({ name: p.name })), 'low-stock');
    toast(`Added ${lowStock.length} low-stock ${lowStock.length === 1 ? 'item' : 'items'}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.addRow}>
        <TextInput
          mode="outlined"
          placeholder="Add an item (e.g. Rice)"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addManual}
          style={{ flex: 1 }}
          dense
          returnKeyType="done"
        />
        <IconButton icon="plus" mode="contained" onPress={addManual} accessibilityLabel="Add item" />
      </View>

      {lowStock.length > 0 && (
        <Surface elevation={1} style={[styles.suggest, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Text variant="titleSmall" style={{ color: theme.colors.onTertiaryContainer }}>Running low in your pantry</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onTertiaryContainer, marginTop: 2 }}>
            {lowStock.map((p) => p.name).join(', ')}
          </Text>
          <Button mode="contained-tonal" compact style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={addLow}>
            Add all to list
          </Button>
        </Surface>
      )}

      <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        Tick an item when you have bought it. It moves into your pantry automatically.
      </Text>

      <FlatList
        data={grocery}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Surface elevation={1} style={styles.row}>
            <Checkbox
              status="unchecked"
              onPress={() => tickGroceryItem(item)}
            />
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium">{item.name}{item.quantity ? `  ·  ${item.quantity}` : ''}</Text>
              {item.recipeTitle ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>For {item.recipeTitle}</Text>
              ) : item.source === 'low-stock' ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Running low</Text>
              ) : null}
            </View>
            <IconButton icon="close" size={20} onPress={() => removeGroceryItem(item.id)} accessibilityLabel={`Remove ${item.name}`} />
          </Surface>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your grocery list is empty"
            body="Open a recipe and tap “Add missing to grocery list”, or add items above."
          />
        }
        ListFooterComponent={
          grocery.length > 1 ? (
            <Button onPress={clearGrocery} textColor={theme.colors.error} style={{ marginTop: 8 }}>Clear list</Button>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 4 },
  suggest: { marginHorizontal: 16, marginTop: 4, padding: 12, borderRadius: 14 },
  hint: { paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 4, paddingLeft: 4, borderRadius: 14 },
});
