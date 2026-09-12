import { GoogleGenAI, Content } from '@google/genai/web';
import { ChatMessage, JoinMode, Story } from '../types';

const MODEL = 'gemini-3.6-flash';

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

function historyToContents(history: ChatMessage[]): Content[] {
  return history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));
}

export async function sendStoryMessage(params: {
  apiKey: string;
  story: Story;
  joinMode: JoinMode;
  joinPrompt: string;
  history: ChatMessage[];
  userText: string;
}): Promise<string> {
  if (!params.apiKey) {
    return 'Henüz bir Gemini API anahtarı girmemişsin. Ayarlar bölümünden ekleyebilirsin.';
  }

  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  const contents: Content[] = [...historyToContents(params.history), { role: 'user', parts: [{ text: params.userText }] }];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction: buildSystemInstruction(params.story, params.joinMode, params.joinPrompt) },
  });

  return response.text ?? '...';
}
