import type { ChatRequest, ChatResponse } from '../../shared/types';
import { getAiConfig } from '../settings';
import { askGemini } from './gemini';
import { askOllama } from './ollama';

/** Keeps prompts bounded — the last N turns are enough context for a chat reply. */
const HISTORY_LIMIT = 20;

export async function handleChat(request: ChatRequest): Promise<ChatResponse> {
  const config = await getAiConfig();
  const history = request.history.slice(-HISTORY_LIMIT);

  try {
    if (request.engine === 'cloud') {
      if (!config.geminiApiKey) {
        return {
          ok: false,
          error: 'Efendim, henüz bir Gemini API anahtarı girmemişsin. Sol alttaki ayarlar simgesinden ekleyebilirsin.',
        };
      }
      const text = await askGemini({
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
        history,
        userText: request.userText,
      });
      return { ok: true, text };
    }

    const text = await askOllama({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      history,
      userText: request.userText,
    });
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.' };
  }
}
