export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Talks to whatever model backs this app over the OpenAI-compatible chat-completions
 * shape — the interface almost every open-source model server speaks (vLLM, TGI,
 * Ollama's OpenAI-compatible endpoint, and every hosted-inference provider). Point
 * `baseUrl` + `model` at your own fine-tuned model's server and nothing else in the
 * app needs to change. Shared by story chat and bot chat.
 */
export async function callChatModel(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: LlmMessage[];
}): Promise<string> {
  if (!params.baseUrl || !params.model) {
    return 'Henüz bir model sunucusu ayarlanmamış. Ayarlar bölümünden adres ve model adını gir.';
  }

  let res: Response;
  try {
    res = await fetch(`${params.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.apiKey ? { Authorization: `Bearer ${params.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: params.model, messages: params.messages }),
    });
  } catch {
    return `Model sunucusuna (${params.baseUrl}) ulaşılamadı. Adres doğru mu, sunucu ayakta mı kontrol et.`;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return `Model isteği başarısız oldu (HTTP ${res.status}). ${body.slice(0, 200)}`;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() || '...';
}
