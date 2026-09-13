import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer, TextField } from '../components/ui';
import { appendMessage, getSession } from '../storage/sessionRepository';
import { getSettings } from '../storage/settingsRepository';
import { getStory } from '../storage/storyRepository';
import { sendStoryMessage } from '../services/storyAiService';
import { ChatMessage, Story, StorySession } from '../types';
import { newId } from '../storage/storage';
import { theme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<StorySession | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const s = await getSession(sessionId);
      if (!s) return;
      setSession(s);
      const st = await getStory(s.storyId);
      setStory(st);
      navigation.setOptions({ title: st?.title ?? 'Hikaye' });
    })();
  }, [sessionId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !session || !story || pending) return;

    setDraft('');
    setPending(true);

    const userMsg: ChatMessage = { id: newId(), role: 'user', text, createdAt: new Date().toISOString() };
    await appendMessage(sessionId, userMsg);
    const historyForAi = [...session.messages, userMsg];
    setSession({ ...session, messages: historyForAi });

    const settings = await getSettings();
    let replyText: string;
    try {
      replyText = await sendStoryMessage({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        story,
        joinMode: session.joinMode,
        joinPrompt: session.joinPrompt,
        history: session.messages,
        userText: text,
      });
    } catch (err) {
      replyText = `⚠ Bir hata oldu: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`;
    }

    const aiMsg: ChatMessage = { id: newId(), role: 'ai', text: replyText, createdAt: new Date().toISOString() };
    await appendMessage(sessionId, aiMsg);
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

        {pending && <Text style={styles.thinking}>Hikaye devam ediyor...</Text>}

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder="Ne yapıyorsun / ne diyorsun?"
              multiline
            />
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
