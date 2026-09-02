import { app, shell } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ResearchResult, SaveResponse, SavedResearchItem, SearchResponse } from '../../shared/types';
import { getResearchConfig } from '../settings';
import { searchOpenverse, searchWikimedia, searchYoutube } from './providers';

const PER_PROVIDER = 8;
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

export function defaultSaveFolder(): string {
  return path.join(app.getPath('userData'), 'kayitlar');
}

/**
 * Runs the providers in parallel; one failing provider must not sink the search,
 * so failures come back as notes shown next to the results.
 */
export async function search(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: 'Önce ne aramak istediğini yaz efendim.' };

  const config = await getResearchConfig();
  const notes: string[] = [];

  const tasks: { label: string; run: () => Promise<ResearchResult[]> }[] = [
    { label: 'Openverse', run: () => searchOpenverse(trimmed, PER_PROVIDER) },
    { label: 'Wikimedia', run: () => searchWikimedia(trimmed, PER_PROVIDER) },
  ];

  if (config.youtubeApiKey) {
    tasks.push({ label: 'YouTube', run: () => searchYoutube(trimmed, PER_PROVIDER, config.youtubeApiKey) });
  } else {
    notes.push('Video araması için Ayarlar\'dan bir YouTube API anahtarı ekleyebilirsin (ücretsiz).');
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  const results: ResearchResult[] = [];

  settled.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value);
    } else {
      const reason = outcome.reason instanceof Error ? outcome.reason.message : 'bilinmeyen hata';
      notes.push(`${tasks[i].label} kaynağına ulaşılamadı (${reason}).`);
    }
  });

  if (results.length === 0 && notes.length > 0) {
    return { ok: false, error: `Sonuç alınamadı. ${notes.join(' ')}` };
  }

  // Interleave providers so one source cannot fill the whole first row.
  const byProvider = new Map<string, ResearchResult[]>();
  for (const r of results) {
    const list = byProvider.get(r.provider) ?? [];
    list.push(r);
    byProvider.set(r.provider, list);
  }
  const mixed: ResearchResult[] = [];
  for (let i = 0; mixed.length < results.length; i++) {
    for (const list of byProvider.values()) {
      if (list[i]) mixed.push(list[i]);
    }
    if (i > PER_PROVIDER) break;
  }

  return { ok: true, results: mixed, notes };
}

/** Keeps a provider-supplied title from escaping the save folder or breaking the filesystem. */
function safeFileName(title: string, url: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N} ._-]/gu, '')
    .trim()
    .slice(0, 80)
    .replace(/\s+/g, '_');

  const urlExt = path.extname(new URL(url).pathname).slice(0, 6);
  const ext = /^\.[a-zA-Z0-9]+$/.test(urlExt) ? urlExt : '.jpg';
  const stem = base || `kayit-${Date.now()}`;
  return path.basename(stem.endsWith(ext) ? stem : stem + ext);
}

async function downloadTo(url: string, folder: string, fileName: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { 'User-Agent': 'JarvisDesktop/0.1 (personal use)' },
  });
  if (!res.ok) throw new Error(`İndirme başarısız (HTTP ${res.status}).`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new Error('Dosya 25 MB sınırından büyük.');
  }

  await fs.mkdir(folder, { recursive: true });

  // Never clobber an existing file — add -1, -2, ... instead.
  const ext = path.extname(fileName);
  const stem = path.basename(fileName, ext);
  let target = path.join(folder, fileName);
  for (let n = 1; ; n++) {
    try {
      await fs.access(target);
      target = path.join(folder, `${stem}-${n}${ext}`);
    } catch {
      break;
    }
  }

  await fs.writeFile(target, buffer);
  return target;
}

export async function saveResult(result: ResearchResult, phaseId: string | null): Promise<SaveResponse> {
  const config = await getResearchConfig();
  const folder = config.saveFolder || defaultSaveFolder();

  try {
    // Videos have no downloadable file; their thumbnail plus the link is what gets kept.
    const url = result.downloadUrl || result.thumbnailUrl;
    let filePath = '';
    if (url) {
      filePath = await downloadTo(url, folder, safeFileName(result.title, url));
    }

    const item: SavedResearchItem = {
      id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: result.title,
      kind: result.kind,
      provider: result.provider,
      sourceUrl: result.sourceUrl,
      filePath,
      phaseId,
      createdAt: new Date().toISOString(),
    };
    return { ok: true, item };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Kaydedilemedi.' };
  }
}

export async function openExternal(url: string): Promise<boolean> {
  // Only ever hand real web links to the OS handler.
  if (!/^https?:\/\//i.test(url)) return false;
  await shell.openExternal(url);
  return true;
}
