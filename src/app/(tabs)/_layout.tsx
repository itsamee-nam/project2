import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useData } from '../../store/data';
import { expiryStatus } from '../../utils/dates';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const icon = (name: IconName, focused: IconName) =>
  function TabIcon({ color, size, focused: f }: { color: ColorValue; size: number; focused: boolean }) {
    return <MaterialCommunityIcons name={f ? focused : name} color={color as string} size={size} />;
  };

export default function TabsLayout() {
  const theme = useTheme();
  const pantry = useData((s) => s.pantry);
  const groceryCount = useData((s) => s.grocery.length);
  const urgent = pantry.filter((p) => ['soon', 'expired'].includes(expiryStatus(p.expiryDate))).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.elevation.level2, borderTopColor: theme.colors.outlineVariant },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { color: theme.colors.onBackground },
        headerShadowVisible: false,
        headerRight: () => (
          <Link href="/settings" asChild>
            <IconButton icon="cog-outline" accessibilityLabel="Settings" />
          </Link>
        ),
      }}
    >
      <Tabs.Screen
        name="pantry"
        options={{ title: 'Pantry', tabBarIcon: icon('fridge-outline', 'fridge'), tabBarBadge: urgent > 0 ? urgent : undefined }}
      />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes', tabBarIcon: icon('chef-hat', 'chef-hat') }} />
      <Tabs.Screen
        name="grocery"
        options={{ title: 'Grocery', tabBarIcon: icon('cart-outline', 'cart'), tabBarBadge: groceryCount > 0 ? groceryCount : undefined }}
      />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: icon('heart-outline', 'heart') }} />
      <Tabs.Screen name="tracker" options={{ title: 'Tracker', tabBarIcon: icon('chart-donut', 'chart-donut') }} />
    </Tabs>
  );
}
