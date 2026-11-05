import { useColorScheme } from 'react-native';
import { useData } from '../store/data';
import { dark, light } from '../theme';

export function useIsDark(): boolean {
  const system = useColorScheme();
  const mode = useData((s) => s.prefs.theme);
  return mode === 'system' ? system === 'dark' : mode === 'dark';
}

export function useAppTheme() {
  return useIsDark() ? dark : light;
}
