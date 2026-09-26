import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';
import { cap, getArtwork, getTypes } from '../utils/pokemonHelpers';

const GAME_TYPES = ['Type Guess', "Who's That Pokémon?", 'Quick Quiz', 'Reaction Rush'];

export default function MiniGames({ pokemon }) {
  const { recordMiniGame } = useApp();
  const [game, setGame] = useState('Type Guess');
  const [seed, setSeed] = useState(0);
  const [choice, setChoice] = useState('');
  const [message, setMessage] = useState('');
  const [reaction, setReaction] = useState('ready');

  const current = pokemon[(seed * 17 + 24) % pokemon.length];
  const types = useMemo(() => [...new Set(pokemon.flatMap(getTypes))], [pokemon]);
  const typeOptions = useMemo(() => {
    if (!current) return [];
    const correct = getTypes(current)[0];
    return shuffle([correct, ...shuffle(types.filter((t) => t !== correct)).slice(0, 3)]);
  }, [current, types]);
  const silhouetteOptions = useMemo(() => current ? shuffle([current.name, ...shuffle(pokemon.filter((p) => p.id !== current.id).map((p) => p.name))]).slice(0, 4) : [], [current, pokemon]);

  const next = () => { setSeed((v) => v + 1); setChoice(''); setMessage(''); setReaction('ready'); };
  const answer = (value, expected) => {
    const correct = value === expected;
    setChoice(value);
    setMessage(correct ? 'Correct! +25 XP' : `Not quite — it was ${cap(String(expected))}.`);
    recordMiniGame(correct, correct ? 25 : 5);
  };
  const quiz = () => {
    if (!current) return;
    const expected = current.id;
    const guesses = shuffle([expected, ((expected + 3) % pokemon.length) + 1, ((expected + 17) % pokemon.length) + 1, ((expected + 31) % pokemon.length) + 1]);
    const value = Number(window.prompt(`Which National Dex number belongs to ${cap(current.name)}?\nOptions: ${guesses.join(', ')}`));
    if (!value) return;
    answer(value, expected);
  };

  if (!current) return null;
  return <section className="view active-view">
    <SectionTitle eyebrow="ARCADE DECK" title="Mini" highlight="Games" description="Small training loops for XP, reaction speed and Pokédex memory." />
    <div className="game-tabs">{GAME_TYPES.map((item) => <button key={item} className={game === item ? 'selected' : ''} onClick={() => { setGame(item); setMessage(''); setChoice(''); }}>{item}</button>)}</div>
    <div className="glass game-stage">
      {game === 'Type Guess' && <><div className="game-art-wrap"><img src={getArtwork(current)} alt={current.name} /></div><p className="eyebrow">WHAT TYPE IS IT?</p><h2>{cap(current.name)}</h2><div className="game-options">{typeOptions.map((type) => <button key={type} disabled={Boolean(choice)} className={choice === type ? 'selected' : ''} onClick={() => answer(type, getTypes(current)[0])}>{cap(type)}</button>)}</div></>}
      {game === "Who's That Pokémon?" && <><div className="game-art-wrap silhouette"><img src={getArtwork(current)} alt="mystery Pokémon" /></div><p className="eyebrow">GUESS THE SILHOUETTE</p><h2>{choice ? cap(current.name) : '???'}</h2><div className="game-options">{silhouetteOptions.map((name) => <button key={name} disabled={Boolean(choice)} className={choice === name ? 'selected' : ''} onClick={() => answer(name, current.name)}>{cap(name)}</button>)}</div></>}
      {game === 'Quick Quiz' && <><div className="quiz-card"><span>QUESTION</span><h2>What is the National Dex number of {cap(current.name)}?</h2><button className="primary-btn" onClick={quiz}>Choose answer</button></div></>}
      {game === 'Reaction Rush' && <><div className={`reaction-board ${reaction}`} onClick={() => { if (reaction === 'go') { setReaction('done'); setMessage('Great reaction! +25 XP'); recordMiniGame(true, 25); } }}><b>{reaction === 'go' ? 'CLICK!' : reaction === 'done' ? 'NICE!' : reaction === 'wait' ? 'WAIT…' : 'READY'}</b><small>{reaction === 'go' ? 'hit anywhere' : 'press start'}</small></div><button className="primary-btn" disabled={reaction === 'wait' || reaction === 'go'} onClick={() => { setReaction('wait'); setMessage('Wait for GO…'); window.setTimeout(() => setReaction('go'), 700 + Math.random() * 1700); }}>Start reaction test</button></>}
      {message && <p className="game-message">{message}</p>}
      <div className="game-footer"><button className="ghost-btn" onClick={next}>Next challenge</button><Link className="text-link" to="/profile">View XP & achievements →</Link></div>
    </div>
  </section>;
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
  return next;
}
