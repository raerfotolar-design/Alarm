import { ChatMessage, JoinMode, Story } from '../types';
import { CONTENT_BOUNDARY } from './contentBoundary';
import { callChatModel } from './llmClient';

const JOIN_MODE_LABEL: Record<JoinMode, string> = {
  existing_character: 'hikayede zaten var olan bir karakter olarak',
  isekai: "hikayenin dünyasına dışarıdan aniden düşen (isekai) biri olarak",
  extra_character: 'hikayeye tamamen yeni, ekstra bir karakter olarak',
};

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
  return callChatModel({
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
    model: params.model,
    messages: [
      { role: 'system', content: buildSystemInstruction(params.story, params.joinMode, params.joinPrompt) },
      ...params.history.map((m) => ({ role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text })),
      { role: 'user', content: params.userText },
    ],
  });
}
