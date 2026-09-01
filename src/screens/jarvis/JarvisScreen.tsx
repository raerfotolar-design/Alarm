import React, { useCallback, useRef, useState } from 'react';
import { View, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, Field } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { listChatMessages, appendChatMessage, clearChat } from '../../storage/jarvisRepository';
import { sendJarvisMessage, describeImage } from '../../services/jarvisService';
import { getSettings } from '../../storage/settingsRepository';
import { JarvisChatMessage } from '../../types';

export default function JarvisScreen() {
  const { theme } = useAppTheme();
  const [messages, setMessages] = useState<JarvisChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    const [msgs, settings] = await Promise.all([listChatMessages(), getSettings()]);
    setMessages(msgs);
    setApiKey(settings.geminiApiKey);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSend() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput('');
    setBusy(true);
    await appendChatMessage('user', text);
    const history = await listChatMessages();
    setMessages(history);
    scrollRef.current?.scrollToEnd({ animated: true });

    try {
      const reply = await sendJarvisMessage({ apiKey, history: history.slice(0, -1), userText: text });
      await appendChatMessage('model', reply.text);
    } catch (error: any) {
      await appendChatMessage('model', `Bir hata oldu efendim: ${error?.message ?? error}`);
    }
    const updated = await listChatMessages();
    setMessages(updated);
    setBusy(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function openCamera() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setCameraOpen(true);
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.6 });
    setCameraOpen(false);
    if (!photo?.uri) return;

    setBusy(true);
    await appendChatMessage('user', 'Bu ne?', photo.uri);
    setMessages(await listChatMessages());

    try {
      const file = new File(photo.uri);
      const base64 = await file.base64();
      const description = await describeImage({ apiKey, imageBase64: base64, imageMimeType: 'image/jpeg' });
      await appendChatMessage('model', description);
    } catch (error: any) {
      await appendChatMessage('model', `Görseli işleyemedim efendim: ${error?.message ?? error}`);
    }
    setMessages(await listChatMessages());
    setBusy(false);
  }

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Title>Jarvis</Title>
        {!apiKey ? (
          <Subtitle>Ayarlar'dan Gemini API anahtarını girmelisin.</Subtitle>
        ) : (
          <Subtitle>Günaydın efendim, ne yapmamı istersin?</Subtitle>
        )}
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 20 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
        {messages.map((m) => (
          <Card
            key={m.id}
            style={{
              backgroundColor: m.role === 'user' ? theme.colors.primary : theme.colors.surfaceAlt,
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <BodyText style={{ color: m.role === 'user' ? theme.colors.primaryText : theme.colors.text }}>{m.text}</BodyText>
          </Card>
        ))}
        {busy ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 10 }} /> : null}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="" placeholder="Jarvis'e yaz..." value={input} onChangeText={setInput} />
          </View>
          <PrimaryButton title="📷" onPress={openCamera} style={{ marginBottom: 14, marginRight: 8, paddingHorizontal: 14 }} />
          <PrimaryButton title="Gönder" onPress={handleSend} disabled={busy} style={{ marginBottom: 14 }} />
        </View>
        <PrimaryButton
          title="Sohbeti temizle"
          variant="outline"
          onPress={async () => {
            await clearChat();
            setMessages([]);
          }}
        />
      </View>

      <Modal visible={cameraOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
          <View style={{ padding: 20 }}>
            <PrimaryButton title="📸 Çek ve sor: bu ne?" onPress={handleCapture} />
            <PrimaryButton title="Kapat" variant="outline" onPress={() => setCameraOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
