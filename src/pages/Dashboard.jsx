import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';
import { cap, getArtwork, statValue, totalStats } from '../utils/pokemonHelpers';

export default function Dashboard({ pokemon }) {
  const { profile, team, caught, inventory, favorites, level, currentXp, collectionPct } = useApp();
  const featured = team[0] || pokemon[24] || pokemon[0] || null;
  const strongest = pokemon.length ? [...pokemon].sort((a, b) => totalStats(b) - totalStats(a))[0] : null;
  const ballTotal = inventory['poke-ball'] + inventory['great-ball'] + inventory['ultra-ball'];
  const winRate = profile.battles ? Math.round((profile.wins / profile.battles) * 100) : 0;
  const activities = profile.recentActivity?.slice(0, 4) || [];

  if (!featured || !strongest) {
    return (
      <section className="view active-view">
        <div className="glass empty-state startup-empty">
          <div>◈</div>
          <h2>Pokédex data is warming up</h2>
          <p>The arena is ready, but Pokémon data has not finished loading yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="view active-view">
      <div className="dashboard-hero glass">
        <div>
          <p className="eyebrow">AZICO TRAINER HQ</p>
          <h1>Welcome back, <span>{profile.name}</span>.</h1>
          <p className="hero-copy">Your Kanto journey is active. Catch rare Pokémon, build a six-fighter squad and push your trainer level through the Arena.</p>
          <div className="dashboard-actions"><Link className="primary-btn" to="/battle">Enter Battle →</Link><Link className="ghost-btn" to="/catch">Find Wild Pokémon</Link></div>
        </div>
        <div className="dashboard-mascot"><img src={getArtwork(featured)} alt={featured?.name || 'Pokémon'} /><span>ACTIVE LEAD · {cap(featured?.name || 'Starter')}</span></div>
      </div>

      <div className="kpi-grid">
        <Kpi label="TRAINER LV" value={level} sub={`${currentXp}/100 XP`} icon="⚡" />
        <Kpi label="CAUGHT" value={`${caught.length}/151`} sub={`${collectionPct}% collection`} icon="◈" />
        <Kpi label="WIN RATE" value={`${winRate}%`} sub={`${profile.wins}W · ${profile.losses}L`} icon="🏆" />
        <Kpi label="BALLS" value={ballTotal} sub="capture inventory" icon="◉" />
      </div>

      <div className="dashboard-grid">
        <div className="glass dashboard-panel daily-mission">
          <div className="panel-head"><h3>Daily Mission</h3><span>+50 XP</span></div>
          <div className="mission-icon">🎯</div>
          <p className="eyebrow">TODAY'S ROUTE</p>
          <h3>Catch 1 new Pokémon</h3>
          <p>Head to the Wild Zone and add a new species to your collection.</p>
          <div className="mission-bar"><span style={{ width: `${Math.min(100, profile.catches % 2 ? 100 : 18)}%` }} /></div>
          <Link className="primary-btn" to="/catch">Start mission</Link>
        </div>

        <div className="glass dashboard-panel featured-panel">
          <div className="panel-head"><h3>Power Index</h3><span>Top base stats</span></div>
          <div className="featured-pokemon"><img src={getArtwork(strongest)} alt={strongest.name} /><div><span className="dex-id">#{String(strongest.id).padStart(3, '0')}</span><h3>{cap(strongest.name)}</h3><p>BST {totalStats(strongest)} · SPD {statValue(strongest, 'speed')}</p><Link className="text-link" to="/pokedex">Inspect Pokédex →</Link></div></div>
        </div>

        <div className="glass dashboard-panel activity-panel">
          <div className="panel-head"><h3>Recent Activity</h3><Link className="text-link" to="/profile">Profile →</Link></div>
          {activities.length ? activities.map((item, index) => <div className="activity-row" key={`${item.at}-${index}`}><span>{index === 0 ? '✦' : '•'}</span><div><b>{item.label}</b><small>{item.meta}</small></div><time>{timeAgo(item.at)}</time></div>) : <p className="muted-copy">Your recent catches and battles will appear here.</p>}
        </div>

        <div className="glass dashboard-panel quick-panel">
          <div className="panel-head"><h3>Quick Launch</h3><span>train faster</span></div>
          <div className="quick-links"><Link to="/pokedex"><span>▣</span> Pokédex <b>151</b></Link><Link to="/team"><span>◈</span> Squad <b>{team.length}/6</b></Link><Link to="/inventory"><span>🎒</span> Inventory <b>{Object.values(inventory).reduce((a, b) => a + b, 0)}</b></Link><Link to="/games"><span>🎮</span> Mini Games <b>{profile.miniGameWins} wins</b></Link></div>
        </div>

        <div className="glass dashboard-panel collection-panel">
          <div className="panel-head"><h3>Collection Progress</h3><span>{favorites.length} favorites</span></div>
          <div className="collection-big"><b>{caught.length}</b><span>/ 151 caught</span></div>
          <div className="progress"><span style={{ width: `${collectionPct}%` }} /></div>
          <div className="collection-meta"><span>First 151 Pokémon</span><b>{collectionPct}%</b></div>
          <Link className="ghost-btn" to="/regions">Explore regions</Link>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, sub, icon }) {
  return <div className="kpi-card glass"><span className="kpi-icon">{icon}</span><div><span>{label}</span><b>{value}</b><small>{sub}</small></div></div>;
}

function timeAgo(value) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
