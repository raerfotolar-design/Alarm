import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  GenerateCardsRequest,
  GenerateCardsResponse,
  JarvisMemory,
  PendingPcAction,
} from '../../shared/types';
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

import { buildCardPrompt, parseCards } from './cards';
import { PC_TOOLS_INSTRUCTION, parseAction } from '../pc/protocol';
import { describeAction, needsConfirmation, runTool } from '../pc/tools';

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

const NO_KEY_ERROR =
  'Efendim, henüz bir Gemini API anahtarı girmemişsin. Sol alttaki ayarlar simgesinden ekleyebilirsin.';

export async function handleGenerateCards(request: GenerateCardsRequest): Promise<GenerateCardsResponse> {
  const config = await getAiConfig();
  if (request.engine === 'cloud' && !config.geminiApiKey) return { ok: false, error: NO_KEY_ERROR };
  if (!request.subject.trim()) return { ok: false, error: 'Önce hangi konuda kart istediğini yaz.' };

  const count = Math.min(Math.max(request.count, 1), 20);

  try {
    const raw = await ask(
      request.engine,
      config,
      'Sen bir öğrenme kartı üreticisisin. Sadece istenen JSON formatında cevap ver.',
      [],
      buildCardPrompt(request.topic, request.subject.trim(), count),
    );
    const cards = parseCards(raw, count);
    if (cards.length === 0) return { ok: false, error: 'Model geçerli kart üretemedi, tekrar dene.' };
    return { ok: true, cards };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Kartlar üretilemedi.' };
  }
}

export async function handleChat(request: ChatRequest): Promise<ChatResponse> {
  const config = await getAiConfig();

  if (request.engine === 'cloud' && !config.geminiApiKey) {
    return { ok: false, error: NO_KEY_ERROR };
  }

  const systemPrompt =
    JARVIS_SYSTEM_PROMPT +
    buildMemoryBlock(request.memory, request.notes) +
    (config.pcControlEnabled ? PC_TOOLS_INSTRUCTION : '');

  // Messages that have left the window but are not summarized yet are still sent verbatim,
  // otherwise they would sit in neither the prompt nor the summary and be forgotten outright.
  const recent = request.history.slice(-RECENT_LIMIT);
  const pending = pendingForSummary(request.history, request.memory);
  const promptHistory = [...pending, ...recent];

  let raw: string;
  try {
    raw = await ask(request.engine, config, systemPrompt, promptHistory, request.userText);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.' };
  }

  let text = raw;
  let pendingAction: PendingPcAction | undefined;

  if (config.pcControlEnabled) {
    const parsed = parseAction(raw);
    text = parsed.text;

    if (parsed.action) {
      if (needsConfirmation(parsed.action.tool)) {
        // Anything that writes, deletes or executes waits for the user.
        pendingAction = {
          id: `action-${Date.now()}`,
          tool: parsed.action.tool,
          args: parsed.action.args,
          description: describeAction(parsed.action.tool, parsed.action.args),
        };
      } else {
        // Read-only actions run now, and the result goes back for a natural reply.
        let toolOutput: string;
        try {
          toolOutput = await runTool(parsed.action.tool, parsed.action.args);
        } catch (err) {
          toolOutput = `Hata: ${err instanceof Error ? err.message : 'işlem başarısız oldu'}`;
        }

        try {
          text = await ask(
            request.engine,
            config,
            JARVIS_SYSTEM_PROMPT,
            [...promptHistory, { id: 'tool-turn', role: 'user', text: request.userText, createdAt: '' }],
            `Bilgisayarda "${describeAction(parsed.action.tool, parsed.action.args)}" işlemini yaptın. Sonuç:\n\n${toolOutput}\n\nBu sonucu kullanıcıya kısaca, kendi üslubunla anlat. JSON ekleme.`,
          );
        } catch {
          text = `${text ? `${text}\n\n` : ''}${toolOutput}`.trim();
        }
      }
    }
  }

  if (!text.trim()) text = pendingAction ? 'Bunu yapmam için onayın gerekiyor efendim.' : '...';

  // The reply is already earned; a memory refresh failing must never lose it. Only
  // stored history is summarized — this turn is still inside the recent window and
  // gets folded in later, once it ages out.
  let memory: JarvisMemory | null = null;
  try {
    memory = await refreshMemory(request.engine, config, request.history, request.memory);
  } catch {
    memory = null;
  }

  return { ok: true, text, ...(memory ? { memory } : {}), ...(pendingAction ? { pendingAction } : {}) };
}
