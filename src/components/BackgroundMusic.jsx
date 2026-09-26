import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTrendingMusic, getMusicStreamUrl } from '../services/musicApi';
import { useApp } from '../context/AppContext';

const formatTime = (value = 0) => {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

function albumFallback(track) {
  const seed = encodeURIComponent(track?.title || 'Arena');
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=07111f&shape1Color=6c8cff&shape2Color=58d5ff`;
}

export default function BackgroundMusic() {
  const { settings, setSettings, notify } = useApp();
  const audioRef = useRef(null);
  const startedFromGesture = useRef(false);
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentTrack = tracks[currentIndex];
  const volume = Number.isFinite(settings.musicVolume) ? settings.musicVolume : 0.22;
  const genre = settings.musicGenre || 'all';
  const hasApiKey = Boolean((settings.audiusApiKey || import.meta.env.VITE_AUDIUS_API_KEY || '').trim());
  const apiKey = (settings.audiusApiKey || import.meta.env.VITE_AUDIUS_API_KEY || '').trim();

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    try {
      const result = await fetchTrendingMusic({ apiKey, genre, limit: 12, signal: controller.signal, force: true });
      setTracks(result);
      setCurrentIndex(0);
      if (!result.length) setError('No streamable tracks were returned.');
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err?.message || 'Could not load music from Audius.');
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [apiKey, genre]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchTrendingMusic({ apiKey, genre, limit: 12, signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setTracks(result);
        setCurrentIndex(0);
        if (!result.length) setError('No streamable tracks were returned.');
      })
      .catch((err) => {
        if (active && err?.name !== 'AbortError') setError(err?.message || 'Could not load music from Audius.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; controller.abort(); };
  }, [apiKey, genre]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = getMusicStreamUrl(currentTrack.id, apiKey);
    audio.volume = volume;
    audio.load();

    if (!settings.sound) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (startedFromGesture.current || settings.musicAutoplay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentTrack, apiKey, volume, settings.sound, settings.musicAutoplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (!settings.sound && !audio.paused) audio.pause();
  }, [settings.sound, volume]);

  const nextTrack = useCallback(() => {
    if (!tracks.length) return;
    setCurrentIndex((index) => (index + 1) % tracks.length);
  }, [tracks.length]);

  const prevTrack = useCallback(() => {
    if (!tracks.length) return;
    setCurrentIndex((index) => (index - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    startedFromGesture.current = true;
    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
        setSettings((current) => ({ ...current, musicAutoplay: true }));
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
      notify('Browser blocked playback. Press Play once to enable music.');
    }
  }, [currentTrack, notify, setSettings]);

  useEffect(() => {
    const resumeFromGesture = () => {
      if (startedFromGesture.current || !settings.sound || !settings.musicAutoplay || !audioRef.current || audioRef.current.readyState < 2) return;
      startedFromGesture.current = true;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    };
    window.addEventListener('pointerdown', resumeFromGesture, { passive: true });
    window.addEventListener('keydown', resumeFromGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', resumeFromGesture);
      window.removeEventListener('keydown', resumeFromGesture);
    };
  }, [settings.sound, settings.musicAutoplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onTime = () => {
      setProgress(audio.currentTime || 0);
      setDuration(audio.duration || currentTrack?.duration || 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => nextTrack();
    const onError = () => setError('This track could not be streamed. Trying the next one...');
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentTrack, nextTrack]);

  const artwork = useMemo(() => currentTrack?.artwork || (currentTrack ? albumFallback(currentTrack) : ''), [currentTrack]);

  const seek = (event) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const next = Number(event.target.value);
    audio.currentTime = next;
    setProgress(next);
  };

  const changeVolume = (event) => {
    const next = Number(event.target.value);
    setSettings((current) => ({ ...current, musicVolume: next, sound: next > 0 }));
  };

  return <>
    <audio ref={audioRef} preload="metadata" aria-hidden="true" />
    <aside className={`music-dock glass ${isMinimized ? 'is-minimized' : ''}`} aria-label="Background music player">
      <div className="music-dock-head">
        <div className="music-live"><span className="music-pulse" /> AUDIOUS BACKGROUND</div>
        <div className="music-head-actions">
          <button className="music-icon-btn" onClick={() => setSettings((current) => ({ ...current, sound: !current.sound }))} title={settings.sound ? 'Mute music' : 'Enable music'}>{settings.sound ? '🔊' : '🔇'}</button>
          <button className="music-icon-btn" onClick={() => setIsMinimized((value) => !value)} title={isMinimized ? 'Expand player' : 'Minimize player'}>{isMinimized ? '⌃' : '⌄'}</button>
        </div>
      </div>

      {isMinimized ? <div className="music-mini-row">
        {currentTrack && <img src={artwork} alt="" className="music-art music-art-mini" />}
        <div className="music-track-copy"><b>{currentTrack?.title || (loading ? 'Loading music…' : 'No track')}</b><span>{currentTrack?.artist || 'Audius'}</span></div>
        <button className="music-play mini" onClick={togglePlay} disabled={!currentTrack || loading}>{isPlaying ? '❚❚' : '▶'}</button>
      </div> : <>
        <div className="music-main">
          <div className={`music-art-wrap ${isPlaying ? 'is-playing' : ''}`}><img src={artwork} alt="" className="music-art" /></div>
          <div className="music-track-copy"><b>{currentTrack?.title || (loading ? 'Loading music…' : 'Music unavailable')}</b><span>{currentTrack?.artist || 'Audius'}</span><small>{currentTrack?.genre || 'Background ambience'}</small></div>
          <div className="music-controls">
            <button className="music-icon-btn" onClick={prevTrack} disabled={!tracks.length}>↶</button>
            <button className="music-play" onClick={togglePlay} disabled={!currentTrack || loading}>{isPlaying ? '❚❚' : '▶'}</button>
            <button className="music-icon-btn" onClick={nextTrack} disabled={!tracks.length}>↷</button>
          </div>
        </div>

        <div className="music-progress-row">
          <span>{formatTime(progress)}</span>
          <input type="range" min="0" max={Math.max(duration, 0)} step="0.1" value={Math.min(progress, duration || 0)} onChange={seek} aria-label="Music progress" />
          <span>{formatTime(duration || currentTrack?.duration || 0)}</span>
        </div>

        <div className="music-bottom-row">
          <label className="music-volume"><span>VOL</span><input type="range" min="0" max="1" step="0.01" value={volume} onChange={changeVolume} aria-label="Music volume" /></label>
          <button className="music-skip" onClick={loadTracks} disabled={loading}>↻ Refresh</button>
        </div>
        {!hasApiKey && <div className="music-note">Audius API works read-only without a key; add your own key in Settings for your app's rate-limit budget.</div>}
        {error && <div className="music-error" role="status">{error}</div>}
      </>}
    </aside>
  </>;
}
