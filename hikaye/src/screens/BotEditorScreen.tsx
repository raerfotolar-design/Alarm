import React, { useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton, ScreenContainer, ScreenTitle, TextField } from '../components/ui';
import { createBot, deleteBot, getBot, updateBot } from '../storage/botRepository';
import { Bot } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BotEditor'>;

export default function BotEditorScreen({ route, navigation }: Props) {
  const { botId } = route.params;
  const [bot, setBot] = useState<Bot | null>(null);
  const [name, setName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🙂');
  const [shortDescription, setShortDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [greeting, setGreeting] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!botId) return;
    const b = await getBot(botId);
    if (b) {
      setBot(b);
      setName(b.name);
      setAvatarEmoji(b.avatarEmoji);
      setShortDescription(b.shortDescription);
      setPersonality(b.personality);
      setGreeting(b.greeting);
      setTagsText(b.tags.join(', '));
    }
  }, [botId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('İsim gerekli', 'Karakterin bir adı olmalı.');
      return;
    }
    setSaving(true);
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = { name: name.trim(), avatarEmoji: avatarEmoji.trim() || '🙂', shortDescription, personality, greeting, tags };
    if (bot) {
      await updateBot(bot.id, payload);
    } else {
      await createBot(payload);
    }
    setSaving(false);
    navigation.goBack();
  };

  const remove = () => {
    if (!bot) return;
    Alert.alert('Karakteri sil', 'Bu karakter ve sohbet geçmişi silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteBot(bot.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ScreenTitle>{bot ? 'Karakteri Düzenle' : 'Yeni Karakter'}</ScreenTitle>

        <TextField label="Emoji / Avatar" value={avatarEmoji} onChangeText={setAvatarEmoji} placeholder="🙂" />
        <TextField label="İsim" value={name} onChangeText={setName} placeholder="Karakterin adı" />
        <TextField
          label="Kısa Açıklama"
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder="Kart üzerinde görünecek kısa tanıtım"
          multiline
          numberOfLines={2}
          style={{ minHeight: 60, textAlignVertical: 'top' }}
        />
        <TextField
          label="Kişilik / Nasıl Davranır"
          value={personality}
          onChangeText={setPersonality}
          placeholder="Karakterin konuşma tarzı, kişiliği, geçmişi, ilişkileri..."
          multiline
          numberOfLines={6}
          style={{ minHeight: 140, textAlignVertical: 'top' }}
        />
        <TextField
          label="Açılış Mesajı"
          value={greeting}
          onChangeText={setGreeting}
          placeholder="Sohbet açıldığında karakterin söyleyeceği ilk söz"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <TextField
          label="Etiketler (virgülle ayır)"
          value={tagsText}
          onChangeText={setTagsText}
          placeholder="örn. fantastik, komik, dedektif"
        />

        <PrimaryButton title={saving ? 'Kaydediliyor...' : 'Kaydet'} onPress={save} loading={saving} />

        {bot && (
          <PrimaryButton title="Karakteri Sil" variant="danger" onPress={remove} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
