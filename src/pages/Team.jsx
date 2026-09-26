import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';
import { cap, getArtwork, getTypes, primaryType, statValue, totalStats } from '../utils/pokemonHelpers';

export default function Team() {
  const { team, removeFromTeam, moveTeamMember } = useApp();
  const total = team.reduce((sum, p) => sum + totalStats(p), 0);
  const avgSpeed = team.length ? Math.round(team.reduce((sum, p) => sum + statValue(p, 'speed'), 0) / team.length) : 0;
  const typeList = [...new Set(team.flatMap(getTypes))];

  const onDragStart = (event, index) => event.dataTransfer.setData('text/plain', String(index));
  const onDrop = (event, index) => {
    event.preventDefault();
    const from = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(from)) moveTeamMember(from, index);
  };

  return (
    <section className="view active-view">
      <SectionTitle eyebrow="TRAINER LAB" title="My" highlight="Team" description="Drag slots to reorder your six-fighter squad. The lineup becomes your default battle team." />
      <div className="team-overview">
        <div className="mini-stat glass"><span>SLOTS</span><b>{team.length}/6</b><small>filled</small></div>
        <div className="mini-stat glass"><span>BST</span><b>{total || '—'}</b><small>combined</small></div>
        <div className="mini-stat glass"><span>SPD</span><b>{avgSpeed || '—'}</b><small>average</small></div>
        <div className="mini-stat glass"><span>TYPES</span><b>{typeList.length || '—'}</b><small>coverage</small></div>
      </div>

      <div className="team-layout">
        <div className="team-panel glass">
          <div className="panel-head"><h3>Active Squad</h3><span>drag & drop</span></div>
          <div className="team-slots team-slots-upgraded">
            {Array.from({ length: 6 }, (_, index) => team[index]).map((pokemon, index) => (
              <div
                key={pokemon?.name || `empty-${index}`}
                className={`team-slot ${pokemon ? 'filled draggable-slot' : 'empty'}`}
                draggable={Boolean(pokemon)}
                onDragStart={(event) => pokemon && onDragStart(event, index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => pokemon && onDrop(event, index)}
              >
                <span className="slot-index">0{index + 1}</span>
                {pokemon ? <>
                  <img src={getArtwork(pokemon)} alt={pokemon.name} />
                  <div><b>{cap(pokemon.name)}</b><small>{getTypes(pokemon).map(cap).join(' / ')} · SPD {statValue(pokemon, 'speed')}</small></div>
                  <button onClick={() => removeFromTeam(pokemon.name)} aria-label={`Remove ${pokemon.name}`}>×</button>
                </> : <><span className="empty-plus">＋</span><small>Open a Pokémon to add it</small></>}
              </div>
            ))}
          </div>
        </div>

        <div className="team-side glass">
          <div className="team-badge">◈</div>
          <p className="eyebrow">SQUAD ANALYSIS</p>
          <h3>Build around coverage.</h3>
          <p>{typeList.length ? `Your current lineup covers ${typeList.map(cap).join(', ')}.` : 'Add Pokémon from the Pokédex to unlock squad analytics.'}</p>
          <div className="coverage-list">
            {typeList.map((type) => <span key={type} className="type-pill" style={{ '--type': `var(--${type})` }}>{cap(type)}</span>)}
          </div>
          <div className="team-side-actions"><Link className="primary-btn" to="/battle">Enter 6v6 Arena →</Link><Link className="ghost-btn" to="/evolution">Open Evolution Lab</Link><Link className="ghost-btn" to="/inventory">Open Inventory</Link></div>
        </div>
      </div>
    </section>
  );
}
