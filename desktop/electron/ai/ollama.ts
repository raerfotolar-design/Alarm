import type { ChatMessage } from '../../shared/types';
import { JARVIS_SYSTEM_PROMPT } from './persona';

interface OllamaResponse {
  message?: { content?: string };
  error?: string;
}

export async function askOllama(params: {
  baseUrl: string;
  model: string;
  history: ChatMessage[];
  userText: string;
}): Promise<string> {
  const messages = [
    { role: 'system', content: JARVIS_SYSTEM_PROMPT },
    ...params.history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: params.userText },
  ];

  let res: Response;
  try {
    res = await fetch(`${params.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: params.model, messages, stream: false }),
    });
  } catch {
    throw new Error(
      `Yerel AI'ya (${params.baseUrl}) bağlanılamadı. Ollama çalışıyor mu? Terminalden "ollama serve" ile başlatabilirsin.`,
    );
  }

  const data = (await res.json()) as OllamaResponse;

  if (!res.ok) {
    throw new Error(data.error ?? `Ollama isteği başarısız oldu (HTTP ${res.status}).`);
  }

  const text = data.message?.content ?? '';
  if (!text.trim()) throw new Error('Yerel model boş bir yanıt döndürdü.');
  return text.trim();
}
