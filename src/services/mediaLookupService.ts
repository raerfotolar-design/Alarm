import { MediaKind } from '../types';

async function lookupTmdb(title: string, kind: 'movie' | 'series', apiKey: string): Promise<string | null> {
  if (!apiKey) return null;
  const endpoint = kind === 'movie' ? 'movie' : 'tv';
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${endpoint}?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(title)}`
    );
    const data = await res.json();
    const posterPath = data?.results?.[0]?.poster_path;
    return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
  } catch {
    return null;
  }
}

async function lookupAniList(title: string, kind: 'anime' | 'manga'): Promise<string | null> {
  const query = `query ($search: String, $type: MediaType) {
    Media(search: $search, type: $type) {
      coverImage { large }
    }
  }`;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { search: title, type: kind.toUpperCase() } }),
    });
    const data = await res.json();
    return data?.data?.Media?.coverImage?.large ?? null;
  } catch {
    return null;
  }
}

async function lookupOpenLibrary(title: string): Promise<string | null> {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();
    const coverId = data?.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
  } catch {
    return null;
  }
}

/** Best-effort cover art lookup. Returns null (never throws) if there's no
 * key, no network, or no match — callers should fall back to a placeholder. */
export async function lookupCoverUrl(title: string, kind: MediaKind, tmdbApiKey: string): Promise<string | null> {
  switch (kind) {
    case 'movie':
      return lookupTmdb(title, 'movie', tmdbApiKey);
    case 'series':
      return lookupTmdb(title, 'series', tmdbApiKey);
    case 'anime':
      return lookupAniList(title, 'anime');
    case 'manga':
      return lookupAniList(title, 'manga');
    case 'book':
      return lookupOpenLibrary(title);
    default:
      return null;
  }
}
