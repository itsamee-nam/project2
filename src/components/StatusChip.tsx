import { StyleSheet, Text, View } from 'react-native';
import { useIsDark } from '../hooks/useAppTheme';
import { status } from '../theme';

export function StatusChip({ kind, label }: { kind: keyof typeof status; label: string }) {
  const dark = useIsDark();
  const c = status[kind][dark ? 'dark' : 'light'];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});
