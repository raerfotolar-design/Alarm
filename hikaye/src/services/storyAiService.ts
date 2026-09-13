import { ChatMessage, JoinMode, Story } from '../types';

const JOIN_MODE_LABEL: Record<JoinMode, string> = {
  existing_character: 'hikayede zaten var olan bir karakter olarak',
  isekai: "hikayenin dünyasına dışarıdan aniden düşen (isekai) biri olarak",
  extra_character: 'hikayeye tamamen yeni, ekstra bir karakter olarak',
};

/**
 * The content line every session ships with: mature fiction (violence, peril, dark
 * themes) is fine — that's what most original fiction needs — but this is not an
 * unmoderated NSFW generator. Real-world harm, sexual content involving minors, and
 * explicit pornographic detail are refused regardless of how the story is framed.
 */
const CONTENT_BOUNDARY = `İçerik sınırların:
- Kurgusal şiddet, gerilim, karanlık temalar, ölüm, dram — bunlar hikaye anlatımının normal bir parçası, kaçınma.
- Yetişkin temalar (romantik/cinsel gerilim) ima edilebilir ama açık/pornografik ayrıntıya girme; sahneyi kapıyı kapatır gibi bir noktada kes.
- Reşit olmayan bir karakterle cinsel içerik ASLA yazma, hikaye nasıl kurgulanırsa kurgulansın.
- Gerçek dünyada birine zarar verecek talimatlar (silah yapımı, gerçek kişiye yönelik taciz vb.) hikaye içinde bile olsa üretme.
Bunların dışında yazarın hayal gücünü kısıtlama.`;

function buildSystemInstruction(story: Story, joinMode: JoinMode, joinPrompt: string): string {
  const chapters = story.chapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c, i) => `Bölüm ${i + 1} — ${c.title}\n${c.content}`)
    .join('\n\n');

  return `Sen interaktif bir kurgu anlatıcısısın. Kullanıcının kendi yazdığı "${story.title}" adlı hikayenin içinde onunla birlikte rol yapıyorsun.

Hikayenin tam metni:
"""
${chapters || '(Bu hikayede henüz bölüm yok — kullanıcıyla birlikte sıfırdan kurun.)'}
"""

Kullanıcı bu hikayeye ${JOIN_MODE_LABEL[joinMode]} dahil oluyor. Kendi tarifi:
"${joinPrompt}"

Görevin:
- Hikayenin tonunu, karakterlerini ve dünyasının kurallarını (güç dengesi, ilişkiler, geçmiş olaylar) tutarlı tutmak.
- Kullanıcının girişini hikayeye doğal bir şekilde işlemek — aniden ışınlanmış gibi değil, sahne içinde mantıklı bir şekilde.
- Rol yapan karakterler olarak cevap ver, üçüncü şahıs anlatıcı gibi de yazabilirsin ama kullanıcıyı pasif izleyici bırakma — ona söz hakkı, seçim anları ver.
- Türkçe yaz, hikayenin türüne uygun bir üslupla.

${CONTENT_BOUNDARY}`;
}

/**
 * Talks to whatever model backs this app over the OpenAI-compatible chat-completions
 * shape — the interface almost every open-source model server speaks (vLLM, TGI,
 * Ollama's OpenAI-compatible endpoint, and every hosted-inference provider). Point
 * `baseUrl` + `model` at your own fine-tuned model's server and nothing else in the
 * app needs to change.
 */
export async function sendStoryMessage(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  story: Story;
  joinMode: JoinMode;
  joinPrompt: string;
  history: ChatMessage[];
  userText: string;
}): Promise<string> {
  if (!params.baseUrl || !params.model) {
    return 'Henüz bir model sunucusu ayarlanmamış. Ayarlar bölümünden adres ve model adını gir.';
  }

  const messages = [
    { role: 'system', content: buildSystemInstruction(params.story, params.joinMode, params.joinPrompt) },
    ...params.history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: params.userText },
  ];

  let res: Response;
  try {
    res = await fetch(`${params.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.apiKey ? { Authorization: `Bearer ${params.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: params.model, messages }),
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
