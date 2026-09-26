import { useApp } from '../context/AppContext';
import { cap, getArtwork, getTypes, idPad, statValue, totalStats } from '../utils/pokemonHelpers';

export default function PokemonCard({ pokemon, onOpen }) {
  const { favorites, team, caught, toggleFavorite } = useApp();
  const primary = getTypes(pokemon)[0] || 'normal';
  const isFav = favorites.includes(pokemon.name);
  const inTeam = team.some((item) => item.name === pokemon.name);
  const isCaught = caught.includes(pokemon.id);
  const bst = totalStats(pokemon);
  return <article className="poke-card glass" style={{ '--type': `var(--${primary})` }} onClick={() => onOpen(pokemon)}><div className="card-glow" /><div className="card-topline"><span className="dex-id">{idPad(pokemon.id)}</span><span className="card-badges">{isCaught && <small className="caught-dot">CAUGHT</small>}{inTeam && <small className="team-dot">TEAM</small>}</span></div><button className={`card-favorite ${isFav ? 'is-fav' : ''}`} aria-label={`${isFav ? 'Remove' : 'Add'} ${pokemon.name} favorite`} onClick={(event) => { event.stopPropagation(); toggleFavorite(pokemon); }}>{isFav ? '♥' : '♡'}</button><img src={getArtwork(pokemon)} alt={pokemon.name} loading="lazy" /><div className="poke-meta"><div className="type-row">{getTypes(pokemon).map((type) => <span key={type} className="type-pill" style={{ '--type': `var(--${type})` }}>{cap(type)}</span>)}</div><div className="name-row"><h3>{cap(pokemon.name)}</h3><span>BST {bst}</span></div><p>HP {statValue(pokemon, 'hp')} · ATK {statValue(pokemon, 'attack')} · SPD {statValue(pokemon, 'speed')}</p></div></article>;
}
