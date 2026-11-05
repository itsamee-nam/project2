import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Chip, FAB, Searchbar, useTheme } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { PantryFormModal } from '../../components/PantryFormModal';
import { PantryRow } from '../../components/PantryRow';
import { ensurePermission } from '../../services/notifications';
import { useData } from '../../store/data';
import { toast } from '../../store/toast';
import type { PantryItem } from '../../types';
import { daysUntil, expiryStatus } from '../../utils/dates';

type Filter = 'all' | 'expiring' | 'low';

export default function PantryScreen() {
  const theme = useTheme();
  const { pantry, loaded, addPantryItem, updatePantryItem, deletePantryItem, prefs } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const expiringCount = pantry.filter((p) => ['soon', 'expired'].includes(expiryStatus(p.expiryDate))).length;
  const lowCount = pantry.filter((p) => p.lowStockAt > 0 && p.quantity <= p.lowStockAt).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pantry
      .filter((p) => (q ? p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) : true))
      .filter((p) => {
        if (filter === 'expiring') return ['soon', 'expired'].includes(expiryStatus(p.expiryDate));
        if (filter === 'low') return p.lowStockAt > 0 && p.quantity <= p.lowStockAt;
        return true;
      })
      // soonest expiry first, items without a date last, then A-Z
      .sort((a, b) => {
        const da = a.expiryDate ? daysUntil(a.expiryDate) : 9999;
        const db = b.expiryDate ? daysUntil(b.expiryDate) : 9999;
        return da - db || a.name.localeCompare(b.name);
      });
  }, [pantry, search, filter]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (item: PantryItem) => { setEditing(item); setFormOpen(true); };

  const save = (data: Omit<PantryItem, 'id' | 'createdAt'>, existing: PantryItem | null) => {
    if (existing) updatePantryItem({ ...existing, ...data });
    else addPantryItem(data);
    setFormOpen(false);
    // The first time someone sets an expiry date or low-stock level, ask for notification permission.
    if ((data.expiryDate || data.lowStockAt > 0) && (prefs.expiryNotify || prefs.lowStockNotify)) {
      ensurePermission().then((ok) => {
        if (!ok) toast('Turn on notifications in your phone settings to get expiry reminders.');
      });
    }
  };

  const adjust = (item: PantryItem, delta: number) => {
    const quantity = Math.max(0, Math.round((item.quantity + delta) * 100) / 100);
    updatePantryItem({ ...item, quantity });
  };

  return (
    <View style={{ flex: 1 }}>
      <Searchbar placeholder="Search your pantry" value={search} onChangeText={setSearch} style={styles.search} />
      <View style={styles.filters}>
        <Chip selected={filter === 'all'} showSelectedOverlay onPress={() => setFilter('all')}>All ({pantry.length})</Chip>
        <Chip selected={filter === 'expiring'} showSelectedOverlay onPress={() => setFilter('expiring')} icon="clock-alert-outline">
          Expiring ({expiringCount})
        </Chip>
        <Chip selected={filter === 'low'} showSelectedOverlay onPress={() => setFilter('low')} icon="arrow-down-bold-outline">
          Low ({lowCount})
        </Chip>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <PantryRow item={item} onPress={() => openEdit(item)} onAdjust={(d) => adjust(item, d)} />
        )}
        contentContainerStyle={{ paddingBottom: 110, flexGrow: 1 }}
        ListEmptyComponent={
          loaded ? (
            pantry.length === 0 ? (
              <EmptyState
                icon="fridge-outline"
                title="Your pantry is empty"
                body="Add what you have at home and DormChef will suggest recipes you can cook right now."
                actionLabel="Add first ingredient"
                onAction={openAdd}
              />
            ) : (
              <EmptyState icon="magnify" title="Nothing matches" body="Try a different search or filter." />
            )
          ) : undefined
        }
      />

      <FAB
        icon="plus"
        label="Add"
        onPress={openAdd}
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        accessibilityLabel="Add ingredient"
      />

      <PantryFormModal
        visible={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
        onSave={save}
        onDelete={(item) => { deletePantryItem(item.id); setFormOpen(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { marginHorizontal: 16, marginBottom: 8 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8, flexWrap: 'wrap' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
