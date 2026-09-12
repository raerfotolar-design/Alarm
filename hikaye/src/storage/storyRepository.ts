import { Chapter, Story } from '../types';
import { getJson, newId, setJson, STORAGE_KEYS } from './storage';

export async function listStories(): Promise<Story[]> {
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  return [...stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getStory(id: string): Promise<Story | null> {
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  return stories.find((s) => s.id === id) ?? null;
}

export async function createStory(params: { title: string; description: string; genre: string }): Promise<Story> {
  const now = new Date().toISOString();
  const story: Story = {
    id: newId(),
    title: params.title,
    description: params.description,
    genre: params.genre,
    chapters: [],
    published: false,
    createdAt: now,
    updatedAt: now,
  };
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  await setJson(STORAGE_KEYS.stories, [...stories, story]);
  return story;
}

export async function updateStory(id: string, patch: Partial<Pick<Story, 'title' | 'description' | 'genre' | 'published'>>): Promise<void> {
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  const next = stories.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s));
  await setJson(STORAGE_KEYS.stories, next);
}

export async function deleteStory(id: string): Promise<void> {
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  await setJson(STORAGE_KEYS.stories, stories.filter((s) => s.id !== id));
}

export async function upsertChapter(
  storyId: string,
  chapter: { id?: string; title: string; content: string },
): Promise<Chapter> {
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  const story = stories.find((s) => s.id === storyId);
  if (!story) throw new Error('Hikaye bulunamadı.');

  const now = new Date().toISOString();
  const existing = chapter.id ? story.chapters.find((c) => c.id === chapter.id) : undefined;

  let saved: Chapter;
  let chapters: Chapter[];
  if (existing) {
    saved = { ...existing, title: chapter.title, content: chapter.content, updatedAt: now };
    chapters = story.chapters.map((c) => (c.id === saved.id ? saved : c));
  } else {
    saved = {
      id: newId(),
      title: chapter.title,
      content: chapter.content,
      order: story.chapters.length,
      createdAt: now,
      updatedAt: now,
    };
    chapters = [...story.chapters, saved];
  }

  const nextStories = stories.map((s) => (s.id === storyId ? { ...s, chapters, updatedAt: now } : s));
  await setJson(STORAGE_KEYS.stories, nextStories);
  return saved;
}

export async function deleteChapter(storyId: string, chapterId: string): Promise<void> {
  const stories = await getJson<Story[]>(STORAGE_KEYS.stories, []);
  const next = stories.map((s) =>
    s.id === storyId
      ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId), updatedAt: new Date().toISOString() }
      : s,
  );
  await setJson(STORAGE_KEYS.stories, next);
}
