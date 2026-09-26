import SectionTitle from '../components/SectionTitle';
import { useApp } from '../context/AppContext';

const regions = [
  ['Kanto', 'Gen I', 151, true, '1–151'], ['Johto', 'Gen II', 100, false, '152–251'], ['Hoenn', 'Gen III', 135, false, '252–386'], ['Sinnoh', 'Gen IV', 107, false, '387–493'], ['Unova', 'Gen V', 156, false, '494–649'], ['Kalos', 'Gen VI', 72, false, '650–721'], ['Alola', 'Gen VII', 88, false, '722–809'], ['Galar', 'Gen VIII', 96, false, '810–905'], ['Paldea', 'Gen IX', 120, false, '906–1025'],
];

export default function Regions() {
  const { caught } = useApp();
  return <section className="view active-view"><SectionTitle eyebrow="WORLD MAP" title="Explore" highlight="Regions" description="The current release ships with the original Kanto set. The data architecture is ready to extend into later generations." /><div className="region-hero glass"><div><p className="eyebrow">CURRENT REGION</p><h3>Kanto <span>01</span></h3><p>151 Pokémon available · {caught.length}/151 caught in your collection.</p></div><div className="region-orb">01</div></div><div className="region-grid">{regions.map(([name, gen, count, unlocked, dex]) => <article key={name} className={`glass region-card ${unlocked ? 'unlocked' : 'locked'}`}><div className="region-number">{gen.replace('Gen ', '')}</div><div className="region-copy"><span>{gen}</span><h3>{name}</h3><p>{count} species · Dex {dex}</p></div><div className="region-status">{unlocked ? 'OPEN' : 'LOCKED'}</div></article>)}</div></section>;
}
