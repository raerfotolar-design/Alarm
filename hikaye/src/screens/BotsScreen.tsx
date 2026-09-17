import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { EmptyState, PrimaryButton, ScreenContainer, ScreenTitle } from '../components/ui';
import { listBots } from '../storage/botRepository';
import { Bot } from '../types';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Bots'>;

export default function BotsScreen({ navigation }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);

  useFocusEffect(
    useCallback(() => {
      listBots().then(setBots);
    }, []),
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ScreenTitle>Karakterlerim</ScreenTitle>
        <Pressable onPress={() => navigation.navigate('Home')} hitSlop={12}>
          <Text style={styles.link}>Hikayeler</Text>
        </Pressable>
      </View>

      <FlatList
        data={bots}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState text={'Henüz bir karakter oluşturmadın.\nAşağıdaki butonla ilkini yarat.'} />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('BotChat', { botId: item.id })}>
            <View style={styles.cardTop}>
              <Text style={styles.avatar}>{item.avatarEmoji || '🙂'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name || 'İsimsiz karakter'}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.shortDescription || 'Açıklama yok'}
                </Text>
              </View>
              <Pressable onPress={() => navigation.navigate('BotEditor', { botId: item.id })} hitSlop={10}>
                <Text style={styles.editLink}>Düzenle</Text>
              </Pressable>
            </View>
            {item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.map((t) => (
                  <Text key={t} style={styles.tag}>
                    {t}
                  </Text>
                ))}
              </View>
            )}
          </Pressable>
        )}
      />

      <View style={styles.fab}>
        <PrimaryButton title="+ Yeni Karakter" onPress={() => navigation.navigate('BotEditor', {})} />
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
  link: {
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
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    fontSize: 30,
  },
  name: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  desc: {
    color: theme.colors.textMuted,
    fontSize: 12.5,
  },
  editLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    color: theme.colors.textMuted,
    fontSize: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  fab: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
  },
});
