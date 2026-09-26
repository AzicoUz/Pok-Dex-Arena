import { useEffect, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';
import { fetchEvolutionChain, fetchPokemonSpecies } from '../services/pokemonApi';
import { cap, getArtwork, idPad } from '../utils/pokemonHelpers';

export default function Evolution({ pokemon }) {
  const { team, replaceTeamMember } = useApp();
  const [selected, setSelected] = useState(team[0] || pokemon[0]);
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setLoading(true);
    fetchPokemonSpecies(selected.id, controller.signal)
      .then((species) => fetchEvolutionChain(species.evolution_chain.url, controller.signal))
      .then((data) => {
        const flat = [];
        const walk = (node) => { if (!node) return; flat.push(node.species.name); node.evolves_to?.forEach(walk); };
        walk(data.chain);
        setChain(flat);
      })
      .catch(() => setChain([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selected?.id]);

  const chainPokemon = chain.map((name) => pokemon.find((item) => item.name === name)).filter(Boolean);
  const currentIndex = chainPokemon.findIndex((p) => p.name === selected?.name);
  const next = currentIndex >= 0 ? chainPokemon[currentIndex + 1] : null;
  const inTeam = team.some((p) => p.name === selected?.name);

  return (
    <section className="view active-view">
      <SectionTitle eyebrow="GENETIC LAB" title="Evolution" highlight="Tree" description="Inspect evolution chains from live species data and evolve a team member when the next stage is available in the loaded Dex." />
      <div className="evolution-toolbar glass"><select value={selected?.id || ''} onChange={(e) => setSelected(pokemon.find((p) => p.id === Number(e.target.value)))}>{pokemon.map((p) => <option key={p.id} value={p.id}>{idPad(p.id)} · {cap(p.name)}</option>)}</select><span>{loading ? 'Syncing species data…' : `${chainPokemon.length} stages found`}</span></div>
      <div className="glass evolution-stage">
        {chainPokemon.length ? <div className="evolution-track">{chainPokemon.map((p, index) => <div key={p.id} className={`evolution-node ${p.name === selected.name ? 'current' : ''}`}><div className="evolution-art"><img src={getArtwork(p)} alt={p.name} /></div><span className="dex-id">{idPad(p.id)}</span><h3>{cap(p.name)}</h3>{index < chainPokemon.length - 1 && <div className="evolution-arrow">→</div>}</div>)}</div> : <p className="muted-copy">No evolution chain was returned.</p>}
        <div className="evolution-actions"><div><span className="eyebrow">NEXT STAGE</span><h3>{next ? cap(next.name) : 'Final stage'}</h3><p>{next ? 'This simplified arena uses the live evolution chain but does not emulate every in-game trigger.' : 'No later stage is present in the returned chain.'}</p></div><button className="primary-btn" disabled={!next || !inTeam} onClick={() => replaceTeamMember(selected.name, next)}>{inTeam && next ? `Evolve to ${cap(next.name)}` : 'Add selected to Team first'}</button></div>
      </div>
    </section>
  );
}
