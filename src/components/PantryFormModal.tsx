import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COMMON_INGREDIENTS } from '../data/ingredients';
import { PANTRY_CATEGORIES, UNITS, type PantryCategory, type PantryItem, type Unit } from '../types';
import { normalizeName } from '../utils/text';
import { BarcodeScanner } from './BarcodeScanner';
import { DateField } from './DateField';

interface Props {
  visible: boolean;
  /** Item being edited, or null to add a new one */
  item: PantryItem | null;
  onClose: () => void;
  onSave: (data: Omit<PantryItem, 'id' | 'createdAt'>, existing: PantryItem | null) => void;
  onDelete: (item: PantryItem) => void;
}

/** Decide a sensible category when the user picks a known ingredient. */
const CATEGORY_HINTS: [RegExp, PantryCategory][] = [
  [/milk|cheese|butter|egg|yogurt|cream|paneer|ghee/, 'Dairy & Eggs'],
  [/chicken|pork|beef|fish|lamb|shrimp|sausage|bacon/, 'Meat & Fish'],
  [/rice|flour|lentil|noodle|pasta|bread|bean|oat|tofu|chickpea/, 'Grains & Pulses'],
  [/salt|pepper|powder|turmeric|cumin|oil|sauce|sugar|honey|yeast|vinegar|stock|seed/, 'Spices & Sauces'],
  [/tea|coffee|water/, 'Drinks'],
  [/apple|banana|orange|lemon|lime|mango|avocado/, 'Fruits'],
];

function suggestCategory(name: string): PantryCategory {
  const n = normalizeName(name);
  for (const [re, cat] of CATEGORY_HINTS) if (re.test(n)) return cat;
  return COMMON_INGREDIENTS.some((c) => normalizeName(c) === n) ? 'Vegetables' : 'Other';
}

export function PantryFormModal({ visible, item, onClose, onSave, onDelete }: Props) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryCategory>('Vegetables');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('pcs');
  const [lowStockAt, setLowStockAt] = useState('0');
  const [expiry, setExpiry] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Reset the form each time it opens.
  useEffect(() => {
    if (!visible) return;
    setShowErrors(false);
    setScanning(false);
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setCategoryTouched(true);
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setLowStockAt(String(item.lowStockAt));
      setExpiry(item.expiryDate);
    } else {
      setName('');
      setCategory('Vegetables');
      setCategoryTouched(false);
      setQuantity('1');
      setUnit('pcs');
      setLowStockAt('0');
      setExpiry(null);
    }
  }, [visible, item]);

  const suggestions = useMemo(() => {
    const q = normalizeName(name);
    if (q.length < 1) return [];
    return COMMON_INGREDIENTS.filter((c) => {
      const n = normalizeName(c);
      return n.includes(q) && n !== q;
    }).slice(0, 6);
  }, [name]);

  const qtyNum = Number(quantity.replace(',', '.'));
  const lowNum = Number(lowStockAt.replace(',', '.'));
  const nameError = name.trim().length === 0;
  const qtyError = !isFinite(qtyNum) || qtyNum < 0 || quantity.trim() === '';
  const lowError = !isFinite(lowNum) || lowNum < 0;

  const pickName = (n: string) => {
    setName(n);
    if (!categoryTouched) setCategory(suggestCategory(n));
  };

  const submit = () => {
    if (nameError || qtyError || lowError) {
      setShowErrors(true);
      return;
    }
    onSave(
      { name: name.trim(), category, quantity: qtyNum, unit, lowStockAt: lowNum, expiryDate: expiry },
      item,
    );
  };

  const confirmDelete = () => {
    if (!item) return;
    Alert.alert('Remove item', `Remove ${item.name} from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(item) },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={{ flex: 1 }}>{item ? 'Edit ingredient' : 'Add ingredient'}</Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.nameRow}>
              <TextInput
                label="Ingredient name"
                value={name}
                onChangeText={pickName}
                mode="outlined"
                style={{ flex: 1 }}
                autoCapitalize="words"
                error={showErrors && nameError}
                autoFocus={!item}
              />
              <IconButton icon="barcode-scan" mode="contained-tonal" onPress={() => setScanning(true)} accessibilityLabel="Scan barcode" />
            </View>
            {showErrors && nameError ? <HelperText type="error">Enter a name.</HelperText> : null}
            {suggestions.length > 0 && (
              <View style={styles.wrapRow}>
                {suggestions.map((s) => (
                  <Chip key={s} compact onPress={() => pickName(s)}>{s}</Chip>
                ))}
              </View>
            )}

            <Text variant="labelLarge" style={styles.label}>Category</Text>
            <View style={styles.wrapRow}>
              {PANTRY_CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  selected={category === c}
                  showSelectedOverlay
                  onPress={() => { setCategory(c); setCategoryTouched(true); }}
                >
                  {c}
                </Chip>
              ))}
            </View>

            <View style={[styles.nameRow, { marginTop: 16 }]}>
              <TextInput
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                mode="outlined"
                style={{ flex: 1 }}
                error={showErrors && qtyError}
              />
              <TextInput
                label="Low when ≤"
                value={lowStockAt}
                onChangeText={setLowStockAt}
                keyboardType="decimal-pad"
                mode="outlined"
                style={{ flex: 1 }}
                error={showErrors && lowError}
              />
            </View>
            <HelperText type={showErrors && (qtyError || lowError) ? 'error' : 'info'}>
              {showErrors && (qtyError || lowError)
                ? 'Quantity and the low-stock level must be numbers (0 or more).'
                : 'You get a reminder when the quantity drops to the low-stock level. Use 0 for no reminder.'}
            </HelperText>

            <Text variant="labelLarge" style={styles.label}>Unit</Text>
            <View style={styles.wrapRow}>
              {UNITS.map((u) => (
                <Chip key={u} selected={unit === u} showSelectedOverlay onPress={() => setUnit(u)}>{u}</Chip>
              ))}
            </View>

            <View style={{ marginTop: 16 }}>
              <DateField label="Expiry date (optional)" value={expiry} onChange={setExpiry} />
            </View>

            <Button mode="contained" onPress={submit} style={styles.save} contentStyle={{ paddingVertical: 6 }}>
              {item ? 'Save changes' : 'Add to pantry'}
            </Button>
            {item ? (
              <Button mode="text" textColor={theme.colors.error} onPress={confirmDelete}>
                Remove from pantry
              </Button>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BarcodeScanner visible={scanning} onClose={() => setScanning(false)} onFound={pickName} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingTop: 8 },
  body: { padding: 20, paddingBottom: 48 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  label: { marginTop: 16 },
  save: { marginTop: 24 },
});
