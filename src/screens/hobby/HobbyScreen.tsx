import React, { useCallback, useState } from 'react';
import { View, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, Field, Chip } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { listMedia, saveMediaItem, deleteMediaItem } from '../../storage/mediaRepository';
import { lookupCoverUrl } from '../../services/mediaLookupService';
import { getSettings } from '../../storage/settingsRepository';
import { MediaItem, MediaKind, MediaStatus } from '../../types';

const KIND_LABEL: Record<MediaKind, string> = {
  movie: '🎬 Filmler',
  series: '📺 Diziler',
  anime: '🌸 Animeler',
  manga: '📚 Manga',
  book: '📖 Kitaplar',
};

const STATUS_LABEL: Record<MediaStatus, string> = {
  watchlist: 'İzlemek İstiyorum',
  in_progress: 'İzliyorum',
  done: 'İzledim',
};

function progressFieldLabel(kind: MediaKind): string | null {
  if (kind === 'series' || kind === 'anime') return 'Sezon/Bölüm (örn. S2E5)';
  if (kind === 'manga') return 'Bölüm (örn. 42)';
  if (kind === 'book') return 'Sayfa (örn. 120/400)';
  return null;
}

export default function HobbyScreen() {
  const { theme } = useAppTheme();
  const [kind, setKind] = useState<MediaKind>('movie');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tmdbApiKey, setTmdbApiKey] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<MediaStatus>('watchlist');
  const [rating, setRating] = useState('');
  const [progressLabel, setProgressLabel] = useState('');
  const [note, setNote] = useState('');
  const [savingCover, setSavingCover] = useState(false);

  const load = useCallback(async () => {
    const [list, settings] = await Promise.all([listMedia(kind, query), getSettings()]);
    setItems(list);
    setTmdbApiKey(settings.tmdbApiKey);
  }, [kind, query]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setEditing(null);
    setTitle('');
    setStatus('watchlist');
    setRating('');
    setProgressLabel('');
    setNote('');
    setModalOpen(true);
  }

  function openEdit(item: MediaItem) {
    setEditing(item);
    setTitle(item.title);
    setStatus(item.status);
    setRating(item.rating != null ? String(item.rating) : '');
    setProgressLabel(item.progressLabel);
    setNote(item.note);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSavingCover(true);
    let coverUrl = editing?.coverUrl ?? null;
    if (!coverUrl) {
      coverUrl = await lookupCoverUrl(title, kind, tmdbApiKey);
    }
    await saveMediaItem({
      id: editing?.id,
      kind,
      title,
      status,
      rating: rating ? Math.min(10, Math.max(1, parseInt(rating, 10) || 0)) : null,
      progressLabel,
      note,
      coverUrl,
    });
    setSavingCover(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete(item: MediaItem) {
    await deleteMediaItem(item.id);
    load();
  }

  const progressLabelText = progressFieldLabel(kind);

  return (
    <Screen>
      <Title>Hobi</Title>
      <Subtitle>İzlediklerin, okuduklarını, izlemek istediklerin — hepsi burada.</Subtitle>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {(Object.keys(KIND_LABEL) as MediaKind[]).map((k) => (
          <Chip key={k} label={KIND_LABEL[k]} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>

      <Field label="Ara" placeholder="Başlık veya not" value={query} onChangeText={setQuery} />
      <PrimaryButton title="+ Yeni Ekle" onPress={openNew} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => openEdit(item)} style={{ width: '48%' }}>
            <Card style={{ padding: 8 }}>
              {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 8 }} />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: 150,
                    borderRadius: 10,
                    marginBottom: 8,
                    backgroundColor: theme.colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BodyText style={{ fontSize: 28 }}>{KIND_LABEL[item.kind].split(' ')[0]}</BodyText>
                </View>
              )}
              <BodyText numberOfLines={1} style={{ fontWeight: '700' }}>
                {item.title}
              </BodyText>
              <BodyText style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                {STATUS_LABEL[item.status]}
                {item.rating ? ` · ⭐${item.rating}` : ''}
              </BodyText>
              {item.progressLabel ? (
                <BodyText style={{ color: theme.colors.primary, fontSize: 12 }}>{item.progressLabel}</BodyText>
              ) : null}
            </Card>
          </Pressable>
        ))}
      </View>
      {items.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Bu kategoride henüz bir şey yok.</BodyText> : null}

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <Title>{editing ? 'Düzenle' : 'Yeni'} — {KIND_LABEL[kind]}</Title>
          <Field label="Başlık" value={title} onChangeText={setTitle} />

          <BodyText style={{ marginBottom: 8 }}>Durum</BodyText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {(Object.keys(STATUS_LABEL) as MediaStatus[]).map((s) => (
              <Chip key={s} label={STATUS_LABEL[s]} selected={status === s} onPress={() => setStatus(s)} />
            ))}
          </View>

          <Field label="Puan (1-10)" keyboardType="number-pad" value={rating} onChangeText={setRating} />
          {progressLabelText ? <Field label={progressLabelText} value={progressLabel} onChangeText={setProgressLabel} /> : null}
          <Field label="Not" value={note} onChangeText={setNote} multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} />

          {savingCover ? <ActivityIndicator color={theme.colors.primary} style={{ marginBottom: 10 }} /> : null}
          <PrimaryButton title="Kaydet" onPress={handleSave} disabled={savingCover} />
          <PrimaryButton title="Vazgeç" variant="outline" onPress={() => setModalOpen(false)} />
          {editing ? <PrimaryButton title="Sil" variant="danger" onPress={() => { handleDelete(editing); setModalOpen(false); }} /> : null}
        </Screen>
      </Modal>
    </Screen>
  );
}
