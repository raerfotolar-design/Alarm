import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PrimaryButton, ScreenContainer, ScreenTitle, TextField } from '../components/ui';
import { createSession } from '../storage/sessionRepository';
import { JoinMode } from '../types';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinPrompt'>;

const MODES: { value: JoinMode; label: string; hint: string }[] = [
  {
    value: 'existing_character',
    label: 'Var olan bir karakter olarak',
    hint: 'Hikayende zaten yazdığın bir karakterin yerine geç.',
  },
  {
    value: 'isekai',
    label: 'İsekai — dışarıdan düşerek',
    hint: 'Kendi kimliğinle, hikayenin dünyasına aniden dahil ol.',
  },
  {
    value: 'extra_character',
    label: 'Yeni, ekstra bir karakter olarak',
    hint: 'Hikayede hiç olmayan tamamen yeni birini yarat.',
  },
];

export default function JoinPromptScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const [joinMode, setJoinMode] = useState<JoinMode>('isekai');
  const [joinPrompt, setJoinPrompt] = useState('');
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    const session = await createSession({ storyId, joinMode, joinPrompt: joinPrompt.trim() });
    setStarting(false);
    navigation.replace('Chat', { sessionId: session.id });
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Hikayeye Nasıl Gireceksin?</ScreenTitle>

      <View style={{ gap: 10, marginBottom: 18 }}>
        {MODES.map((m) => {
          const selected = joinMode === m.value;
          return (
            <Pressable
              key={m.value}
              onPress={() => setJoinMode(m.value)}
              style={[styles.modeCard, selected && styles.modeCardSelected]}
            >
              <Text style={[styles.modeLabel, selected && { color: theme.colors.primary }]}>{m.label}</Text>
              <Text style={styles.modeHint}>{m.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Kendini ve girişini anlat"
        value={joinPrompt}
        onChangeText={setJoinPrompt}
        placeholder="örn. 22 yaşında bir dedektifim, gücüm yok ama gözlem yeteneğim çok iyi. Hikayenin ikinci bölümünün ortasında, kasabaya yeni gelmiş biri olarak dahil olmak istiyorum."
        multiline
        numberOfLines={5}
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />

      <PrimaryButton
        title={starting ? 'Başlıyor...' : 'Hikayeye Gir'}
        onPress={start}
        loading={starting}
        disabled={!joinPrompt.trim()}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  modeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceAlt,
  },
  modeLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  modeHint: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
