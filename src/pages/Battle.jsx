import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { fetchMoveSet } from '../services/pokemonApi';
import { useApp } from '../context/AppContext';
import { cap, getArtwork, getTypes, primaryType, statValue } from '../utils/pokemonHelpers';
import {
  STATUS_META,
  applyEndTurnStatus,
  applyStatus,
  calculateDamage,
  chooseCpuMove,
  createCpuTeam,
  getAbilityLabel,
  getBattleLevel,
  getMaxHp,
  orderBySpeed,
  statusCanAct,
} from '../utils/battleHelpers';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildCombatant(pokemon) {
  return {
    pokemon,
    hp: getMaxHp(pokemon),
    maxHp: getMaxHp(pokemon),
    status: '',
    moves: [],
    pp: {},
    fainted: false,
  };
}

function buildTeam(team) {
  return team.map(buildCombatant);
}

export default function Battle({ pokemon }) {
  const { team, profile, recordBattle, notify, useInventoryItem, settings, inventory } = useApp();
  const choices = useMemo(() => (team.length ? team : pokemon.slice(0, 6)), [team, pokemon]);
  const [selectedStarter, setSelectedStarter] = useState(choices[0]);
  const [playerTeam, setPlayerTeam] = useState([]);
  const [cpuTeam, setCpuTeam] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [cpuIndex, setCpuIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [turnBusy, setTurnBusy] = useState(false);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [round, setRound] = useState(1);
  const [logs, setLogs] = useState([]);
  const [lastEffect, setLastEffect] = useState(null);
  const [flash, setFlash] = useState('');
  const [battleTime, setBattleTime] = useState(180);
  const battleRef = useRef(0);
  const playerTeamRef = useRef([]);
  const cpuTeamRef = useRef([]);

  useEffect(() => {
    if (!started && choices.length && !choices.some((item) => item.id === selectedStarter?.id)) setSelectedStarter(choices[0]);
  }, [choices, selectedStarter, started]);

  useEffect(() => {
    playerTeamRef.current = playerTeam;
    cpuTeamRef.current = cpuTeam;
  }, [playerTeam, cpuTeam]);

  useEffect(() => {
    if (!started || ended) return undefined;
    const timer = window.setInterval(() => {
      setBattleTime((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setEnded(true);
          setTurnBusy(false);
          recordBattle('loss', playerTeamRef.current.filter((fighter) => fighter.fainted || fighter.hp <= 0).length, 10);
          setLogs((current) => ['TIME OUT — the arena clock expired.', ...current].slice(0, 7));
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, ended, recordBattle]);

  const player = playerTeam[playerIndex];
  const cpu = cpuTeam[cpuIndex];

  const pushLog = (message) => setLogs((current) => [message, ...current].slice(0, 7));

  const loadMoves = async (combatant, battleId, side, targetIndex = null) => {
    if (!combatant) return [];
    try {
      const moves = await fetchMoveSet(combatant.pokemon, { count: 4 });
      if (battleRef.current !== battleId) return moves;
      const mapped = moves.map((move) => ({ ...move }));
      const pp = Object.fromEntries(mapped.map((move) => [move.id, move.pp || 10]));
      const target = targetIndex ?? (side === 'player' ? playerIndex : cpuIndex);
      const update = (current) => current.map((item, index) => index === target ? { ...item, moves: mapped, pp } : item);
      if (side === 'player') setPlayerTeam(update); else setCpuTeam(update);
      return mapped;
    } catch {
      notify('Move data could not be loaded. A fallback attack is available.');
      return [];
    }
  };

  const startBattle = async () => {
    if (!selectedStarter || !choices.length) return;
    const base = [selectedStarter, ...choices.filter((p) => p.id !== selectedStarter.id)];
    const supplements = pokemon.filter((p) => !base.some((member) => member.id === p.id));
    const nextPlayer = buildTeam([...base, ...supplements].slice(0, 6));
    const nextCpu = buildTeam(createCpuTeam(pokemon, nextPlayer.map((item) => item.pokemon)));
    const battleId = battleRef.current + 1;
    battleRef.current = battleId;

    setPlayerTeam(nextPlayer);
    setCpuTeam(nextCpu);
    setPlayerIndex(0);
    setCpuIndex(0);
    setStarted(true);
    setEnded(false);
    setTurnBusy(false);
    setLoadingMoves(true);
    setRound(1);
    setBattleTime(180);
    setLastEffect(null);
    setFlash(settings.battleAnimations ? 'start' : '');
    setLogs([]);
    pushLog(`${cap(nextPlayer[0].pokemon.name)} enters! ${cap(nextCpu[0].pokemon.name)} is waiting across the arena.`);
    pushLog(`Ability: ${cap(getAbilityLabel(nextPlayer[0].pokemon))}`);

    await Promise.all([
      loadMoves(nextPlayer[0], battleId, 'player'),
      loadMoves(nextCpu[0], battleId, 'cpu'),
    ]);
    if (battleRef.current === battleId) setLoadingMoves(false);
  };

  const resetBattle = () => {
    battleRef.current += 1;
    setStarted(false);
    setEnded(false);
    setTurnBusy(false);
    setLoadingMoves(false);
    setPlayerTeam([]);
    setCpuTeam([]);
    setPlayerIndex(0);
    setCpuIndex(0);
    setRound(1);
    setLogs([]);
    setLastEffect(null);
    setBattleTime(180);
    setFlash('');
  };

  const updateCombatant = (side, index, patch) => {
    const setter = side === 'player' ? setPlayerTeam : setCpuTeam;
    setter((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const updateActive = (side, patch) => updateCombatant(side, side === 'player' ? playerIndex : cpuIndex, patch);

  const useMove = async (move) => {
    if (!started || ended || turnBusy || loadingMoves || !player || !cpu || !move || (player.pp[move.id] ?? 0) <= 0) return;
    const battleId = battleRef.current;
    setTurnBusy(true);
    setLastEffect(null);
    setFlash(settings.battleAnimations ? 'attack-player' : '');

    let playerMove = move;
    updateActive('player', { pp: { ...player.pp, [move.id]: Math.max(0, (player.pp[move.id] ?? 0) - 1) } });
    const currentCpu = cpu;
    const currentPlayer = player;
    const cpuMove = chooseCpuMove(currentCpu.moves);
    const order = orderBySpeed(currentPlayer.pokemon, currentCpu.pokemon, playerMove, cpuMove);

    const execute = async (side) => {
      const attacker = side === 'player' ? playerTeamRef.current[playerIndex] : cpuTeamRef.current[cpuIndex];
      const defender = side === 'player' ? cpuTeamRef.current[cpuIndex] : playerTeamRef.current[playerIndex];
      const attackMove = side === 'player' ? playerMove : cpuMove;
      if (!attacker || !defender || defender.hp <= 0 || !attackMove) return false;

      const updatedPP = side === 'cpu' ? { ...attacker.pp, [attackMove.id]: Math.max(0, (attacker.pp[attackMove.id] ?? 1) - 1) } : attacker.pp;
      if (side === 'cpu') updateActive('cpu', { pp: updatedPP });

      if (!statusCanAct(attacker.status)) {
        const blocked = STATUS_META[attacker.status]?.label || attacker.status;
        pushLog(`${cap(attacker.pokemon.name)} is ${blocked.toLowerCase()} and cannot move!`);
        return defender.hp <= 0;
      }

      const result = calculateDamage(attacker.pokemon, defender.pokemon, attackMove, attacker.status);
      const nextHp = Math.max(0, defender.hp - result.damage);
      updateCombatant(side === 'player' ? 'cpu' : 'player', side === 'player' ? cpuIndex : playerIndex, { hp: nextHp, fainted: nextHp <= 0 });

      if (settings.battleAnimations) setFlash(`attack-${side}`);
      if (!result.hits) {
        pushLog(`${cap(attacker.pokemon.name)} used ${cap(attackMove.name)} — it missed.`);
      } else {
        let message = `${cap(attacker.pokemon.name)} used ${cap(attackMove.name)} for ${result.damage} damage.`;
        if (result.critical) message += ' Critical hit!';
        if (result.label) message += ` ${result.label}`;
        pushLog(message);
        setLastEffect({ type: result.tone, text: result.label || `${result.damage} DMG` });
      }

      if (result.inflictsStatus && nextHp > 0) {
        const targetSide = side === 'player' ? 'cpu' : 'player';
        const targetIndex = targetSide === 'player' ? playerIndex : cpuIndex;
        const targetState = targetSide === 'player' ? playerTeamRef.current[targetIndex] : cpuTeamRef.current[targetIndex];
        const applied = applyStatus(targetState, result.status);
        if (applied.applied) {
          updateCombatant(targetSide, targetIndex, { status: result.status });
          pushLog(`${cap(targetState.pokemon.name)} was afflicted with ${STATUS_META[result.status]?.label || result.status}.`);
        }
      }
      await wait(430);
      return nextHp <= 0;
    };

    const first = order === 'first' ? 'player' : 'cpu';
    const second = first === 'player' ? 'cpu' : 'player';
    const firstFainted = await execute(first);
    if (battleRef.current !== battleId) return;
    await wait(220);
    if (!firstFainted) await execute(second);
    if (battleRef.current !== battleId) return;

    const pAfter = playerTeamRef.current[playerIndex];
    const cAfter = cpuTeamRef.current[cpuIndex];

    let nextCpuIndex = cpuIndex;
    let nextPlayerIndex = playerIndex;
    let playerWon = false;
    let cpuWon = false;

    if (cAfter?.hp <= 0) {
      nextCpuIndex = cpuIndex + 1;
      if (nextCpuIndex >= cpuTeamRef.current.length) playerWon = true;
      else pushLog(`${cap(cAfter.pokemon.name)} fainted! CPU sends its next fighter.`);
    }
    if (pAfter?.hp <= 0) {
      nextPlayerIndex = playerIndex + 1;
      if (nextPlayerIndex >= playerTeamRef.current.length) cpuWon = true;
      else pushLog(`${cap(pAfter.pokemon.name)} fainted! Choose your next fighter.`);
    }

    const pStatusTick = applyEndTurnStatus(pAfter);
    const cStatusTick = applyEndTurnStatus(cAfter);
    if (pStatusTick.damage) {
      updateCombatant('player', playerIndex, pStatusTick.combatant);
      pushLog(pStatusTick.message);
      if (pStatusTick.combatant.hp <= 0) nextPlayerIndex = playerIndex + 1;
    }
    if (cStatusTick.damage) {
      updateCombatant('cpu', cpuIndex, cStatusTick.combatant);
      pushLog(cStatusTick.message);
      if (cStatusTick.combatant.hp <= 0) nextCpuIndex = cpuIndex + 1;
    }

    if (playerWon) {
      setEnded(true);
      setTurnBusy(false);
      recordBattle('win', cpuTeamRef.current.filter((fighter) => fighter.fainted || fighter.hp <= 0).length, 150);
      pushLog('VICTORY — your six-fighter squad cleared the arena! +150 XP');
      return;
    }
    if (cpuWon) {
      setEnded(true);
      setTurnBusy(false);
      recordBattle('loss', playerTeamRef.current.filter((fighter) => fighter.fainted || fighter.hp <= 0).length, 25);
      pushLog('DEFEAT — regroup, edit your lineup and challenge the arena again.');
      return;
    }

    if (nextCpuIndex !== cpuIndex && nextCpuIndex < cpuTeamRef.current.length) {
      setCpuIndex(nextCpuIndex);
      setLoadingMoves(true);
      await wait(350);
      const next = cpuTeamRef.current[nextCpuIndex];
      const moves = await loadMoves(next, battleId, 'cpu', nextCpuIndex);
      if (battleRef.current !== battleId) return;
      setLoadingMoves(false);
      pushLog(`${cap(next.pokemon.name)} joins the arena!`);
    }

    if (nextPlayerIndex !== playerIndex && nextPlayerIndex < playerTeamRef.current.length) {
      setTurnBusy(false);
      setPlayerIndex(nextPlayerIndex);
      pushLog('Choose your next fighter before attacking.');
    } else {
      setTurnBusy(false);
    }

    setRound((value) => value + 1);
  };

  const useBattleItem = (item) => {
    if (!player || turnBusy || ended) return;
    const amount = item === 'super-potion' ? 50 : 20;
    if (!useInventoryItem(item)) return;
    const nextHp = Math.min(player.maxHp, player.hp + amount);
    updateCombatant('player', playerIndex, { hp: nextHp });
    pushLog(`You used ${item.replaceAll('-', ' ')} on ${cap(player.pokemon.name)} (+${nextHp - player.hp} HP).`);
    setTurnBusy(true);
    window.setTimeout(() => setTurnBusy(false), 380);
  };

  const switchPlayer = async (index) => {
    if (!started || ended || turnBusy || loadingMoves || index === playerIndex) return;
    const fighter = playerTeam[index];
    if (!fighter || fighter.hp <= 0 || fighter.fainted) return;
    setTurnBusy(true);
    const battleId = battleRef.current;
    setPlayerIndex(index);
    setLoadingMoves(true);
    pushLog(`You sent out ${cap(fighter.pokemon.name)}!`);
    await loadMoves(fighter, battleId, 'player');
    if (battleRef.current !== battleId) return;
    setLoadingMoves(false);
    setTurnBusy(false);
  };

  const playerNeedsSwitch = player?.hp <= 0 || player?.fainted;
  const usableMoves = player?.moves?.filter((move) => (player.pp[move.id] ?? 0) > 0) || [];
  const canBattle = started && !ended && !turnBusy && !loadingMoves && !playerNeedsSwitch;
  const inventoryCount = (item) => inventory[item] || 0;

  return (
    <section className="view active-view">
      <SectionTitle eyebrow="TRAINER ARENA" title="6v6" highlight="Battle" description="Choose moves, exploit type matchups, manage PP and survive status effects." />

      {!started ? (
        <div className="battle-stage glass battle-setup">
          <div className="setup-copy"><p className="eyebrow">BATTLE 4.0</p><h3>Assemble your lead.</h3><p>Your saved team is used as the player squad. If fewer than six are saved, the arena fills the remaining slots from the loaded Pokédex.</p></div>
          <div className="setup-picks">{choices.slice(0, 6).map((item) => <button key={item.id} className={`battle-pick ${selectedStarter?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedStarter(item)}><img src={getArtwork(item)} alt={item.name} /><b>{cap(item.name)}</b><small>Lv {getBattleLevel(item)}</small></button>)}</div>
          <div className="setup-actions"><button className="primary-btn" onClick={startBattle}>Start 6v6 Battle →</button><span>First team to faint all six Pokémon loses.</span></div>
        </div>
      ) : (
        <>
          <div className={`battle-stage glass ${flash ? `flash-${flash}` : ''}`}>
            <div className="battle-hud"><span className="round-badge">ROUND {round}</span><span className="battle-score">{profile.name} · {profile.wins}W / {profile.losses}L</span><span className="hud-timer">⏱ {formatTimer(battleTime)}</span><span className={`vs ${lastEffect?.type || ''}`}>{lastEffect?.text || 'FIGHT!'}</span></div>

            <div className="battle-teams-strip"><TeamStatus team={playerTeam} activeIndex={playerIndex} /><div className="mini-vs">VS</div><TeamStatus team={cpuTeam} activeIndex={cpuIndex} enemy /></div>

            <div className="arena arena-6v6">
              <Fighter combatant={player} side="player" />
              <div className="arena-center"><div className="arena-orb">VS</div><p>{turnBusy ? 'Resolving turn…' : ended ? 'Battle complete' : playerNeedsSwitch ? 'Switch required' : 'Choose a move'}</p></div>
              <Fighter combatant={cpu} side="enemy" />
            </div>

            {playerNeedsSwitch && !ended ? <div className="switch-panel"><p className="eyebrow">FORCED SWITCH</p><h3>Choose your next fighter</h3><div className="switch-list">{playerTeam.map((fighter, index) => <button key={fighter.pokemon.id} className="switch-pick" disabled={fighter.hp <= 0 || fighter.fainted} onClick={() => switchPlayer(index)}><img src={getArtwork(fighter.pokemon)} alt="" /><span>{cap(fighter.pokemon.name)}<small>{fighter.hp}/{fighter.maxHp} HP</small></span></button>)}</div></div> : <><div className="move-actions">{loadingMoves ? <div className="move-loading">Syncing move data from PokéAPI…</div> : usableMoves.map((move) => <button key={move.id} className="move-btn" disabled={!canBattle} onClick={() => useMove(move)} style={{ '--type': `var(--${move.type.name})` }}><span className="move-type">{cap(move.type.name)}</span><b>{cap(move.name.replaceAll('-', ' '))}</b><small>{move.damage_class?.name || 'move'} · Pow {move.power || '—'} · Acc {move.accuracy || '—'}</small><strong>PP {player.pp[move.id]}/{move.pp || 10}</strong></button>)}</div><div className="battle-items"><span>FIELD KIT</span><button className="battle-item" disabled={!canBattle || !inventoryCount('potion')} onClick={() => useBattleItem('potion')}>Potion +20 <b>×{inventoryCount('potion')}</b></button><button className="battle-item" disabled={!canBattle || !inventoryCount('super-potion')} onClick={() => useBattleItem('super-potion')}>Super +50 <b>×{inventoryCount('super-potion')}</b></button><span className="battle-timer">⏱ {formatTimer(battleTime)}</span></div></>}

            <div className="battle-log"><div className="panel-head"><h3>Battle Log</h3><span>live</span></div>{logs.length ? logs.map((entry, index) => <p key={`${entry}-${index}`} className={index === 0 ? 'latest-log' : ''}>{entry}</p>) : <p>Battle events will appear here.</p>}</div>
          </div>
          <div className="battle-footer-actions"><button className="ghost-btn" onClick={resetBattle}>← Exit battle</button><span>Type matchups and status effects are simplified for this frontend simulator.</span>{ended && <Link className="primary-btn" to="/profile">View results →</Link>}</div>
        </>
      )}
    </section>
  );
}

function formatTimer(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }

function Fighter({ combatant, side }) {
  if (!combatant) return <div className="fighter" />;
  const pokemon = combatant.pokemon;
  const hpPercent = combatant.maxHp ? Math.max(0, Math.round((combatant.hp / combatant.maxHp) * 100)) : 0;
  const hpClass = hpPercent <= 20 ? 'critical' : hpPercent <= 50 ? 'warning' : '';
  const status = STATUS_META[combatant.status];
  return (
    <div className={`fighter ${side} ${combatant.hp <= 0 ? 'fainted' : ''}`}>
      <div className="fighter-card glass"><div className="fighter-name-row"><h3>{cap(pokemon.name)}</h3><span>Lv {getBattleLevel(pokemon)}</span></div><div className="hp-meta"><span>HP</span><b>{combatant.hp} / {combatant.maxHp}</b></div><div className={`hp-bar ${hpClass}`}><span style={{ width: `${hpPercent}%` }} /></div><div className="fighter-types">{getTypes(pokemon).map((type) => <span key={type} style={{ '--type': `var(--${type})` }}>{cap(type)}</span>)}{status && <span className="status-chip">{status.icon} {status.label}</span>}</div><small className="ability-line">Ability · {cap(getAbilityLabel(pokemon))}</small></div><div className="fighter-art"><img src={getArtwork(pokemon)} alt={pokemon.name} /></div></div>
  );
}

function TeamStatus({ team, activeIndex, enemy }) {
  return <div className={`team-status ${enemy ? 'enemy' : ''}`}>{team.map((member, index) => <span key={member.pokemon.id} className={`${index === activeIndex ? 'active' : ''} ${member.hp <= 0 ? 'fainted' : ''}`} title={cap(member.pokemon.name)}>{member.hp <= 0 ? '×' : '●'}</span>)}</div>;
}
