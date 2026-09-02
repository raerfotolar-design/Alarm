import type { ResearchResult } from '../../shared/types';

/**
 * Endpoints are overridable so the search plumbing can be exercised against a local
 * stub; in normal runs these are the real public APIs.
 */
const ENDPOINTS = {
  openverse: process.env.JARVIS_OPENVERSE_URL ?? 'https://api.openverse.org/v1/images/',
  wikimedia: process.env.JARVIS_WIKIMEDIA_URL ?? 'https://commons.wikimedia.org/w/api.php',
  youtube: process.env.JARVIS_YOUTUBE_URL ?? 'https://www.googleapis.com/youtube/v3/search',
};

const TIMEOUT_MS = 15_000;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'JarvisDesktop/0.1 (personal use)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface OpenverseJson {
  results?: { id?: string; title?: string; url?: string; thumbnail?: string; foreign_landing_url?: string }[];
}

/** Openverse — openly licensed images, no API key needed. */
export async function searchOpenverse(query: string, limit: number): Promise<ResearchResult[]> {
  const url = `${ENDPOINTS.openverse}?q=${encodeURIComponent(query)}&page_size=${limit}`;
  const data = (await getJson(url)) as OpenverseJson;

  return (data.results ?? [])
    .filter((r) => r.url)
    .map((r, i) => ({
      id: `openverse-${r.id ?? i}`,
      kind: 'image' as const,
      title: r.title?.trim() || query,
      thumbnailUrl: r.thumbnail || r.url || '',
      sourceUrl: r.foreign_landing_url || r.url || '',
      downloadUrl: r.url || '',
      provider: 'Openverse',
    }));
}

interface WikimediaJson {
  query?: {
    pages?: Record<
      string,
      { title?: string; imageinfo?: { url?: string; thumburl?: string; descriptionurl?: string }[] }
    >;
  };
}

/** Wikimedia Commons — free media, no API key needed. */
export async function searchWikimedia(query: string, limit: number): Promise<ResearchResult[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: String(limit),
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  });
  const data = (await getJson(`${ENDPOINTS.wikimedia}?${params}`)) as WikimediaJson;

  return Object.entries(data.query?.pages ?? {})
    .map(([pageId, page]): ResearchResult | null => {
      const info = page.imageinfo?.[0];
      if (!info?.url) return null;
      return {
        id: `wikimedia-${pageId}`,
        kind: 'image' as const,
        title: (page.title ?? '').replace(/^File:/, '') || query,
        thumbnailUrl: info.thumburl || info.url,
        sourceUrl: info.descriptionurl || info.url,
        downloadUrl: info.url,
        provider: 'Wikimedia',
      };
    })
    .filter((r): r is ResearchResult => r !== null);
}

interface YoutubeJson {
  items?: {
    id?: { videoId?: string };
    snippet?: { title?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } };
  }[];
  error?: { message?: string };
}

/**
 * YouTube needs the user's own free API key. Videos are not downloadable here —
 * saving one keeps its thumbnail and link instead.
 */
export async function searchYoutube(query: string, limit: number, apiKey: string): Promise<ResearchResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(limit),
    q: query,
    key: apiKey,
  });
  const data = (await getJson(`${ENDPOINTS.youtube}?${params}`)) as YoutubeJson;
  if (data.error) throw new Error(data.error.message ?? 'YouTube isteği reddedildi.');

  return (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map((item) => {
      const videoId = item.id!.videoId!;
      const thumb = item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? '';
      return {
        id: `youtube-${videoId}`,
        kind: 'video' as const,
        title: item.snippet?.title?.trim() || query,
        thumbnailUrl: thumb,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        downloadUrl: '',
        provider: 'YouTube',
      };
    });
}
