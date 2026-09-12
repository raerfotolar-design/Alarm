import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { EmptyState, PrimaryButton, ScreenContainer, ScreenTitle } from '../components/ui';
import { deleteSession, listSessionsForStory } from '../storage/sessionRepository';
import { StorySession } from '../types';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Sessions'>;

const JOIN_MODE_LABEL: Record<StorySession['joinMode'], string> = {
  existing_character: 'Var olan karakter',
  isekai: 'İsekai (dışarıdan düşme)',
  extra_character: 'Ekstra karakter',
};

export default function SessionsScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const [sessions, setSessions] = useState<StorySession[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSessionsForStory(storyId).then(setSessions);
    }, [storyId]),
  );

  const removeSession = (id: string) => {
    Alert.alert('Bu girişi sil', 'Bu rol yapma oturumu silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          setSessions(await listSessionsForStory(storyId));
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Hikayeye Girişlerin</ScreenTitle>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState text={'Henüz bu hikayeye girmedin.\nAşağıdan yeni bir giriş başlat.'} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Chat', { sessionId: item.id })}
            onLongPress={() => removeSession(item.id)}
          >
            <Text style={styles.mode}>{JOIN_MODE_LABEL[item.joinMode]}</Text>
            <Text style={styles.prompt} numberOfLines={2}>
              {item.joinPrompt}
            </Text>
            <Text style={styles.meta}>{item.messages.length} mesaj</Text>
          </Pressable>
        )}
      />

      <PrimaryButton title="+ Yeni Giriş" onPress={() => navigation.navigate('JoinPrompt', { storyId })} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  mode: {
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  prompt: {
    color: theme.colors.text,
    fontSize: 13.5,
    marginBottom: 6,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
});
