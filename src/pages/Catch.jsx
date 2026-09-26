import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';
import { fetchPokemonSpecies } from '../services/pokemonApi';
import { cap, getArtwork, getTypes } from '../utils/pokemonHelpers';

const BALLS = [
  { id: 'poke-ball', name: 'Poké Ball', multiplier: 1, icon: '◉' },
  { id: 'great-ball', name: 'Great Ball', multiplier: 1.45, icon: '◉' },
  { id: 'ultra-ball', name: 'Ultra Ball', multiplier: 1.85, icon: '◉' },
];

export default function Catch({ pokemon }) {
  const { caught, inventory, catchPokemon, useInventoryItem, addToTeam } = useApp();
  const [encounter, setEncounter] = useState(null);
  const [captureRate, setCaptureRate] = useState(45);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [selectedBall, setSelectedBall] = useState('poke-ball');

  const uncaught = useMemo(() => pokemon.filter((p) => !caught.includes(p.id)), [pokemon, caught]);

  const spawn = async () => {
    const pool = uncaught.length ? uncaught : pokemon;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setEncounter(next);
    setResult('');
    try {
      const species = await fetchPokemonSpecies(next.id);
      setCaptureRate(species.capture_rate || 45);
    } catch {
      setCaptureRate(45);
    }
  };

  useEffect(() => { if (!encounter && pokemon.length) spawn(); }, [pokemon.length]);

  const throwBall = async () => {
    if (!encounter || busy) return;
    const ball = BALLS.find((item) => item.id === selectedBall);
    if (!useInventoryItem(ball.id)) return;
    setBusy(true);
    setResult('The ball is shaking…');
    await wait(700);
    const baseChance = 0.22 + (captureRate / 255) * 0.62;
    const chance = Math.min(0.98, baseChance * ball.multiplier);
    const success = Math.random() < chance;
    if (success) {
      const added = catchPokemon(encounter);
      if (!added) setResult('Already captured. A new wild target is needed.');
      else setResult(`${cap(encounter.name)} was captured!`);
    } else {
      setResult(`${cap(encounter.name)} broke free! Try another ball.`);
    }
    setBusy(false);
  };

  const addCapturedToTeam = () => {
    if (encounter && caught.includes(encounter.id)) addToTeam(encounter);
  };

  return (
    <section className="view active-view">
      <SectionTitle eyebrow="WILD ZONE" title="Catch" highlight="Pokémon" description="Encounter wild species, choose the right ball and expand your collection." />
      <div className="catch-layout">
        <div className="catch-scene glass">
          <div className="wild-badge">WILD ENCOUNTER</div>
          {encounter && <img className={`wild-art ${busy ? 'shake' : ''}`} src={getArtwork(encounter)} alt={encounter.name} />}
          <div className="wild-copy">
            <span className="dex-id">{encounter ? `#${String(encounter.id).padStart(3, '0')}` : '—'}</span>
            <h2>{encounter ? cap(encounter.name) : 'Searching…'}</h2>
            <div className="type-row">{encounter && getTypes(encounter).map((type) => <span key={type} className="type-pill" style={{ '--type': `var(--${type})` }}>{cap(type)}</span>)}</div>
            <p>{result || 'A wild Pokémon is watching from the tall grass.'}</p>
          </div>
          <div className="catch-actions"><button className="primary-btn" onClick={throwBall} disabled={!encounter || busy}>Throw {BALLS.find((b) => b.id === selectedBall)?.name} →</button><button className="ghost-btn" onClick={spawn} disabled={busy}>Run / New encounter</button>{encounter && caught.includes(encounter.id) && <button className="ghost-btn" onClick={addCapturedToTeam}>Add to Team</button>}</div>
        </div>

        <aside className="glass capture-panel">
          <div className="panel-head"><h3>Choose your ball</h3><span>{uncaught.length} unseen</span></div>
          <div className="ball-grid">{BALLS.map((ball) => <button key={ball.id} className={`ball-choice ${selectedBall === ball.id ? 'selected' : ''}`} onClick={() => setSelectedBall(ball.id)}><span className="ball-icon">{ball.icon}</span><div><b>{ball.name}</b><small>×{ball.multiplier.toFixed(2)} catch rate</small></div><strong>×{inventory[ball.id] || 0}</strong></button>)}</div>
          <div className="catch-tip"><span>💡</span><p>Great and Ultra Balls increase the simplified capture probability. This is a frontend game mechanic, not the official cartridge formula.</p></div>
          <div className="capture-stat"><span>Capture Rate</span><b>{captureRate}/255</b></div>
        </aside>
      </div>

      <div className="glass catch-collection">
        <div className="panel-head"><h3>Collection Snapshot</h3><span>{caught.length}/151 caught</span></div>
        <div className="caught-strip">{(caught.slice(-8).map((id) => pokemon.find((p) => p.id === id)).filter(Boolean)).map((p) => <img key={p.id} src={getArtwork(p)} alt={p.name} title={cap(p.name)} />)}{!caught.length && <p className="muted-copy">No captures yet. Your first catch starts the collection.</p>}</div>
      </div>
    </section>
  );
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
