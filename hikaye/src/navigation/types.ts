import { JoinMode } from '../types';

export type RootStackParamList = {
  Home: undefined;
  StoryEditor: { storyId?: string };
  ChapterEditor: { storyId: string; chapterId?: string };
  Sessions: { storyId: string };
  JoinPrompt: { storyId: string };
  Chat: { sessionId: string };
  Settings: undefined;
};

export type { JoinMode };
