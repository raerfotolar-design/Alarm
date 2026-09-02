import type { ChatMessage, ChatRequest, ChatResponse, JarvisMemory } from '../../shared/types';
import { getAiConfig } from '../settings';
import { askGemini } from './gemini';
import { askOllama } from './ollama';
import { JARVIS_SYSTEM_PROMPT } from './persona';
import {
  RECENT_LIMIT,
  SUMMARY_BATCH,
  buildMemoryBlock,
  buildSummaryPrompt,
  mergeMemory,
  parseSummaryReply,
  pendingForSummary,
} from './memory';

type AiConfig = Awaited<ReturnType<typeof getAiConfig>>;

async function ask(
  engine: ChatRequest['engine'],
  config: AiConfig,
  systemPrompt: string,
  history: ChatMessage[],
  userText: string,
): Promise<string> {
  if (engine === 'cloud') {
    return askGemini({
      apiKey: config.geminiApiKey,
      model: config.geminiModel,
      systemPrompt,
      history,
      userText,
    });
  }
  return askOllama({
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
    systemPrompt,
    history,
    userText,
  });
}

/**
 * Folds messages that have aged out of the prompt window into the rolling summary,
 * so nothing said on an earlier day is lost. Returns null when there is nothing to
 * do or the model's answer could not be parsed — memory then simply stays as it was.
 */
async function refreshMemory(
  engine: ChatRequest['engine'],
  config: AiConfig,
  history: ChatMessage[],
  memory: JarvisMemory,
): Promise<JarvisMemory | null> {
  const pending = pendingForSummary(history, memory);
  if (pending.length < SUMMARY_BATCH) return null;

  const raw = await ask(
    engine,
    config,
    'Sen bir konuşma özetleyicisisin. Sadece istenen JSON formatında cevap ver.',
    [],
    buildSummaryPrompt(memory.summary, pending),
  );

  const update = parseSummaryReply(raw);
  if (!update) return null;

  return mergeMemory(memory, update, pending[pending.length - 1].id);
}

export async function handleChat(request: ChatRequest): Promise<ChatResponse> {
  const config = await getAiConfig();

  if (request.engine === 'cloud' && !config.geminiApiKey) {
    return {
      ok: false,
      error: 'Efendim, henüz bir Gemini API anahtarı girmemişsin. Sol alttaki ayarlar simgesinden ekleyebilirsin.',
    };
  }

  const systemPrompt = JARVIS_SYSTEM_PROMPT + buildMemoryBlock(request.memory, request.notes);

  // Messages that have left the window but are not summarized yet are still sent verbatim,
  // otherwise they would sit in neither the prompt nor the summary and be forgotten outright.
  const recent = request.history.slice(-RECENT_LIMIT);
  const pending = pendingForSummary(request.history, request.memory);
  const promptHistory = [...pending, ...recent];

  let text: string;
  try {
    text = await ask(request.engine, config, systemPrompt, promptHistory, request.userText);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.' };
  }

  // The reply is already earned; a memory refresh failing must never lose it. Only
  // stored history is summarized — this turn is still inside the recent window and
  // gets folded in later, once it ages out.
  let memory: JarvisMemory | null = null;
  try {
    memory = await refreshMemory(request.engine, config, request.history, request.memory);
  } catch {
    memory = null;
  }

  return memory ? { ok: true, text, memory } : { ok: true, text };
}
