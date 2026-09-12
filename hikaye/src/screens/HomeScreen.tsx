import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { EmptyState, PrimaryButton, ScreenContainer, ScreenTitle } from '../components/ui';
import { listStories } from '../storage/storyRepository';
import { Story } from '../types';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [stories, setStories] = useState<Story[]>([]);

  useFocusEffect(
    useCallback(() => {
      listStories().then(setStories);
    }, []),
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ScreenTitle>Hikayelerim</ScreenTitle>
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
          <Text style={styles.settingsLink}>Ayarlar</Text>
        </Pressable>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState text={'Henüz hiç hikaye yazmadın.\nAşağıdaki butonla ilkini başlat.'} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('StoryEditor', { storyId: item.id })}
          >
            <Text style={styles.storyTitle}>{item.title || 'İsimsiz hikaye'}</Text>
            <Text style={styles.storyMeta} numberOfLines={2}>
              {item.description || 'Açıklama yok'}
            </Text>
            <View style={styles.badgeRow}>
              {item.genre ? <Text style={styles.badge}>{item.genre}</Text> : null}
              <Text style={styles.badge}>{item.chapters.length} bölüm</Text>
              {item.published && <Text style={[styles.badge, styles.badgePublished]}>Yayında</Text>}
            </View>
          </Pressable>
        )}
      />

      <View style={styles.fab}>
        <PrimaryButton title="+ Yeni Hikaye" onPress={() => navigation.navigate('StoryEditor', {})} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsLink: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  storyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  storyMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    color: theme.colors.textMuted,
    fontSize: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgePublished: {
    color: theme.colors.success,
    borderColor: theme.colors.success,
  },
  fab: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
  },
});
