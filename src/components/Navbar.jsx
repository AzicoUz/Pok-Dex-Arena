import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const links = [
  ['/', 'Dashboard', true],
  ['/pokedex', 'Pokédex'],
  ['/team', 'Team'],
  ['/battle', 'Battle'],
  ['/catch', 'Catch'],
  ['/games', 'Games'],
];

export default function Navbar() {
  const { profile, settings, setSettings } = useApp();
  const initial = (profile.name || 'T').slice(0, 1).toUpperCase();
  const toggleTheme = () => setSettings((current) => ({ ...current, theme: current.theme === 'oled' ? 'light' : current.theme === 'light' ? 'dark' : 'oled' }));
  const themeLabel = settings.theme === 'dark' ? 'Dark' : settings.theme === 'light' ? 'Light' : 'OLED';

  return (
    <header className="site-header">
      <NavLink className="brand" to="/">
        <span className="brand-mark">◈</span>
        <span>PokéDex <b>Arena</b></span>
      </NavLink>
      <nav className="main-nav" aria-label="Main navigation">
        {links.map(([to, label, end]) => <NavLink key={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={to}>{label}</NavLink>)}
      </nav>
      <button className="theme-toggle" onClick={toggleTheme} title="Change theme">◐ {themeLabel}</button>
      <NavLink className="settings-link" to="/settings" title="Arena settings">⚙</NavLink><NavLink className="profile-mini" to="/profile"><span className="mini-avatar">{initial}</span><span>{profile.name || 'Trainer'}</span></NavLink>
    </header>
  );
}
