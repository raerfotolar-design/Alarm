export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  chapters: Chapter[];
  /** Publish is local-only for now — there is no shared backend yet, so this only
   * shapes the UI (a published story gets an "enter the story" button) rather than
   * making it visible to anyone else. */
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JoinMode = 'existing_character' | 'isekai' | 'extra_character';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface StorySession {
  id: string;
  storyId: string;
  joinMode: JoinMode;
  /** The user's own words describing who they are and how they enter the story. */
  joinPrompt: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  /** An OpenRouter (or any OpenAI-compatible) API key — see src/services/storyAiService.ts. */
  apiKey: string;
  baseUrl: string;
  model: string;
}
