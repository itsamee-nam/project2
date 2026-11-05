import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import type { PantryItem } from '../types';
import { expiryLabel, expiryStatus } from '../utils/dates';
import { StatusChip } from './StatusChip';

interface Props {
  item: PantryItem;
  onPress: () => void;
  onAdjust: (delta: number) => void;
}

/** Step used by the − / + buttons: bigger for grams and millilitres. */
function stepFor(item: PantryItem) {
  return item.unit === 'g' || item.unit === 'ml' ? 50 : item.unit === 'tsp' || item.unit === 'tbsp' ? 1 : 1;
}

export function PantryRow({ item, onPress, onAdjust }: Props) {
  const theme = useTheme();
  const st = expiryStatus(item.expiryDate);
  const low = item.lowStockAt > 0 && item.quantity <= item.lowStockAt;
  const step = stepFor(item);
  return (
    <Surface elevation={1} style={[styles.card, { borderRadius: 14 }]}>
      <Pressable
        onPress={onPress}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="titleMedium" numberOfLines={1}>{item.name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.category}
          </Text>
          <View style={styles.chips}>
            {st === 'expired' && <StatusChip kind="expired" label={expiryLabel(item.expiryDate)} />}
            {st === 'soon' && <StatusChip kind="soon" label={`Expiring soon · ${expiryLabel(item.expiryDate).replace('Expires ', '')}`} />}
            {st === 'ok' && <StatusChip kind="ok" label={expiryLabel(item.expiryDate)} />}
            {low && <StatusChip kind="low" label="Running low" />}
          </View>
        </View>
        <View style={styles.qty}>
          <IconButton
            icon="minus"
            size={18}
            mode="contained-tonal"
            onPress={() => onAdjust(-step)}
            disabled={item.quantity <= 0}
            accessibilityLabel={`Decrease ${item.name}`}
          />
          <View style={{ minWidth: 52, alignItems: 'center' }}>
            <Text variant="titleMedium">{Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1)}</Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.unit}</Text>
          </View>
          <IconButton
            icon="plus"
            size={18}
            mode="contained-tonal"
            onPress={() => onAdjust(step)}
            accessibilityLabel={`Increase ${item.name}`}
          />
        </View>
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 5, overflow: 'hidden' },
  main: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingRight: 4, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  qty: { flexDirection: 'row', alignItems: 'center' },
});
