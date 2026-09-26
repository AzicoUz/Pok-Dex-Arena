const AUDIOUS_API = 'https://api.audius.co/v1';
const CACHE_KEY = 'pokedex-arena-audius-tracks-v1';
const CACHE_TTL = 10 * 60 * 1000;

const safeJson = async (response) => {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return null; }
};

function withApiKey(url, apiKey) {
  const next = new URL(url);
  if (apiKey?.trim()) next.searchParams.set('api_key', apiKey.trim());
  return next.toString();
}

export function getMusicStreamUrl(trackId, apiKey = '') {
  return withApiKey(`${AUDIOUS_API}/tracks/${encodeURIComponent(trackId)}/stream`, apiKey);
}

export async function fetchTrendingMusic({ apiKey = '', genre = '', limit = 12, signal, force = false } = {}) {
  const cacheKey = `${CACHE_KEY}:${genre || 'all'}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (!force && cached?.savedAt && Date.now() - cached.savedAt < CACHE_TTL && Array.isArray(cached.tracks) && cached.tracks.length) {
      return cached.tracks;
    }
  } catch {
    // Ignore malformed local cache.
  }

  const url = new URL(`${AUDIOUS_API}/tracks/trending`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('time', 'week');
  if (genre && genre !== 'all') url.searchParams.set('genre', genre);
  if (apiKey?.trim()) url.searchParams.set('api_key', apiKey.trim());

  const response = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
  const payload = await safeJson(response);
  if (!response.ok) {
    const message = payload?.message || payload?.error || `Audius request failed (${response.status})`;
    throw new Error(message);
  }

  const raw = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.results) ? payload.results : [];
  const tracks = raw
    .map((track) => ({
      id: String(track.id),
      title: track.title || track.name || 'Untitled track',
      artist: track.user?.name || track.artist || 'Audius artist',
      genre: track.genre || 'Unknown',
      mood: track.mood || '',
      duration: Number(track.duration) || 0,
      artwork: track.artwork?._480x480 || track.artwork?.['480x480'] || track.artwork?._150x150 || track.artwork?.['150x150'] || '',
      permalink: track.permalink || '',
      isStreamable: track.is_streamable ?? track.isStreamable ?? true,
      playCount: Number(track.play_count ?? track.playCount ?? 0),
    }))
    .filter((track) => track.id && track.isStreamable !== false);

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), tracks }));
  } catch {
    // Storage can be disabled in private browsing; playback still works.
  }

  return tracks;
}
