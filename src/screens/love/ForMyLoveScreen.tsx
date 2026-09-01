import React, { useCallback, useState } from 'react';
import { View, Modal, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, Field, Chip } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { getSettings } from '../../storage/settingsRepository';
import LockGateScreen from '../settings/LockGateScreen';
import {
  listLoveNotes,
  saveLoveNote,
  deleteLoveNote,
  listSpecialDates,
  saveSpecialDate,
  deleteSpecialDate,
  listBucketItems,
  addBucketItem,
  toggleBucketItem,
  deleteBucketItem,
} from '../../storage/loveRepository';
import { scheduleSpecialDateReminder, cancelNotificationsByIds } from '../../services/notifications';
import { LoveNote, SpecialDate, BucketListItem } from '../../types';

type Section = 'notes' | 'dates' | 'bucket';

function daysUntil(dateIso: string): number {
  const now = new Date();
  const target = new Date(dateIso);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ForMyLoveContent() {
  const { theme } = useAppTheme();
  const [section, setSection] = useState<Section>('notes');

  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LoveNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const [dates, setDates] = useState<SpecialDate[]>([]);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState('');
  const [dateValue, setDateValue] = useState('');

  const [bucket, setBucket] = useState<BucketListItem[]>([]);
  const [bucketInput, setBucketInput] = useState('');

  const load = useCallback(async () => {
    setNotes(await listLoveNotes());
    setDates(await listSpecialDates());
    setBucket(await listBucketItems());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNewNote() {
    setEditing(null);
    setTitle('');
    setContent('');
    setPhotoUris([]);
    setModalOpen(true);
  }

  function openEditNote(note: LoveNote) {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setPhotoUris(note.photoUris);
    setModalOpen(true);
  }

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function handleSaveNote() {
    if (!title.trim()) return;
    await saveLoveNote({ id: editing?.id, title, content, photoUris });
    setModalOpen(false);
    load();
  }

  async function handleSaveDate() {
    if (!dateLabel.trim() || !dateValue) return;
    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) return;
    const notificationId = await scheduleSpecialDateReminder(parsed, dateLabel);
    await saveSpecialDate({
      label: dateLabel,
      date: parsed.toISOString(),
      remindDaysBefore: 0,
      notificationIds: notificationId ? [notificationId] : [],
    });
    setDateLabel('');
    setDateValue('');
    setDateModalOpen(false);
    load();
  }

  async function handleDeleteDate(item: SpecialDate) {
    await cancelNotificationsByIds(item.notificationIds);
    await deleteSpecialDate(item.id);
    load();
  }

  async function handleAddBucketItem() {
    if (!bucketInput.trim()) return;
    await addBucketItem(bucketInput.trim());
    setBucketInput('');
    load();
  }

  return (
    <Screen>
      <Title>💜 For My Love</Title>
      <Subtitle>Sadece ikinize özel bir köşe.</Subtitle>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Chip label="Notlar & Anılar" selected={section === 'notes'} onPress={() => setSection('notes')} />
        <Chip label="Özel Günler" selected={section === 'dates'} onPress={() => setSection('dates')} />
        <Chip label="Bucket List" selected={section === 'bucket'} onPress={() => setSection('bucket')} />
      </View>

      {section === 'notes' ? (
        <>
          <PrimaryButton title="+ Yeni Anı" onPress={openNewNote} />
          {notes.map((note) => (
            <Card key={note.id}>
              <Pressable onPress={() => openEditNote(note)}>
                <BodyText style={{ fontWeight: '700', marginBottom: 4 }}>{note.title}</BodyText>
                <BodyText style={{ color: theme.colors.textMuted }} numberOfLines={2}>
                  {note.content}
                </BodyText>
                {note.photoUris.length > 0 ? (
                  <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                    {note.photoUris.slice(0, 3).map((uri) => (
                      <Image key={uri} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 6 }} />
                    ))}
                  </View>
                ) : null}
              </Pressable>
              <PrimaryButton title="Sil" variant="danger" onPress={() => deleteLoveNote(note.id).then(load)} style={{ marginTop: 10, marginBottom: 0 }} />
            </Card>
          ))}
          {notes.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Henüz bir anı eklenmedi.</BodyText> : null}
        </>
      ) : null}

      {section === 'dates' ? (
        <>
          <PrimaryButton title="+ Özel Gün Ekle" onPress={() => setDateModalOpen(true)} />
          {dates.map((d) => (
            <Card key={d.id}>
              <BodyText style={{ fontWeight: '700' }}>{d.label}</BodyText>
              <BodyText style={{ color: theme.colors.primary }}>
                {daysUntil(d.date) >= 0 ? `${daysUntil(d.date)} gün kaldı` : `${Math.abs(daysUntil(d.date))} gün önceydi`}
              </BodyText>
              <PrimaryButton title="Sil" variant="danger" onPress={() => handleDeleteDate(d)} style={{ marginTop: 10, marginBottom: 0 }} />
            </Card>
          ))}
          {dates.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Henüz özel bir gün eklenmedi.</BodyText> : null}
        </>
      ) : null}

      {section === 'bucket' ? (
        <>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Field label="Yeni hedef" value={bucketInput} onChangeText={setBucketInput} placeholder="Örn. Kapadokya'ya gitmek" />
            </View>
          </View>
          <PrimaryButton title="Ekle" onPress={handleAddBucketItem} />
          {bucket.map((item) => (
            <Card key={item.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable onPress={() => toggleBucketItem(item.id).then(load)} style={{ flex: 1 }}>
                  <BodyText style={{ textDecorationLine: item.done ? 'line-through' : 'none', color: item.done ? theme.colors.textMuted : theme.colors.text }}>
                    {item.done ? '✅ ' : '⬜ '}
                    {item.title}
                  </BodyText>
                </Pressable>
                <PrimaryButton title="Sil" variant="danger" onPress={() => deleteBucketItem(item.id).then(load)} style={{ marginBottom: 0 }} />
              </View>
            </Card>
          ))}
          {bucket.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Liste boş.</BodyText> : null}
        </>
      ) : null}

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <Title>{editing ? 'Anıyı Düzenle' : 'Yeni Anı'}</Title>
          <Field label="Başlık" value={title} onChangeText={setTitle} />
          <Field label="İçerik" value={content} onChangeText={setContent} multiline numberOfLines={6} style={{ minHeight: 120, textAlignVertical: 'top' }} />
          <PrimaryButton title="📷 Fotoğraf Ekle" variant="outline" onPress={addPhoto} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {photoUris.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: 70, height: 70, borderRadius: 10, marginRight: 8, marginBottom: 8 }} />
            ))}
          </View>
          <PrimaryButton title="Kaydet" onPress={handleSaveNote} />
          <PrimaryButton title="Vazgeç" variant="outline" onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>

      <Modal visible={dateModalOpen} animationType="slide" onRequestClose={() => setDateModalOpen(false)}>
        <Screen>
          <Title>Özel Gün Ekle</Title>
          <Field label="Ne için? (örn. Yıldönümümüz)" value={dateLabel} onChangeText={setDateLabel} />
          <Field label="Tarih (YYYY-AA-GG)" placeholder="2026-10-15" value={dateValue} onChangeText={setDateValue} />
          <PrimaryButton title="Kaydet" onPress={handleSaveDate} />
          <PrimaryButton title="Vazgeç" variant="outline" onPress={() => setDateModalOpen(false)} />
        </Screen>
      </Modal>
    </Screen>
  );
}

export default function ForMyLoveScreen() {
  const [pinHash, setPinHash] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getSettings().then((settings) => {
        if (!active) return;
        setPinHash(settings.pinHash);
        setBiometricEnabled(settings.biometricEnabled);
        setLoading(false);
      });
      return () => {
        active = false;
        setUnlocked(false);
      };
    }, [])
  );

  if (loading) return null;
  if (pinHash && !unlocked) {
    return <LockGateScreen pinHash={pinHash} biometricEnabled={biometricEnabled} onUnlock={() => setUnlocked(true)} />;
  }
  return <ForMyLoveContent />;
}
