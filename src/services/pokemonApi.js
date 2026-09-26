export const API = 'https://pokeapi.co/api/v2';
export const CACHE_KEY = 'pokedex-arena-react-cache-v4-151';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const moveCache = new Map();
const speciesCache = new Map();
const evolutionCache = new Map();

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export function readPokemonCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) && data.length >= 151 ? data : null;
  } catch {
    return null;
  }
}

export function writePokemonCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* optional cache */ }
}

export async function fetchPokemonCollection({ signal, onProgress } = {}) {
  const cached = readPokemonCache();
  if (cached) {
    onProgress?.(100, 'Loaded 151 Pokémon from local cache');
    return cached.sort((a, b) => a.id - b.id);
  }
  const list = await fetchJson(`${API}/pokemon?limit=151&offset=0`, signal);
  const results = [];
  const batchSize = 8;
  for (let i = 0; i < list.results.length; i += batchSize) {
    const batch = list.results.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => fetchJson(item.url, signal)));
    results.push(...batchResults);
    onProgress?.(Math.round((results.length / list.results.length) * 100), `Loading Pokédex ${results.length} / 151`);
    await sleep(8);
  }
  const normalized = results.sort((a, b) => a.id - b.id);
  writePokemonCache(normalized);
  return normalized;
}

export async function fetchPokemonSpecies(idOrName, signal) {
  const key = String(idOrName);
  if (speciesCache.has(key)) return speciesCache.get(key);
  const data = await fetchJson(`${API}/pokemon-species/${idOrName}`, signal);
  speciesCache.set(key, data);
  return data;
}

export async function fetchEvolutionChain(url, signal) {
  if (evolutionCache.has(url)) return evolutionCache.get(url);
  const data = await fetchJson(url, signal);
  evolutionCache.set(url, data);
  return data;
}

export async function fetchMoveDetails(url, signal) {
  if (moveCache.has(url)) return moveCache.get(url);
  const data = await fetchJson(url, signal);
  moveCache.set(url, data);
  return data;
}

export async function fetchMoveSet(pokemon, { count = 4, signal } = {}) {
  const refs = (pokemon.moves || []).map((entry) => entry.move).filter((move) => move?.url);
  const candidates = refs.slice(0, 18);
  const details = await Promise.all(candidates.map((move) => fetchMoveDetails(move.url, signal).catch(() => null)));
  const usable = details.filter(Boolean).filter((move) => move.damage_class?.name !== 'status' && (move.power || 0) > 0).sort((a, b) => (b.power || 0) - (a.power || 0));
  const selected = usable.slice(0, count);
  const merged = [...selected];
  while (merged.length < count) {
    merged.push({
      id: `fallback-${pokemon.id}-${merged.length}`,
      name: 'tackle',
      type: { name: 'normal' },
      damage_class: { name: 'physical' },
      power: 45,
      accuracy: 100,
      pp: 35,
      priority: 0,
      meta: { ailment: { name: 'none' }, ailment_chance: 0 },
    });
  }
  return merged.slice(0, count);
}
