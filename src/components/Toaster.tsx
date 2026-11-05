import { Snackbar } from 'react-native-paper';
import { useToast } from '../store/toast';

export function Toaster() {
  const { message, actionLabel, onAction, hide } = useToast();
  return (
    <Snackbar
      visible={!!message}
      onDismiss={hide}
      duration={4000}
      action={actionLabel ? { label: actionLabel, onPress: () => onAction?.() } : undefined}
    >
      {message ?? ''}
    </Snackbar>
  );
}
