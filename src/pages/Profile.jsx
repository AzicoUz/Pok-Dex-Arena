import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';

const achievementList = [
  ['🎒', 'First Catch', 'Capture your first Pokémon', (p) => p.catches >= 1],
  ['⚔️', 'Arena Rookie', 'Win your first battle', (p) => p.wins >= 1],
  ['👑', 'Team Builder', 'Fill all six team slots', (_, team) => team.length === 6],
  ['☄', 'KO Collector', 'Score 10 knockouts', (p) => p.knockouts >= 10],
  ['💯', 'Collector', 'Catch 10 Pokémon', (p) => p.catches >= 10],
  ['🔥', 'Win Streak', 'Reach a 3 battle win streak', (p) => p.bestStreak >= 3],
  ['🎮', 'Arcade Ace', 'Win 5 mini-games', (p) => p.miniGameWins >= 5],
  ['🌎', 'Kanto Complete', 'Catch all 151 Kanto Pokémon', (_, team, caught) => caught.length >= 151],
];

export default function Profile() {
  const { profile, setProfile, team, caught } = useApp();
  const level = Math.floor(profile.xp / 100) + 1;
  const currentXp = profile.xp % 100;
  const winRate = profile.battles ? Math.round((profile.wins / profile.battles) * 100) : 0;
  const initial = (profile.name || 'T').slice(0, 1).toUpperCase();
  const edit = () => { const next = window.prompt('Trainer name', profile.name); if (next?.trim()) setProfile((current) => ({ ...current, name: next.trim() })); };
  return (
    <section className="view active-view">
      <SectionTitle eyebrow="TRAINER DATABASE" title="Your" highlight="Profile" description="Your arena progress, collection, achievements and recent activity live here." />
      <div className="profile-hero glass"><div className="avatar-large">{initial}</div><div><p className="eyebrow">TRAINER PROFILE</p><h2>{profile.name}</h2><p>Level {level} · {profile.streak > 0 ? `${profile.streak} win streak` : 'Ready for the next battle'}</p></div><div className="profile-actions"><button className="ghost-btn" onClick={edit}>Edit profile</button><Link className="ghost-btn" to="/settings">Settings</Link></div></div>
      <div className="stats-grid"><Stat icon="⚡" value={level} label="Trainer Level" /><Stat icon="⭐" value={profile.xp} label="XP" /><Stat icon="🏆" value={profile.wins} label="Wins" /><Stat icon="☄" value={profile.knockouts} label="KOs" /><Stat icon="📊" value={`${winRate}%`} label="Win Rate" /><Stat icon="◈" value={`${caught.length}/151`} label="Caught" /><Stat icon="🎮" value={profile.miniGameWins} label="Mini-game wins" /><Stat icon="🔥" value={profile.bestStreak} label="Best streak" /></div>
      <div className="profile-grid profile-grid-3"><div className="glass progress-panel"><div className="panel-head"><h3>Trainer Progress</h3><span>{currentXp} / 100 XP</span></div><div className="progress"><span style={{ width: `${currentXp}%` }} /></div><p>Every battle, catch and mini-game pushes Azico toward the next trainer level.</p></div><div className="glass achievements"><div className="panel-head"><h3>Achievements</h3><span>{achievementList.filter(([, , , fn]) => fn(profile, team, caught)).length}/{achievementList.length}</span></div>{achievementList.map(([icon, title, subtitle, fn]) => <Achievement key={title} done={fn(profile, team, caught)} icon={icon} title={title} subtitle={subtitle} />)}</div><div className="glass recent-battles"><div className="panel-head"><h3>Recent Battles</h3><span>{profile.battles}</span></div>{profile.recentBattles?.length ? profile.recentBattles.slice(0, 5).map((battle, index) => <div className="history-row" key={`${battle.at}-${index}`}><span className={`history-result ${battle.result}`}>{battle.result === 'win' ? 'W' : 'L'}</span><div><b>{battle.result === 'win' ? 'Victory' : 'Defeat'}</b><small>{battle.knockouts} KOs · +{battle.xp} XP</small></div><time>{formatAgo(battle.at)}</time></div>) : <p className="muted-copy">Your battle history will appear here.</p>}</div></div>
    </section>
  );
}
function Stat({ icon, value, label }) { return <div className="stat-card"><span>{icon}</span><b>{value}</b><small>{label}</small></div>; }
function Achievement({ done, icon, title, subtitle }) { return <div className={`achievement-row ${done ? 'done' : ''}`}><span>{icon}</span><div><b>{title}</b><small>{subtitle}</small></div><i>{done ? '✓' : '—'}</i></div>; }
function formatAgo(dateString) { const seconds = Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 1000)); if (seconds < 60) return 'now'; const minutes = Math.round(seconds / 60); if (minutes < 60) return `${minutes}m`; const hours = Math.round(minutes / 60); if (hours < 24) return `${hours}h`; return `${Math.round(hours / 24)}d`; }
