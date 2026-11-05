import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from '../components/Toaster';
import { useAppTheme, useIsDark } from '../hooks/useAppTheme';
import { useCloudSync, useReminderSync } from '../hooks/useCloudSync';
import { FIREBASE_CONFIGURED } from '../lib/config';
import { useAuth } from '../store/auth';
import { useData } from '../store/data';

function SetupNeeded() {
  return (
    <View style={styles.center}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>Connect Firebase</Text>
      <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
        Copy .env.example to .env, paste your Firebase web-app keys, then restart with `npx expo start -c`.
        See the README for the 5-minute setup.
      </Text>
    </View>
  );
}

function Gate() {
  const { user, ready } = useAuth();
  useCloudSync();
  useReminderSync();

  if (!FIREBASE_CONFIGURED) return <SetupNeeded />;
  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const theme = useAppTheme();
  const isDark = useIsDark();
  const init = useAuth((s) => s.init);
  const loadLocalPrefs = useData((s) => s.loadLocalPrefs);

  useEffect(() => {
    loadLocalPrefs();
    return init();
  }, [init, loadLocalPrefs]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Gate />
        </View>
        <Toaster />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
