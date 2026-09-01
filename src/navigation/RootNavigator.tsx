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
import HobbyScreen from '../screens/hobby/HobbyScreen';
import ForMyLoveScreen from '../screens/love/ForMyLoveScreen';
import NinniScreen from '../screens/lullaby/NinniScreen';

export type RootTabParamList = {
  Home: undefined;
  Sleep: undefined;
  Alarms: undefined;
  Creative: undefined;
  Hobby: undefined;
  Love: undefined;
  Ninni: undefined;
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
          tabBarPosition: 'left',
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderRightColor: theme.colors.border,
            borderRightWidth: 1,
            width: 60,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarItemStyle: { paddingVertical: 4 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} /> }}
        />
        <Tab.Screen
          name="Sleep"
          component={SleepScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="🌙" color={color} /> }}
        />
        <Tab.Screen
          name="Alarms"
          component={AlarmsStackNavigator}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="⏰" color={color} /> }}
        />
        <Tab.Screen
          name="Creative"
          component={CreativeScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="✍️" color={color} /> }}
        />
        <Tab.Screen
          name="Hobby"
          component={HobbyScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="🎬" color={color} /> }}
        />
        <Tab.Screen
          name="Ninni"
          component={NinniScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="🎵" color={color} /> }}
        />
        <Tab.Screen
          name="Love"
          component={ForMyLoveScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="💜" color={color} /> }}
        />
        <Tab.Screen
          name="Jarvis"
          component={JarvisScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon symbol="🤖" color={color} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
