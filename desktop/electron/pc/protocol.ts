import type { PcToolName } from '../../shared/types';
import { isKnownTool } from './tools';

export interface ParsedAction {
  tool: PcToolName;
  args: Record<string, unknown>;
}

/**
 * Neither engine's native function-calling is used, because the app has to work the
 * same on Gemini and on any Ollama model: instead the model is told to answer with a
 * single JSON object when it wants to act, and this parses that out of the reply.
 */
export const PC_TOOLS_INSTRUCTION = `

--- BİLGİSAYAR KONTROLÜ ---
Kullanıcının bilgisayarında işlem yapabilirsin. Bir işlem yapman gerekiyorsa, cevabının SONUNA sadece şu formatta tek bir JSON nesnesi ekle:

{"action": {"tool": "araç_adı", "args": {...}}}

Kullanabileceğin araçlar:
- list_dir {"path": "..."} — klasördeki dosyaları listeler
- read_file {"path": "..."} — metin dosyasını okur
- search_files {"path": "...", "pattern": "..."} — isme göre dosya arar
- system_info {} — bilgisayarın donanım/sistem bilgisi
- open_path {"path": "..."} — dosyayı/klasörü/uygulamayı varsayılan programla açar
- write_file {"path": "...", "content": "..."} — dosyaya yazar (kullanıcı onayı ister)
- delete_path {"path": "..."} — çöp kutusuna taşır (kullanıcı onayı ister)
- move_path {"from": "...", "to": "..."} — taşır/yeniden adlandırır (kullanıcı onayı ister)
- run_command {"command": "..."} — terminal komutu çalıştırır (kullanıcı onayı ister)

Kurallar:
- Sadece gerçekten bir işlem gerekiyorsa JSON ekle. Normal sohbette ekleme.
- Aynı anda tek bir işlem iste.
- Yazma/silme/taşıma/komut işlemlerini kullanıcı onaylamadan yapamazsın; sen sadece istersin.
- Tehlikeli bir istek (disk biçimlendirme, sistem dosyalarını silme gibi) gelirse JSON üretme, önce uyar.`;

export function parseAction(raw: string): { text: string; action: ParsedAction | null } {
  const match = raw.match(/\{[\s\S]*"action"[\s\S]*\}/);
  if (!match) return { text: raw.trim(), action: null };

  // Strip the JSON either way — an action block is machinery, never something to show,
  // even when it names a tool this app does not implement.
  const text = raw.replace(match[0], '').replace(/```(?:json)?/gi, '').trim();

  try {
    const parsed = JSON.parse(match[0]) as { action?: { tool?: unknown; args?: unknown } };
    const tool = parsed.action?.tool;
    if (typeof tool !== 'string' || !isKnownTool(tool)) {
      return { text, action: null };
    }
    const args =
      typeof parsed.action?.args === 'object' && parsed.action.args !== null
        ? (parsed.action.args as Record<string, unknown>)
        : {};

    return { text, action: { tool, args } };
  } catch {
    return { text, action: null };
  }
}
