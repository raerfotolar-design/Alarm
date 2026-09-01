import { GoogleGenAI, Content, Part } from '@google/genai/web';
import { jarvisFunctionDeclarations, executeJarvisFunction } from './jarvisTools';
import { JarvisChatMessage } from '../types';
import { getSettings } from '../storage/settingsRepository';

const MODEL = 'gemini-3.6-flash';

const TONE_INSTRUCTION: Record<string, string> = {
  samimi: '- Zeki, işini bilen ama samimi bir üslubun var. Ara sıra hafif espri yaparsın, asla bayat ya da zorlama değil.',
  resmi: '- Kısa, saygılı ve işine odaklı konuşursun; espri yapmazsın, gereksiz laf kalabalığından kaçınırsın.',
  esprili: '- Esprili, hafif şakacı bir üslubun var; neredeyse her cevabında küçük bir espri ya da nükte bulunur, ama işini de eksiksiz yaparsın.',
};

function buildSystemInstruction(tone: string): string {
  return `Senin adın Jarvis. RAER Special App adlı kişisel bir mobil uygulamanın içinde yaşayan, kullanıcıya özel bir yapay zeka asistanısın.

Kişiliğin:
- Kullanıcıya "efendim" diye hitap edersin, güne başlarken "Günaydın efendim" tarzı sıcak bir karşılama yaparsın.
${TONE_INSTRUCTION[tone] ?? TONE_INSTRUCTION.samimi}
- Kısa ve öz konuşursun, gereksiz uzatmazsın. Türkçe konuşursun.
- Kullanıcının uyku düzeni bozuk; onu yargılamadan, destekleyici ama dürüst bir şekilde yönlendirirsin.

Yeteneklerin:
- Uygulama içindeki verilere (uyku kayıtları, alarmlar, notlar, şarkı sözleri, hikayeler, ruh hali, hobi/film-dizi-anime-manga-kitap listesi, ninni) elindeki fonksiyonlarla erişip işlem yapabilirsin.
- Kullanıcı "bu gece 5 saat uyudum" derse, bir alarm/hatırlatma kurmanı isterse, "Avengers Endgame'i izleme listeme ekle" derse ya da "ninnimi çal" derse, sohbeti uzatmadan ilgili fonksiyonu çağırıp işlemi gerçekten yaparsın.
- Kullanıcı sana bir fotoğraf gösterip "bu ne?" derse, gördüğün şeyi net ve kısa şekilde açıklarsın.
- Kullanıcı hikaye/şarkı/not fikri isterse yaratıcı ve özgün önerilerde bulunursun; kaydetmesini istersen ilgili fonksiyonu çağırırsın.
- Kullanıcı "bunu unutma" derse remember_fact fonksiyonuyla kalıcı olarak hatırlarsın; ileride ilgili bir konu geçtiğinde recall_facts ile hatırladıklarını kullanabilirsin.

Bir fonksiyonu çağırmadan önce kullanıcıdan gereksiz onay isteme; net bir istekse doğrudan uygula, sonra kısaca ne yaptığını söyle.`;
}

function toContentParts(text: string, mediaBase64?: string, mediaMimeType?: string): Part[] {
  const parts: Part[] = [];
  if (mediaBase64) {
    parts.push({ inlineData: { data: mediaBase64, mimeType: mediaMimeType ?? 'image/jpeg' } });
  }
  parts.push({ text });
  return parts;
}

function historyToContents(history: JarvisChatMessage[]): Content[] {
  return history
    .filter((m) => m.text || m.imageUri)
    .map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
}

export interface JarvisReply {
  text: string;
  actionsPerformed: string[];
}

