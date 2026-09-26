import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvolutionChain, fetchMoveSet, fetchPokemonSpecies } from '../services/pokemonApi';
import { useApp } from '../context/AppContext';
import { cap, getArtwork, getTypes, idPad, primaryType } from '../utils/pokemonHelpers';

const labels = { hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SP. ATK', 'special-defense': 'SP. DEF', speed: 'SPD' };

export default function PokemonModal({ pokemon, allPokemon = [], onClose }) {
  const { team, addToTeam, removeFromTeam, caught, catchPokemon } = useApp();
  const [species, setSpecies] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [moves, setMoves] = useState([]);
  const [tab, setTab] = useState('overview');
  const type = primaryType(pokemon);
  const isInTeam = team.some((item) => item.name === pokemon.name);
  const isCaught = caught.includes(pokemon.id);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchPokemonSpecies(pokemon.id, controller.signal), fetchMoveSet(pokemon, { count: 8, signal: controller.signal })])
      .then(async ([speciesData, moveData]) => {
        setSpecies(speciesData);
        setMoves(moveData);
        const evolutionData = await fetchEvolutionChain(speciesData.evolution_chain.url, controller.signal);
        setEvolution(evolutionData);
      }).catch(() => {});
    return () => controller.abort();
  }, [pokemon.id]);

  const evolutionNames = useMemo(() => {
    const result = [];
    const walk = (node) => { if (!node) return; result.push(node.species.name); node.evolves_to?.forEach(walk); };
    walk(evolution?.chain);
    return result;
  }, [evolution]);

  const description = species?.flavor_text_entries?.find((entry) => entry.language.name === 'en')?.flavor_text?.replace(/[\n\f]/g, ' ') || 'Live species data is shown here from the PokéAPI-powered data layer.';
  const habitat = species?.habitat?.name ? cap(species.habitat.name) : 'Unknown';
  const category = species?.genera?.find((entry) => entry.language.name === 'en')?.genus || 'Species Pokémon';
  const eggGroups = species?.egg_groups?.map((group) => cap(group.name)).join(' · ') || '—';
  const nextEvolution = evolutionNames.length > 0 ? evolutionNames[evolutionNames.findIndex((name) => name === pokemon.name) + 1] : '';

  return <div className="modal" role="dialog" aria-modal="true" aria-label={`${cap(pokemon.name)} details`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="pokemon-detail glass" style={{ '--type': `var(--${type})` }}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <div className="detail-art"><span className="detail-status">{isCaught ? 'CAUGHT' : 'WILD'} · {idPad(pokemon.id)}</span><img src={getArtwork(pokemon)} alt={pokemon.name} /></div>
      <div className="detail-copy"><div className="dex-id">{idPad(pokemon.id)}</div><h2>{cap(pokemon.name)}</h2><div className="type-row">{getTypes(pokemon).map((t) => <span key={t} className="type-pill" style={{ '--type': `var(--${t})` }}>{cap(t)}</span>)}</div>
        <div className="detail-tabs"><button className={tab === 'overview' ? 'selected' : ''} onClick={() => setTab('overview')}>Overview</button><button className={tab === 'stats' ? 'selected' : ''} onClick={() => setTab('stats')}>Stats</button><button className={tab === 'moves' ? 'selected' : ''} onClick={() => setTab('moves')}>Moves</button></div>
        {tab === 'overview' && <><p className="detail-desc">{description}</p><div className="detail-info"><span>Category {category}</span><span>Height {pokemon.height / 10} m</span><span>Weight {pokemon.weight / 10} kg</span><span>Habitat {habitat}</span><span>Egg Group {eggGroups}</span><span>Base XP {pokemon.base_experience}</span>{pokemon.abilities?.slice(0, 2).map((ability) => <span key={ability.ability.name}>Ability: {cap(ability.ability.name.replaceAll('-', ' '))}</span>)}</div><div className="evolution-line"><span>Evolution</span><b>{evolutionNames.length ? evolutionNames.map(cap).join(' → ') : 'Loading…'}</b></div></>}
        {tab === 'stats' && <div className="detail-stats">{pokemon.stats.map(({ stat, base_stat }) => <div key={stat.name}><span>{labels[stat.name] || cap(stat.name)}</span><b>{base_stat}</b><i><em style={{ width: `${Math.min(base_stat / 255 * 100, 100)}%` }} /></i></div>)}</div>}
        {tab === 'moves' && <div className="modal-moves">{moves.map((move) => <div className="modal-move" key={move.id}><span style={{ '--type': `var(--${move.type?.name || 'normal'})` }}>{cap(move.type?.name || 'normal')}</span><b>{cap(move.name.replaceAll('-', ' '))}</b><small>{move.damage_class?.name || 'move'} · {move.power || '—'} power · {move.accuracy || '—'} acc</small></div>)}</div>}
        <div className="modal-actions"><button className="primary-btn full-btn" onClick={() => isInTeam ? removeFromTeam(pokemon.name) : addToTeam(pokemon)}>{isInTeam ? 'Remove from Team' : 'Add to Team'}</button>{!isCaught && <button className="ghost-btn full-btn" onClick={() => catchPokemon(pokemon)}>Mark as Caught</button>}{nextEvolution && <Link className="ghost-btn full-btn" to="/evolution" onClick={onClose}>Open Evolution Lab →</Link>}</div>
        <small className="source-note">Data layer: PokéAPI · Arena mechanics are simplified for this frontend game.</small>
      </div>
    </article>
  </div>;
}
