import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton, ScreenContainer, TextField } from '../components/ui';
import {
  createStory,
  deleteChapter,
  deleteStory,
  getStory,
  updateStory,
} from '../storage/storyRepository';
import { Story } from '../types';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StoryEditor'>;

export default function StoryEditorScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const [story, setStory] = useState<Story | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!storyId) return;
    const s = await getStory(storyId);
    if (s) {
      setStory(s);
      setTitle(s.title);
      setDescription(s.description);
      setGenre(s.genre);
    }
  }, [storyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Başlık gerekli', 'Hikayenin bir adı olmalı.');
      return;
    }
    setSaving(true);
    if (story) {
      await updateStory(story.id, { title, description, genre });
      await load();
    } else {
      const created = await createStory({ title, description, genre });
      navigation.setParams({ storyId: created.id });
      setStory(created);
    }
    setSaving(false);
  };

  const togglePublish = async (value: boolean) => {
    if (!story) return;
    await updateStory(story.id, { published: value });
    await load();
  };

  const removeStory = () => {
    if (!story) return;
    Alert.alert('Hikayeyi sil', 'Bu hikaye ve tüm bölümleri silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteStory(story.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const removeChapter = (chapterId: string) => {
    if (!story) return;
    Alert.alert('Bölümü sil', 'Bu bölüm silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteChapter(story.id, chapterId);
          await load();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <FlatList
        ListHeaderComponent={
          <View style={{ gap: 4 }}>
            <TextField label="Başlık" value={title} onChangeText={setTitle} placeholder="Hikayenin adı" />
            <TextField
              label="Tür"
              value={genre}
              onChangeText={setGenre}
              placeholder="örn. fantastik, aksiyon, romantik"
            />
            <TextField
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              placeholder="Kısaca ne anlatıyor?"
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <PrimaryButton title={saving ? 'Kaydediliyor...' : 'Kaydet'} onPress={save} loading={saving} />

            {story && (
              <View style={styles.publishRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.publishTitle}>Yayınla</Text>
                  <Text style={styles.publishHint}>
                    Yayınlanan hikayeye "içine gir" ile AI'yla rol yapabilirsin.
                  </Text>
                </View>
                <Switch
                  value={story.published}
                  onValueChange={togglePublish}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                />
              </View>
            )}

            {story?.published && (
              <PrimaryButton
                title="Hikayenin İçine Gir"
                variant="outline"
                onPress={() => navigation.navigate('Sessions', { storyId: story.id })}
              />
            )}

            {story && (
              <Text style={styles.chaptersTitle}>Bölümler ({story.chapters.length})</Text>
            )}
          </View>
        }
        data={story ? [...story.chapters].sort((a, b) => a.order - b.order) : []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 140 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.chapterCard}
            onPress={() => navigation.navigate('ChapterEditor', { storyId: story!.id, chapterId: item.id })}
            onLongPress={() => removeChapter(item.id)}
          >
            <Text style={styles.chapterTitle}>{item.title || 'İsimsiz bölüm'}</Text>
            <Text style={styles.chapterPreview} numberOfLines={2}>
              {item.content || '(boş)'}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          story ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <PrimaryButton
                title="+ Bölüm Ekle"
                variant="outline"
                onPress={() => navigation.navigate('ChapterEditor', { storyId: story.id })}
              />
              <PrimaryButton title="Hikayeyi Sil" variant="danger" onPress={removeStory} />
            </View>
          ) : undefined
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  publishTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 3,
  },
  publishHint: {
    color: theme.colors.textMuted,
    fontSize: 11.5,
  },
  chaptersTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  chapterCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  chapterTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  chapterPreview: {
    color: theme.colors.textMuted,
    fontSize: 12.5,
  },
});
