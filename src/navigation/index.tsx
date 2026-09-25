import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '@/theme/colors';
import { HomeScreen } from '@/screens/HomeScreen';
import { TasksScreen } from '@/screens/TasksScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { NotesScreen } from '@/screens/NotesScreen';
import { TaskFormScreen } from '@/screens/TaskFormScreen';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { GoalsScreen } from '@/screens/GoalsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Tasks: '📋',
  Stats: '📊',
  Notes: '📝',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.cardBorder },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
    </Tab.Navigator>
  );
}

const AppDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bgElevated, border: colors.cardBorder, text: colors.textPrimary, primary: colors.accent },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={AppDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="TaskForm"
          component={TaskFormScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
