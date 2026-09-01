import React, { useCallback, useState } from 'react';
import { View, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, Field, Chip } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { listStories, listSongs, listNotes, saveStory, saveSong, saveNote, deleteItem } from '../../storage/creativeRepository';
import { exportTextAsFile } from '../../services/exportService';
import { playSound } from '../../services/audio';
import { getRhymes, continueWriting } from '../../services/jarvisService';
import { getSettings } from '../../storage/settingsRepository';
import { Story, Song, Note } from '../../types';

type Kind = 'stories' | 'songs' | 'notes';
type Item = (Story | Song | Note) & { content?: string; lyrics?: string; voiceUri?: string | null };

const KIND_LABEL: Record<Kind, string> = { stories: '📖 Hikayeler', songs: '🎵 Şarkı Sözleri', notes: '🗒️ Notlar' };

function getBody(kind: Kind, item: Item): string {
  if (kind === 'songs') return item.lyrics ?? '';
  return item.content ?? '';
}

export default function CreativeScreen() {
  const { theme } = useAppTheme();
  const [kind, setKind] = useState<Kind>('stories');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [rhymeWord, setRhymeWord] = useState('');
  const [rhymes, setRhymes] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const load = useCallback(async () => {
    const q = query;
    if (kind === 'stories') setItems((await listStories(q)) as Item[]);
    if (kind === 'songs') setItems((await listSongs(q)) as Item[]);
    if (kind === 'notes') setItems((await listNotes(q)) as Item[]);
    setApiKey((await getSettings()).geminiApiKey);
  }, [kind, query]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setEditing(null);
    setTitle('');
    setBody('');
    setVoiceUri(null);
    setRhymes([]);
    setRhymeWord('');
    setShowHistory(false);
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setTitle(item.title);
    setBody(getBody(kind, item));
    setVoiceUri((item as Note).voiceUri ?? null);
    setRhymes([]);
    setRhymeWord('');
    setShowHistory(false);
    setModalOpen(true);
  }

  async function handleFindRhymes() {
    if (!rhymeWord.trim() || !apiKey) return;
    setBusyAction(true);
    setRhymes(await getRhymes(apiKey, rhymeWord));
    setBusyAction(false);
  }

  async function handleContinueWriting() {
    if (!apiKey || !body.trim()) return;
    setBusyAction(true);
    const continuation = await continueWriting(apiKey, body, kind === 'songs' ? 'song' : 'story');
    setBody((prev) => `${prev}\n${continuation}`);
    setBusyAction(false);
  }

  async function handleSave() {
    if (!title.trim()) return;
    if (kind === 'stories') await saveStory({ id: editing?.id, title, content: body, tags: editing?.tags ?? [] });
    if (kind === 'songs') await saveSong({ id: editing?.id, title, lyrics: body, tags: editing?.tags ?? [] });
    if (kind === 'notes') await saveNote({ id: editing?.id, title, content: body, tags: editing?.tags ?? [], voiceUri });
    setModalOpen(false);
    load();
  }

  async function handleDelete(item: Item) {
    await deleteItem(kind, item.id);
    load();
  }

  async function handleExport(item: Item) {
    await exportTextAsFile(item.title, getBody(kind, item));
  }

  async function toggleVoiceNote() {
    if (isRecording) {
      await recorder.stop();
      setVoiceUri(recorder.uri ?? null);
      setIsRecording(false);
    } else {
      await AudioModule.requestRecordingPermissionsAsync();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    }
  }

  return (
    <Screen>
      <Title>Yaratıcılık</Title>
      <Subtitle>Hikayeler, şarkı sözleri ve notların — hepsi telefonunda güvende.</Subtitle>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <Chip key={k} label={KIND_LABEL[k]} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>

      <Field label="Ara" placeholder="Başlık, içerik veya etiket" value={query} onChangeText={setQuery} />
      <PrimaryButton title="+ Yeni" onPress={openNew} />

      {items.map((item) => (
        <Card key={item.id}>
          <Pressable onPress={() => openEdit(item)}>
            <BodyText style={{ fontWeight: '700', marginBottom: 4 }}>{item.title}</BodyText>
            <BodyText style={{ color: theme.colors.textMuted }} numberOfLines={2}>
              {getBody(kind, item)}
            </BodyText>
          </Pressable>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <PrimaryButton title="Paylaş / Dışa Aktar" variant="outline" onPress={() => handleExport(item)} style={{ marginBottom: 0 }} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Sil" variant="danger" onPress={() => handleDelete(item)} style={{ marginBottom: 0 }} />
            </View>
          </View>
        </Card>
      ))}
      {items.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Henüz bir şey yok.</BodyText> : null}

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <Title>{editing ? 'Düzenle' : 'Yeni'} — {KIND_LABEL[kind]}</Title>
          <Field label="Başlık" value={title} onChangeText={setTitle} />
          <Field
            label={kind === 'songs' ? 'Söz' : 'İçerik'}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={10}
            style={{ minHeight: 180, textAlignVertical: 'top' }}
          />
          <BodyText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: -8, marginBottom: 12 }}>
            {body.trim() ? body.trim().split(/\s+/).length : 0} kelime · {body.length} karakter
          </BodyText>

          {(kind === 'songs' || kind === 'stories') && apiKey ? (
            <PrimaryButton
              title="✍️ Jarvis'e Devam Ettir"
              variant="outline"
              onPress={handleContinueWriting}
              disabled={busyAction || !body.trim()}
            />
          ) : null}

          {kind === 'songs' && apiKey ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="🤖 Kafiye bul (kelime yaz)" value={rhymeWord} onChangeText={setRhymeWord} />
                </View>
                <PrimaryButton title="Bul" onPress={handleFindRhymes} disabled={busyAction} style={{ marginBottom: 14 }} />
              </View>
              {busyAction ? <ActivityIndicator color={theme.colors.primary} /> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {rhymes.map((r) => (
                  <Chip key={r} label={r} onPress={() => setBody((prev) => `${prev} ${r}`)} />
                ))}
              </View>
            </View>
          ) : null}

          {kind === 'notes' ? (
            <View style={{ marginBottom: 16 }}>
              <PrimaryButton
                title={isRecording ? '⏹️ Kaydı durdur' : voiceUri ? '🎙️ Yeniden kaydet' : '🎙️ Sesli not ekle'}
                variant="outline"
                onPress={toggleVoiceNote}
              />
              {voiceUri && !isRecording ? (
                <PrimaryButton title="▶️ Sesli notu dinle" variant="outline" onPress={() => playSound(voiceUri)} />
              ) : null}
            </View>
          ) : null}

          {editing && editing.history.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <PrimaryButton title={showHistory ? 'Geçmişi Gizle' : `📜 Geçmiş Sürümler (${editing.history.length})`} variant="outline" onPress={() => setShowHistory((v) => !v)} />
              {showHistory
                ? editing.history.map((h, i) => (
                    <Card key={i}>
                      <BodyText style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 6 }}>
                        {new Date(h.savedAt).toLocaleString('tr-TR')}
                      </BodyText>
                      <BodyText numberOfLines={3} style={{ marginBottom: 8 }}>{h.content}</BodyText>
                      <PrimaryButton title="Bu sürüme dön" variant="outline" onPress={() => { setBody(h.content); setShowHistory(false); }} style={{ marginBottom: 0 }} />
                    </Card>
                  ))
                : null}
            </View>
          ) : null}

          <PrimaryButton title="Kaydet" onPress={handleSave} />
          <PrimaryButton title="Vazgeç" variant="outline" onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>
    </Screen>
  );
}
