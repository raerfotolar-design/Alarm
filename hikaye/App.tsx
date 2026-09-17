import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import StoryEditorScreen from './src/screens/StoryEditorScreen';
import ChapterEditorScreen from './src/screens/ChapterEditorScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import JoinPromptScreen from './src/screens/JoinPromptScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BotsScreen from './src/screens/BotsScreen';
import BotEditorScreen from './src/screens/BotEditorScreen';
import BotChatScreen from './src/screens/BotChatScreen';
import { RootStackParamList } from './src/navigation/types';
import { theme } from './src/theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Hikaye Evreni' }} />
          <Stack.Screen name="StoryEditor" component={StoryEditorScreen} options={{ title: 'Hikaye' }} />
          <Stack.Screen name="ChapterEditor" component={ChapterEditorScreen} options={{ title: 'Bölüm' }} />
          <Stack.Screen name="Sessions" component={SessionsScreen} options={{ title: 'Girişler' }} />
          <Stack.Screen name="JoinPrompt" component={JoinPromptScreen} options={{ title: 'Nasıl Gireceksin?' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Hikaye' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
          <Stack.Screen name="Bots" component={BotsScreen} options={{ title: 'Karakterlerim' }} />
          <Stack.Screen name="BotEditor" component={BotEditorScreen} options={{ title: 'Karakter' }} />
          <Stack.Screen name="BotChat" component={BotChatScreen} options={{ title: 'Karakter' }} />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
