import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton, ScreenContainer, TextField } from '../components/ui';
import { getStory, upsertChapter } from '../storage/storyRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'ChapterEditor'>;

export default function ChapterEditorScreen({ route, navigation }: Props) {
  const { storyId, chapterId } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!chapterId) return;
      const story = await getStory(storyId);
      const chapter = story?.chapters.find((c) => c.id === chapterId);
      if (chapter) {
        setTitle(chapter.title);
        setContent(chapter.content);
      }
    })();
  }, [storyId, chapterId]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Başlık gerekli', 'Bölümün bir adı olmalı.');
      return;
    }
    setSaving(true);
    await upsertChapter(storyId, { id: chapterId, title, content });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <TextField label="Bölüm Başlığı" value={title} onChangeText={setTitle} placeholder="örn. Fırtınadan Önce" />
      <TextField
        label="Metin"
        value={content}
        onChangeText={setContent}
        placeholder="Bölümü buraya yaz..."
        multiline
        style={{ minHeight: 340, textAlignVertical: 'top' }}
      />
      <PrimaryButton title={saving ? 'Kaydediliyor...' : 'Bölümü Kaydet'} onPress={save} loading={saving} />
    </ScreenContainer>
  );
}
