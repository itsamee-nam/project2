import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { addDays, formatDisplayDate, fromISODate, toISODate, todayISO } from '../utils/dates';

interface Props {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
}

/** Date picker with quick "+3 days / +1 week / +1 month" shortcuts for perishables. */
export function DateField({ label, value, onChange }: Props) {
  const theme = useTheme();
  const [showIOS, setShowIOS] = useState(false);
  const current = value ? fromISODate(value) : new Date();

  const handle = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== 'ios') setShowIOS(false);
    if (e.type === 'set' && d) onChange(toISODate(d));
  };

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: current, mode: 'date', minimumDate: new Date(2020, 0, 1), onChange: handle });
    } else {
      setShowIOS((s) => !s);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <View style={styles.row}>
        <Button mode="outlined" icon="calendar" onPress={open} style={{ flex: 1 }} accessibilityLabel={label}>
          {value ? formatDisplayDate(value) : 'Not set'}
        </Button>
        {value ? <Button onPress={() => onChange(null)}>Clear</Button> : null}
      </View>
      <View style={styles.quick}>
        {[['+3 days', 3], ['+1 week', 7], ['+2 weeks', 14], ['+1 month', 30]].map(([l, n]) => (
          <Button key={l as string} compact mode="text" onPress={() => onChange(addDays(todayISO(), n as number))}>
            {l as string}
          </Button>
        ))}
      </View>
      {Platform.OS === 'ios' && showIOS ? (
        <DateTimePicker value={current} mode="date" display="inline" onChange={handle} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quick: { flexDirection: 'row', flexWrap: 'wrap' },
});
