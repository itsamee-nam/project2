import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

interface Props {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name={icon} size={56} color={theme.colors.outline} />
      <Text variant="titleMedium" style={styles.title}>{title}</Text>
      {body ? <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.btn}>{actionLabel}</Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 32, gap: 8 },
  title: { textAlign: 'center', marginTop: 8 },
  body: { textAlign: 'center', maxWidth: 320 },
  btn: { marginTop: 12 },
});
