import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AppContext = createContext(null);

export const PROFILE_KEY = 'pokedex-arena-react-profile-v2';
export const TEAM_KEY = 'pokedex-arena-react-team-v2';
export const FAV_KEY = 'pokedex-arena-react-favorites-v2';
export const INVENTORY_KEY = 'pokedex-arena-react-inventory-v4';
export const CAUGHT_KEY = 'pokedex-arena-react-caught-v4';
export const SETTINGS_KEY = 'pokedex-arena-react-settings-v4';

const defaultProfile = {
  name: 'Azico',
  xp: 0,
  wins: 0,
  losses: 0,
  battles: 0,
  knockouts: 0,
  catches: 0,
  miniGameWins: 0,
  streak: 0,
  bestStreak: 0,
  recentBattles: [],
  recentActivity: [],
};

const defaultInventory = {
  'poke-ball': 12,
  'great-ball': 5,
  'ultra-ball': 2,
  potion: 8,
  'super-potion': 3,
  revive: 2,
  antidote: 4,
};

const defaultSettings = {
  theme: 'dark',
  sound: true,
  battleAnimations: true,
  musicAutoplay: false,
  musicVolume: 0.22,
  musicGenre: 'all',
  audiusApiKey: '',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function AppProvider({ children }) {
  const [profile, setProfile] = useLocalStorage(PROFILE_KEY, defaultProfile);
  const [team, setTeam] = useLocalStorage(TEAM_KEY, []);
  const [favorites, setFavorites] = useLocalStorage(FAV_KEY, []);
  const [inventory, setInventory] = useLocalStorage(INVENTORY_KEY, defaultInventory);
  const [caught, setCaught] = useLocalStorage(CAUGHT_KEY, []);
  const [settings, setSettings] = useLocalStorage(SETTINGS_KEY, defaultSettings);
  const [toast, setToast] = useState('');

  const safeProfile = useMemo(() => ({ ...defaultProfile, ...profile }), [profile]);
  const safeInventory = useMemo(() => ({ ...defaultInventory, ...inventory }), [inventory]);
  const safeSettings = useMemo(() => ({ ...defaultSettings, ...settings }), [settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = safeSettings.theme;
  }, [safeSettings.theme]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 2400);
  };

  const logActivity = (label, meta = '') => {
    setProfile((current) => ({
      ...defaultProfile,
      ...current,
      recentActivity: [
        { label, meta, at: new Date().toISOString() },
        ...(current.recentActivity || []),
      ].slice(0, 10),
    }));
  };

  const toggleFavorite = (pokemon) => {
    setFavorites((current) => {
      const exists = current.includes(pokemon.name);
      const next = exists ? current.filter((name) => name !== pokemon.name) : [...current, pokemon.name];
      notify(exists ? `${pokemon.name} removed from favorites.` : `${pokemon.name} added to favorites.`);
      return next;
    });
  };

  const addToTeam = (pokemon) => {
    if (team.some((item) => item.name === pokemon.name)) {
      notify(`${pokemon.name} is already on your team.`);
      return false;
    }
    if (team.length >= 6) {
      notify('Your team already has 6 Pokémon.');
      return false;
    }
    setTeam([...team, pokemon]);
    notify(`${pokemon.name} joined your team.`);
    return true;
  };

  const removeFromTeam = (name) => {
    setTeam(team.filter((item) => item.name !== name));
    notify(`${name} left your team.`);
  };

  const replaceTeamMember = (name, pokemon) => {
    setTeam((current) => current.map((item) => item.name === name ? pokemon : item));
    notify(`${name} evolved into ${pokemon.name}.`);
  };

  const moveTeamMember = (fromIndex, toIndex) => {
    setTeam((current) => {
      if (fromIndex === toIndex || !current[toIndex] || !current[fromIndex]) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const catchPokemon = (pokemon) => {
    if (caught.includes(pokemon.id)) {
      notify(`${pokemon.name} is already in your collection.`);
      return false;
    }
    setCaught((current) => [...current, pokemon.id]);
    setProfile((current) => ({
      ...defaultProfile,
      ...current,
      catches: (current.catches || 0) + 1,
      xp: (current.xp || 0) + 35,
    }));
    logActivity(`Caught ${pokemon.name}`, '+35 XP');
    notify(`Caught ${pokemon.name}! +35 XP`);
    return true;
  };

  const useInventoryItem = (item, amount = 1) => {
    const count = safeInventory[item] || 0;
    if (count < amount) {
      notify(`You don't have any ${item.replaceAll('-', ' ')}.`);
      return false;
    }
    setInventory((current) => ({ ...defaultInventory, ...current, [item]: Math.max(0, (current[item] || 0) - amount) }));
    return true;
  };

  const grantItem = (item, amount = 1) => {
    setInventory((current) => ({ ...defaultInventory, ...current, [item]: (current[item] || 0) + amount }));
    notify(`Received ${amount} × ${item.replaceAll('-', ' ')}.`);
  };

  const recordBattle = (result, knockouts = 0, xp = result === 'win' ? 150 : 25) => {
    setProfile((current) => {
      const safe = { ...defaultProfile, ...current };
      const nextStreak = result === 'win' ? (safe.streak || 0) + 1 : 0;
      const recentBattles = [
        { result, knockouts, xp, at: new Date().toISOString() },
        ...(safe.recentBattles || []),
      ].slice(0, 8);
      return {
        ...safe,
        xp: safe.xp + xp,
        wins: safe.wins + (result === 'win' ? 1 : 0),
        losses: safe.losses + (result === 'loss' ? 1 : 0),
        battles: safe.battles + 1,
        knockouts: safe.knockouts + knockouts,
        streak: nextStreak,
        bestStreak: Math.max(safe.bestStreak || 0, nextStreak),
        recentBattles,
      };
    });
    logActivity(result === 'win' ? 'Won an Arena battle' : 'Lost an Arena battle', `+${xp} XP · ${knockouts} KOs`);
  };

  const recordMiniGame = (won, xp = won ? 25 : 5) => {
    setProfile((current) => ({
      ...defaultProfile,
      ...current,
      xp: (current.xp || 0) + xp,
      miniGameWins: (current.miniGameWins || 0) + (won ? 1 : 0),
    }));
    logActivity(won ? 'Won a mini-game' : 'Played a mini-game', `+${xp} XP`);
  };

  const healOutsideBattle = (item, target) => {
    const amount = item === 'super-potion' ? 50 : item === 'potion' ? 20 : 0;
    if (!amount || !target) return false;
    if (!useInventoryItem(item)) return false;
    notify(`${target} recovered ${amount} HP in your field kit.`);
    return true;
  };

  const value = useMemo(
    () => ({
      profile: safeProfile,
      setProfile,
      team,
      setTeam,
      favorites,
      toggleFavorite,
      addToTeam,
      removeFromTeam,
      replaceTeamMember,
      moveTeamMember,
      inventory: safeInventory,
      caught,
      catchPokemon,
      useInventoryItem,
      grantItem,
      healOutsideBattle,
      settings: safeSettings,
      setSettings,
      recordBattle,
      recordMiniGame,
      notify,
      logActivity,
      level: Math.floor(safeProfile.xp / 100) + 1,
      currentXp: safeProfile.xp % 100,
      xpToNext: 100 - (safeProfile.xp % 100),
      collectionPct: clamp(Math.round((caught.length / 151) * 100), 0, 100),
    }),
    [safeProfile, setProfile, team, setTeam, favorites, inventory, caught, safeInventory, safeSettings, setSettings]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast && <div className="toast show" role="status">{toast}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
