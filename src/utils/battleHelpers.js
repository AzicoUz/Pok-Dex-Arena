import { statValue } from './pokemonHelpers';

const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, rock: 2, steel: 2, flying: 0 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, fairy: 2, steel: 0.5 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const STATUS_META = {
  burn: { label: 'Burn', icon: '🔥' },
  poison: { label: 'Poison', icon: '☠' },
  paralysis: { label: 'Paralyzed', icon: '⚡' },
  sleep: { label: 'Sleep', icon: '💤' },
  freeze: { label: 'Frozen', icon: '❄' },
};

export const getBattleLevel = (pokemon) => 10 + Math.min(40, Math.floor((pokemon?.id || 1) / 8));

export const getMaxHp = (pokemon) => {
  const baseHp = statValue(pokemon, 'hp');
  const level = getBattleLevel(pokemon);
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 18;
};

export const getTypeEffectiveness = (moveType, defender) =>
  (defender?.types || []).reduce((multiplier, item) => multiplier * (TYPE_CHART[moveType]?.[item.type.name] ?? 1), 1);

export const formatEffectiveness = (value) => {
  if (value === 0) return { label: 'No effect', tone: 'immune' };
  if (value >= 4) return { label: '4× SUPER EFFECTIVE!', tone: 'super' };
  if (value > 1) return { label: 'SUPER EFFECTIVE!', tone: 'super' };
  if (value < 1) return { label: 'Not very effective…', tone: 'weak' };
  return { label: '', tone: 'normal' };
};

export function getAbilityName(pokemon) {
  return pokemon?.abilities?.find((entry) => !entry.is_hidden)?.ability?.name || pokemon?.abilities?.[0]?.ability?.name || '';
}

export function getAbilityLabel(pokemon) {
  const name = getAbilityName(pokemon);
  return name ? name.replaceAll('-', ' ') : 'No ability';
}

export function calculateDamage(attacker, defender, move, attackerStatus = '', criticalOverride = null) {
  const moveType = move?.type?.name || 'normal';
  const physical = move?.damage_class?.name === 'physical';
  let attack = statValue(attacker, physical ? 'attack' : 'special-attack');
  const defense = Math.max(1, statValue(defender, physical ? 'defense' : 'special-defense'));
  const level = getBattleLevel(attacker);
  const power = Math.max(25, move?.power || 45);
  const ability = getAbilityName(attacker);
  const defenderAbility = getAbilityName(defender);

  if (physical && attackerStatus === 'burn') attack = Math.max(1, Math.floor(attack * 0.5));
  if (ability === 'blaze' && moveType === 'fire' && statValue(attacker, 'hp') > 0) {
    // A simple low-HP style passive for the arena simulator.
    attack *= 1 + (moveType === primaryTypeFromPokemon(attacker) ? 0.05 : 0);
  }

  let effectiveness = getTypeEffectiveness(moveType, defender);
  if (defenderAbility === 'levitate' && moveType === 'ground') effectiveness = 0;

  const stab = (attacker?.types || []).some((item) => item.type.name === moveType) ? 1.5 : 1;
  const critical = criticalOverride ?? Math.random() < 0.08;
  const random = 0.85 + Math.random() * 0.15;
  const base = Math.floor((((2 * level) / 5 + 2) * power * attack) / defense / 4) + 2;
  const damage = Math.max(0, Math.floor(base * stab * effectiveness * (critical ? 1.5 : 1) * random));
  const accuracy = move?.accuracy == null ? 100 : move.accuracy;
  const hits = Math.random() * 100 <= accuracy;
  const statusChance = move?.meta?.ailment?.name && move?.meta?.ailment_chance ? move.meta.ailment_chance : 0;
  const inflictsStatus = hits && statusChance > 0 && Math.random() * 100 < statusChance;

  return {
    damage: hits ? damage : 0,
    hits,
    critical: critical && hits,
    effectiveness,
    statusChance,
    inflictsStatus,
    status: move?.meta?.ailment?.name || '',
    ...formatEffectiveness(effectiveness),
  };
}

function primaryTypeFromPokemon(pokemon) {
  return pokemon?.types?.[0]?.type?.name || 'normal';
}

export const pickRandom = (items) => items?.[Math.floor(Math.random() * items.length)];

export function chooseCpuMove(moves) {
  const usable = (moves || []).filter((move) => (move.pp ?? 0) > 0);
  return pickRandom(usable) || pickRandom(moves || []);
}

export function createCpuTeam(pool, playerTeam = []) {
  const avoid = new Set(playerTeam.map((pokemon) => pokemon.id));
  const candidates = pool.filter((pokemon) => !avoid.has(pokemon.id));
  const source = candidates.length >= 6 ? candidates : pool;
  const picked = [];
  const used = new Set();

  while (picked.length < Math.min(6, source.length)) {
    const pokemon = pickRandom(source);
    if (!used.has(pokemon.id)) {
      used.add(pokemon.id);
      picked.push(pokemon);
    }
  }

  return picked;
}

export function orderBySpeed(first, second, firstMove, secondMove) {
  const firstPriority = firstMove?.priority || 0;
  const secondPriority = secondMove?.priority || 0;
  if (firstPriority !== secondPriority) return firstPriority > secondPriority ? 'first' : 'second';

  const firstSpeed = statValue(first, 'speed') * (firstMove ? 1 : 0);
  const secondSpeed = statValue(second, 'speed') * (secondMove ? 1 : 0);
  if (firstSpeed === secondSpeed) return Math.random() < 0.5 ? 'first' : 'second';
  return firstSpeed > secondSpeed ? 'first' : 'second';
}

export function applyEndTurnStatus(combatant) {
  if (!combatant?.status) return { combatant, damage: 0, message: '' };
  const fraction = combatant.status === 'burn' ? 16 : combatant.status === 'poison' ? 8 : 0;
  if (!fraction) return { combatant, damage: 0, message: '' };
  const damage = Math.max(1, Math.floor(combatant.maxHp / fraction));
  return {
    combatant: { ...combatant, hp: Math.max(0, combatant.hp - damage) },
    damage,
    message: `${combatant.name || combatant.pokemon?.name} took ${damage} ${combatant.status} damage.`,
  };
}

export function statusCanAct(status) {
  if (status === 'sleep') return Math.random() >= 0.65;
  if (status === 'freeze') return Math.random() >= 0.8;
  if (status === 'paralysis') return Math.random() >= 0.2;
  return true;
}

export function applyStatus(combatant, status) {
  if (!status || status === 'none') return { combatant, applied: false };
  if (combatant.status) return { combatant, applied: false };
  return { combatant: { ...combatant, status }, applied: true };
}
