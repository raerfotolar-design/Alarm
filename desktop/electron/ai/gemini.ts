import type { ChatMessage } from '../../shared/types';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

export async function askGemini(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: ChatMessage[];
  userText: string;
}): Promise<string> {
  const contents = [
    ...params.history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: params.userText }] },
  ];

  const res = await fetch(`${API_ROOT}/${params.model}:generateContent?key=${encodeURIComponent(params.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: params.systemPrompt }] },
    }),
  });

  const data = (await res.json()) as GeminiResponse;

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Gemini isteği başarısız oldu (HTTP ${res.status}).`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('Gemini boş bir yanıt döndürdü.');
  return text.trim();
}