export async function sendJarvisMessage(params: {
  apiKey: string;
  history: JarvisChatMessage[];
  userText: string;
  mediaBase64?: string;
  mediaMimeType?: string;
}): Promise<JarvisReply> {
  if (!params.apiKey) {
    return {
      text: 'Efendim, henüz bir Gemini API anahtarı girmemişsin. Ayarlar > Jarvis bölümünden ekleyebilirsin.',
      actionsPerformed: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  const contents: Content[] = [
    ...historyToContents(params.history),
    { role: 'user', parts: toContentParts(params.userText, params.mediaBase64, params.mediaMimeType) },
  ];

  const settings = await getSettings();
  const actionsPerformed: string[] = [];
  const config = {
    systemInstruction: buildSystemInstruction(settings.jarvisTone),
    tools: [{ functionDeclarations: jarvisFunctionDeclarations }],
  };

  for (let turn = 0; turn < 5; turn++) {
    const response = await ai.models.generateContent({ model: MODEL, contents, config });
    const calls = response.functionCalls;

    if (!calls || calls.length === 0) {
      return { text: response.text ?? '', actionsPerformed };
    }

    const modelParts: Part[] = calls.map((c) => ({ functionCall: c }));
    contents.push({ role: 'model', parts: modelParts });

    const responseParts: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? 'unknown';
      const result = await executeJarvisFunction(name, call.args ?? {});
      actionsPerformed.push(name);
      responseParts.push({ functionResponse: { name, response: result } });
    }
    contents.push({ role: 'user', parts: responseParts });
  }

  return { text: 'Efendim, bu isteği tamamlarken bir şeyler karıştı, tekrar dener misin?', actionsPerformed };
}

export async function describeImage(params: { apiKey: string; imageBase64: string; imageMimeType?: string; question?: string }): Promise<string> {
  if (!params.apiKey) return 'Gemini API anahtarı girilmemiş.';
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  const settings = await getSettings();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: toContentParts(params.question ?? 'Bu görselde ne var? Kısaca ve net şekilde anlat.', params.imageBase64, params.imageMimeType),
      },
    ],
    config: { systemInstruction: buildSystemInstruction(settings.jarvisTone) },
  });
  return response.text ?? '';
}

/** One-off helper (no chat history) for the Songs editor's rhyme button. */
export async function getRhymes(apiKey: string, word: string): Promise<string[]> {
  if (!apiKey || !word.trim()) return [];
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `"${word}" kelimesiyle Türkçe kafiyeli/uyumlu 8 kelime öner. Sadece kelimeleri virgülle ayırarak yaz, açıklama ekleme.`,
          },
        ],
      },
    ],
  });
  const text = response.text ?? '';
  return text
    .split(/[,\n]/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/** One-off helper for Home's cached daily motivation line. */
export async function getDailyMotivation(apiKey: string): Promise<string> {
  if (!apiKey) return '';
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Bugün için kısa (1 cümle), samimi ve motive edici bir Türkçe söz yaz. Sadece sözü yaz, tırnak veya açıklama ekleme.' }],
      },
    ],
  });
  return (response.text ?? '').trim();
}

/** One-off helper for Home's "Bugünkü Brifing" button. */
export async function getDailyBriefing(apiKey: string, context: string): Promise<string> {
  if (!apiKey) return 'Gemini API anahtarı girilmemiş.';
  const ai = new GoogleGenAI({ apiKey });
  const settings = await getSettings();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Aşağıdaki bilgilere göre kullanıcıya kısa (3-4 cümle) bir günlük brifing ver — bugün dikkat etmesi gerekenleri özetle:\n\n${context}`,
          },
        ],
      },
    ],
    config: { systemInstruction: buildSystemInstruction(settings.jarvisTone) },
  });
  return response.text ?? '';
}

/** One-off helper for the Stories/Songs editor's "devam ettir" button. */
export async function continueWriting(apiKey: string, existingText: string, kind: 'story' | 'song'): Promise<string> {
  if (!apiKey) return '';
  const ai = new GoogleGenAI({ apiKey });
  const kindLabel = kind === 'song' ? 'şarkı sözü' : 'hikaye';
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Aşağıdaki ${kindLabel} yarım kalmış, aynı üslupla ve tonla devamını yaz (sadece devam kısmını yaz, baştaki metni tekrarlama):\n\n${existingText}`,
          },
        ],
      },
    ],
  });
  return response.text ?? '';
}
