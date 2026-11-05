import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, List, SegmentedButtons, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { cancelAllReminders, ensurePermission, sendTestNotification } from '../services/notifications';
import { useAuth } from '../store/auth';
import { useData } from '../store/data';
import { toast } from '../store/toast';
import type { ThemeMode } from '../types';

export default function SettingsScreen() {
  const theme = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { prefs, setPrefs } = useData();
  const [goal, setGoal] = useState(String(prefs.calorieGoal));

  const toggleExpiry = async (on: boolean) => {
    if (on && !(await ensurePermission())) {
      toast('Notifications are blocked. Enable them for DormChef in your phone settings.');
      return;
    }
    setPrefs({ expiryNotify: on });
    if (!on && !prefs.lowStockNotify) cancelAllReminders();
  };

  const toggleLow = async (on: boolean) => {
    if (on && !(await ensurePermission())) {
      toast('Notifications are blocked. Enable them for DormChef in your phone settings.');
      return;
    }
    setPrefs({ lowStockNotify: on });
  };

  const commitGoal = () => {
    const n = Math.round(Number(goal));
    if (isFinite(n) && n >= 500 && n <= 6000) setPrefs({ calorieGoal: n });
    else {
      setGoal(String(prefs.calorieGoal));
      toast('Enter a daily goal between 500 and 6000 kcal.');
    }
  };

  const confirmLogout = () =>
    Alert.alert('Log out', 'Your data stays safe in the cloud and will be here when you log back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { cancelAllReminders(); logout(); } },
    ]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title={user?.displayName || 'DormChef cook'}
          description={user?.email ?? ''}
          left={(p) => <List.Icon {...p} icon="account-circle-outline" />}
        />
      </List.Section>
      <Divider />

      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <View style={styles.pad}>
          <SegmentedButtons
            value={prefs.theme}
            onValueChange={(v) => setPrefs({ theme: v as ThemeMode })}
            buttons={[
              { value: 'system', label: 'System', icon: 'cellphone' },
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
            ]}
          />
        </View>
      </List.Section>
      <Divider />

      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Expiry reminders"
          description="Get a reminder before items expire"
          left={(p) => <List.Icon {...p} icon="clock-alert-outline" />}
          right={() => <Switch value={prefs.expiryNotify} onValueChange={toggleExpiry} />}
        />
        <List.Item
          title="Remind me"
          description={`${prefs.daysBefore} ${prefs.daysBefore === 1 ? 'day' : 'days'} before expiry, at 9:00`}
          left={(p) => <List.Icon {...p} icon="calendar-clock" />}
          right={() => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="minus" size={18} mode="contained-tonal" disabled={prefs.daysBefore <= 0} onPress={() => setPrefs({ daysBefore: prefs.daysBefore - 1 })} accessibilityLabel="Fewer days" />
              <Text variant="titleMedium">{prefs.daysBefore}</Text>
              <IconButton icon="plus" size={18} mode="contained-tonal" disabled={prefs.daysBefore >= 14} onPress={() => setPrefs({ daysBefore: prefs.daysBefore + 1 })} accessibilityLabel="More days" />
            </View>
          )}
          disabled={!prefs.expiryNotify}
        />
        <List.Item
          title="Low-stock reminders"
          description="Tell me when something is running out"
          left={(p) => <List.Icon {...p} icon="arrow-down-bold-outline" />}
          right={() => <Switch value={prefs.lowStockNotify} onValueChange={toggleLow} />}
        />
        <View style={styles.pad}>
          <Button
            mode="outlined"
            icon="bell-ring-outline"
            onPress={async () => toast((await sendTestNotification()) ? 'Test reminder arrives in a few seconds' : 'Notifications are blocked in phone settings')}
          >
            Send a test reminder
          </Button>
        </View>
      </List.Section>
      <Divider />

      <List.Section>
        <List.Subheader>Cooking</List.Subheader>
        <List.Item
          title="Assume water and salt"
          description="Don’t count them as missing ingredients"
          left={(p) => <List.Icon {...p} icon="shaker-outline" />}
          right={() => <Switch value={prefs.assumeStaples} onValueChange={(v) => setPrefs({ assumeStaples: v })} />}
        />
        <View style={styles.pad}>
          <TextInput
            label="Daily calorie goal (kcal)"
            mode="outlined"
            value={goal}
            onChangeText={setGoal}
            onBlur={commitGoal}
            onSubmitEditing={commitGoal}
            keyboardType="number-pad"
          />
        </View>
      </List.Section>
      <Divider />

      <View style={[styles.pad, { marginTop: 16, gap: 8 }]}>
        <Button mode="contained-tonal" icon="logout" onPress={confirmLogout}>Log out</Button>
        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          DormChef {Constants.expoConfig?.version ?? '1.0.0'} · Recipes from TheMealDB and Bhutanese home cooking
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingVertical: 4 },
});
