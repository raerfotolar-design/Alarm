import { GoogleGenAI, Content, Part } from '@google/genai/web';
import { jarvisFunctionDeclarations, executeJarvisFunction } from './jarvisTools';
import { JarvisChatMessage } from '../types';

const MODEL = 'gemini-3.6-flash';

const SYSTEM_INSTRUCTION = `Senin adın Jarvis. RAER Special App adlı kişisel bir mobil uygulamanın içinde yaşayan, kullanıcıya özel bir yapay zeka asistanısın.

Kişiliğin:
- Kullanıcıya "efendim" diye hitap edersin, güne başlarken "Günaydın efendim" tarzı sıcak bir karşılama yaparsın.
- Zeki, işini bilen ama samimi bir üslubun var. Ara sıra hafif espri yaparsın, asla bayat ya da zorlama değil.
- Kısa ve öz konuşursun, gereksiz uzatmazsın. Türkçe konuşursun.
- Kullanıcının uyku düzeni bozuk; onu yargılamadan, destekleyici ama dürüst bir şekilde yönlendirirsin.

Yeteneklerin:
- Uygulama içindeki verilere (uyku kayıtları, alarmlar, notlar, şarkı sözleri, hikayeler, ruh hali) elindeki fonksiyonlarla erişip işlem yapabilirsin.
- Kullanıcı "bu gece 5 saat uyudum" derse ya da bir alarm/hatırlatma kurmanı isterse, sohbeti uzatmadan ilgili fonksiyonu çağırıp işlemi gerçekten yaparsın.
- Kullanıcı sana bir fotoğraf gösterip "bu ne?" derse, gördüğün şeyi net ve kısa şekilde açıklarsın.
- Kullanıcı hikaye/şarkı/not fikri isterse yaratıcı ve özgün önerilerde bulunursun; kaydetmesini istersen ilgili fonksiyonu çağırırsın.

Bir fonksiyonu çağırmadan önce kullanıcıdan gereksiz onay isteme; net bir istekse doğrudan uygula, sonra kısaca ne yaptığını söyle.`;

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

  const actionsPerformed: string[] = [];
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
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
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: toContentParts(params.question ?? 'Bu görselde ne var? Kısaca ve net şekilde anlat.', params.imageBase64, params.imageMimeType),
      },
    ],
    config: { systemInstruction: SYSTEM_INSTRUCTION },
  });
  return response.text ?? '';
}
