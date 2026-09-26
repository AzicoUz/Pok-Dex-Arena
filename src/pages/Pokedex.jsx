import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PokemonCard from '../components/PokemonCard';
import PokemonModal from '../components/PokemonModal';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';
import { cap, totalStats } from '../utils/pokemonHelpers';

export default function Pokedex({ pokemon, types }) {
  const { favorites, team, caught } = useApp();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('id');
  const [status, setStatus] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = pokemon.filter((p) => {
      const abilities = (p.abilities || []).map((entry) => entry.ability.name).join(' ');
      const matchesSearch = !query || p.name.includes(query) || String(p.id).includes(query) || abilities.includes(query);
      const matchesType = type === 'all' || p.types.some((item) => item.type.name === type);
      const matchesStatus = status === 'all' || (status === 'caught' ? caught.includes(p.id) : !caught.includes(p.id));
      const matchesFav = !favoritesOnly || favorites.includes(p.name);
      return matchesSearch && matchesType && matchesStatus && matchesFav;
    });
    return [...list].sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'bst' ? totalStats(b) - totalStats(a) : sort === 'hp' ? stat(b, 'hp') - stat(a, 'hp') : sort === 'attack' ? stat(b, 'attack') - stat(a, 'attack') : sort === 'speed' ? stat(b, 'speed') - stat(a, 'speed') : a.id - b.id);
  }, [pokemon, search, type, sort, status, favoritesOnly, favorites, caught]);
  const typeCounts = useMemo(() => { const counts = Object.fromEntries(types.map((name) => [name, 0])); pokemon.forEach((p) => p.types.forEach(({ type: item }) => { counts[item.name] = (counts[item.name] || 0) + 1; })); return counts; }, [pokemon, types]);
  const reset = () => { setSearch(''); setType('all'); setSort('id'); setStatus('all'); setFavoritesOnly(false); };

  return <section className="view active-view">
    <div className="hero-row"><div><p className="eyebrow">NATIONAL DEX • REACT + POKÉAPI</p><h1>Explore <span>151</span><br />Pokémon.</h1><p className="hero-copy">Inspect live species data, save favorites, build your squad, discover evolution chains and take your catches into the 6v6 arena.</p><div className="hero-links"><Link className="ghost-btn" to="/evolution">Open Evolution Lab</Link><Link className="ghost-btn" to="/regions">View Regions</Link></div></div><div className="hero-pokeball" aria-hidden="true"><div className="hero-ball" /><span>GEN I • KANTO COLLECTION</span></div></div>
    <div className="collection-stats"><MiniStat label="DEX" value={pokemon.length} sub="loaded" /><MiniStat label="CAUGHT" value={caught.length} sub="collection" /><MiniStat label="FAV" value={favorites.length} sub="saved" /><MiniStat label="TEAM" value={`${team.length}/6`} sub="active" /></div>
    <div className="toolbar glass"><label className="search-wrap"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} type="search" placeholder="Name, #ID or ability..." autoComplete="off" /></label><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option>{types.map((t) => <option key={t} value={t}>{cap(t)} · {typeCounts[t] || 0}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All collection</option><option value="caught">Caught</option><option value="uncaught">Uncaught</option></select><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="id">National Dex</option><option value="name">A → Z</option><option value="bst">BST ↓</option><option value="hp">HP ↓</option><option value="attack">Attack ↓</option><option value="speed">Speed ↓</option></select><button className={`tool-btn ${favoritesOnly ? 'selected' : ''}`} onClick={() => setFavoritesOnly((v) => !v)}>{favoritesOnly ? '♥ Favorites' : '♡ Favorites'}</button></div>
    <div className="section-head"><div><span className="eyebrow">COLLECTION</span><h2>Pokémon <span>{filtered.length}</span></h2></div><button className="ghost-btn" onClick={reset}>Reset filters</button></div>
    {filtered.length ? <div className="card-grid">{filtered.map((p) => <PokemonCard key={p.id} pokemon={p} onOpen={setSelected} />)}</div> : <div className="empty-state"><div>🔎</div><h3>No Pokémon found</h3><p>Try another name, ability, type or collection filter.</p></div>}
    {selected && <PokemonModal pokemon={selected} allPokemon={pokemon} onClose={() => setSelected(null)} />}
  </section>;
}
function MiniStat({ label, value, sub }) { return <div className="mini-stat glass"><span>{label}</span><b>{value}</b><small>{sub}</small></div>; }
function stat(pokemon, name) { return pokemon.stats.find((item) => item.stat.name === name)?.base_stat || 0; }
