import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer, TextField } from '../components/ui';
import { appendBotMessage, getOrCreateSessionForBot } from '../storage/botSessionRepository';
import { getSettings } from '../storage/settingsRepository';
import { getBot } from '../storage/botRepository';
import { sendBotMessage } from '../services/botAiService';
import { Bot, BotSession, ChatMessage } from '../types';
import { newId } from '../storage/storage';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BotChat'>;

export default function BotChatScreen({ route, navigation }: Props) {
  const { botId } = route.params;
  const [bot, setBot] = useState<Bot | null>(null);
  const [session, setSession] = useState<BotSession | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const b = await getBot(botId);
      if (!b) return;
      setBot(b);
      navigation.setOptions({ title: b.name || 'Karakter' });
      const s = await getOrCreateSessionForBot(b);
      setSession(s);
    })();
  }, [botId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !bot || !session || pending) return;

    setDraft('');
    setPending(true);

    const userMsg: ChatMessage = { id: newId(), role: 'user', text, createdAt: new Date().toISOString() };
    await appendBotMessage(session.id, userMsg);
    const historyForAi = [...session.messages, userMsg];
    setSession({ ...session, messages: historyForAi });

    const settings = await getSettings();
    let replyText: string;
    try {
      replyText = await sendBotMessage({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        bot,
        history: session.messages,
        userText: text,
      });
    } catch (err) {
      replyText = `⚠ Bir hata oldu: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`;
    }

    const aiMsg: ChatMessage = { id: newId(), role: 'ai', text: replyText, createdAt: new Date().toISOString() };
    await appendBotMessage(session.id, aiMsg);
    setSession((s) => (s ? { ...s, messages: [...historyForAi, aiMsg] } : s));
    setPending(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScreenContainer>
        <FlatList
          ref={listRef}
          data={session?.messages ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
        />

        {pending && <Text style={styles.thinking}>{bot?.name ?? 'Karakter'} yazıyor...</Text>}

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <TextField value={draft} onChangeText={setDraft} placeholder="Bir şey yaz..." multiline />
          </View>
          <Pressable onPress={send} disabled={pending || !draft.trim()} style={styles.sendButton}>
            <Text style={styles.sendText}>Gönder</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.primary,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  thinking: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sendText: {
    color: theme.colors.primaryText,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
