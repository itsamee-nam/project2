import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, ProgressBar, Surface, Text, useTheme } from 'react-native-paper';
import { EmptyState } from '../../components/EmptyState';
import { useData } from '../../store/data';
import { addDays, formatDisplayDate, todayISO } from '../../utils/dates';
import { sumMacros } from '../../utils/nutrition';

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Text variant="titleLarge">{Math.round(value)}<Text variant="labelMedium">{unit}</Text></Text>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
    </View>
  );
}

export default function TrackerScreen() {
  const theme = useTheme();
  const { log, prefs, deleteLogEntry } = useData();
  const [day, setDay] = useState(todayISO());
  const isToday = day === todayISO();

  const entries = useMemo(() => log.filter((e) => e.date === day).sort((a, b) => b.createdAt - a.createdAt), [log, day]);
  const totals = useMemo(() => sumMacros(entries), [entries]);
  const progress = Math.min(1, totals.kcal / Math.max(1, prefs.calorieGoal));
  const over = totals.kcal > prefs.calorieGoal;

  // Last 7 days, for the little bar chart
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i - 6));
    const kcal = days.map((d) => log.filter((e) => e.date === d).reduce((s, e) => s + e.kcal, 0));
    return { days, kcal, max: Math.max(prefs.calorieGoal, ...kcal) };
  }, [log, prefs.calorieGoal]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View style={styles.dayRow}>
        <IconButton icon="chevron-left" onPress={() => setDay(addDays(day, -1))} accessibilityLabel="Previous day" />
        <Text variant="titleMedium">{isToday ? 'Today' : formatDisplayDate(day)}</Text>
        <IconButton icon="chevron-right" disabled={isToday} onPress={() => setDay(addDays(day, 1))} accessibilityLabel="Next day" />
      </View>

      <Surface elevation={1} style={styles.card}>
        <Text variant="headlineMedium">
          {totals.kcal} <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>/ {prefs.calorieGoal} kcal</Text>
        </Text>
        <ProgressBar
          progress={progress}
          color={over ? theme.colors.error : theme.colors.primary}
          style={{ height: 10, borderRadius: 5, marginVertical: 12 }}
        />
        <View style={styles.statsRow}>
          <Stat label="Protein" value={totals.protein} unit="g" />
          <Stat label="Carbs" value={totals.carbs} unit="g" />
          <Stat label="Fat" value={totals.fat} unit="g" />
        </View>
      </Surface>

      <Surface elevation={1} style={styles.card}>
        <Text variant="titleSmall" style={{ marginBottom: 8 }}>Last 7 days</Text>
        <View style={styles.bars}>
          {week.days.map((d, i) => (
            <View key={d} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={{
                    height: `${Math.max(2, (week.kcal[i] / week.max) * 100)}%`,
                    backgroundColor: d === day ? theme.colors.primary : theme.colors.primaryContainer,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
              </Text>
            </View>
          ))}
        </View>
      </Surface>

      <Text variant="titleMedium">Cooked {isToday ? 'today' : 'this day'}</Text>
      {entries.length === 0 ? (
        <EmptyState
          icon="silverware-fork-knife"
          title="Nothing logged"
          body="Open a recipe and tap “I cooked this” to add its estimated calories and macros here."
        />
      ) : (
        entries.map((e) => (
          <Surface key={e.id} elevation={1} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium">{e.title}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {e.servings} {e.servings === 1 ? 'serving' : 'servings'} · {e.kcal} kcal · P {e.protein}g · C {e.carbs}g · F {e.fat}g
              </Text>
            </View>
            <IconButton icon="delete-outline" onPress={() => deleteLogEntry(e.id)} accessibilityLabel={`Delete ${e.title}`} />
          </Surface>
        ))
      )}
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Values are estimates calculated from ingredient amounts, not exact nutrition labels.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { padding: 16, borderRadius: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  bars: { flexDirection: 'row', height: 90, alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
});
