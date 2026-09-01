import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import SleepScreen from '../screens/sleep/SleepScreen';
import AlarmsScreen from '../screens/alarms/AlarmsScreen';
import AlarmEditScreen from '../screens/alarms/AlarmEditScreen';
import CreativeScreen from '../screens/creative/CreativeScreen';
import JarvisScreen from '../screens/jarvis/JarvisScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootTabParamList = {
  Home: undefined;
  Sleep: undefined;
  Alarms: undefined;
  Creative: undefined;
  Jarvis: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Settings: undefined;
};

export type AlarmsStackParamList = {
  AlarmsList: undefined;
  AlarmEdit: { alarmId?: string } | undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlarmsStack = createNativeStackNavigator<AlarmsStackParamList>();

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>;
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Ayarlar' }} />
    </HomeStack.Navigator>
  );
}

function AlarmsStackNavigator() {
  return (
    <AlarmsStack.Navigator screenOptions={{ headerShown: false }}>
      <AlarmsStack.Screen name="AlarmsList" component={AlarmsScreen} />
      <AlarmsStack.Screen
        name="AlarmEdit"
        component={AlarmEditScreen}
        options={{ headerShown: true, title: 'Alarm', presentation: 'modal' }}
      />
    </AlarmsStack.Navigator>
  );
}

export default function RootNavigator() {
  const { theme } = useAppTheme();

  const navTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ title: 'Ana Sayfa', tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} /> }}
        />
        <Tab.Screen
          name="Sleep"
          component={SleepScreen}
          options={{ title: 'Uyku', tabBarIcon: ({ color }) => <TabIcon symbol="🌙" color={color} /> }}
        />
        <Tab.Screen
          name="Alarms"
          component={AlarmsStackNavigator}
          options={{ title: 'Alarmlar', tabBarIcon: ({ color }) => <TabIcon symbol="⏰" color={color} /> }}
        />
        <Tab.Screen
          name="Creative"
          component={CreativeScreen}
          options={{ title: 'Yaratıcılık', tabBarIcon: ({ color }) => <TabIcon symbol="✍️" color={color} /> }}
        />
        <Tab.Screen
          name="Jarvis"
          component={JarvisScreen}
          options={{ title: 'Jarvis', tabBarIcon: ({ color }) => <TabIcon symbol="🤖" color={color} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
