import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';

const ITEMS = [
  ['poke-ball', 'Poké Ball', 'Capture tool', '◉', 'Catch'],
  ['great-ball', 'Great Ball', 'Better capture rate', '◉', 'Catch'],
  ['ultra-ball', 'Ultra Ball', 'Strong capture rate', '◉', 'Catch'],
  ['potion', 'Potion', 'Restore 20 HP in battle', '＋', 'Battle'],
  ['super-potion', 'Super Potion', 'Restore 50 HP in battle', '＋', 'Battle'],
  ['revive', 'Revive', 'Reserved for future battle recovery', '✦', 'Ready'],
  ['antidote', 'Antidote', 'Reserved for future status recovery', '☠', 'Ready'],
];

export default function Inventory() {
  const { inventory, profile } = useApp();
  const total = Object.values(inventory).reduce((sum, amount) => sum + amount, 0);
  return <section className="view active-view"><SectionTitle eyebrow="TRAINER SUPPLY DECK" title="Item" highlight="Inventory" description="Manage capture tools and field supplies. Potions and balls are consumed directly inside their game modes." /><div className="inventory-summary"><div className="mini-stat glass"><span>ITEMS</span><b>{total}</b><small>total units</small></div><div className="mini-stat glass"><span>BALLS</span><b>{inventory['poke-ball'] + inventory['great-ball'] + inventory['ultra-ball']}</b><small>capture tools</small></div><div className="mini-stat glass"><span>HEALING</span><b>{inventory.potion + inventory['super-potion']}</b><small>recovery items</small></div><div className="mini-stat glass"><span>LEVEL</span><b>{Math.floor(profile.xp / 100) + 1}</b><small>trainer level</small></div></div><div className="inventory-grid">{ITEMS.map(([id, name, desc, icon, mode]) => <article className="glass inventory-card" key={id}><div className="item-art">{icon}</div><div className="item-copy"><span className="eyebrow">{mode}</span><h3>{name}</h3><p>{desc}</p><strong>× {inventory[id] || 0}</strong></div><Link className="ghost-btn" to={mode === 'Catch' ? '/catch' : mode === 'Battle' ? '/battle' : '/profile'}>{mode === 'Catch' ? 'Use in Wild Zone' : mode === 'Battle' ? 'Use in Battle' : 'View'}</Link></article>)}</div><div className="glass inventory-note"><span>🎒</span><div><b>Supply loop</b><p>Capture tools are spent in the Wild Zone. Healing items can be used during Arena combat. This keeps inventory meaningful without an external economy.</p></div></div></section>;
}
