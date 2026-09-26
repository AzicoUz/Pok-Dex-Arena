import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPokemonCollection } from '../services/pokemonApi';

export function usePokemon() {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing your Pokédex...');
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  const load = useCallback(async (signal, requestId) => {
    setLoading(true);
    setError('');
    setProgress(0);
    setStatus('Preparing your Pokédex...');

    try {
      const data = await fetchPokemonCollection({
        signal,
        onProgress: (value, message) => {
          // React StrictMode intentionally runs effects twice in development.
          // Ignore progress updates from a stale/aborted request so an old
          // request can never hide the loader for the current request.
          if (requestId !== requestIdRef.current) return;
          setProgress(value);
          setStatus(message);
        },
      });

      if (requestId !== requestIdRef.current) return;
      setPokemon(data);
      setProgress(100);
      setStatus('Pokédex ready');
    } catch (err) {
      if (requestId !== requestIdRef.current || err?.name === 'AbortError') return;
      setError(err?.message || 'Could not load Pokémon data.');
      setStatus('Pokédex unavailable');
      setProgress(100);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const startLoad = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    controllerRef.current = controller;
    void load(controller.signal, requestId);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    const cleanup = startLoad();
    return () => {
      cleanup();
      controllerRef.current = null;
    };
  }, [startLoad]);

  const reload = useCallback(() => {
    startLoad();
  }, [startLoad]);

  const types = useMemo(
    () => [...new Set(pokemon.flatMap((p) => (p.types || []).map((t) => t.type.name)))].sort(),
    [pokemon]
  );

  return { pokemon, types, loading, progress, status, error, reload };
}
