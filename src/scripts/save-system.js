import { BOXERS, resetBoxers, addBoxer } from './boxers.js';
import { setPlayerBoxer } from './player-boxer.js';
import { setMatchLog, resetMatchLog, getAllMatchLogs } from './match-log.js';
import { SoundManager } from './sound-manager.js';
import { getCurrentDate, setCurrentDate, resetDate } from './game-date.js';

const SAVE_KEY = 'theBoxer.save.v1';
const VERSION = 1;

// Load the game state from localStorage.
export function loadGameState() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== VERSION || !Array.isArray(data.boxers)) {
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Failed to load saved game state', err);
    return null;
  }
}

// Save current boxer rankings and stats to localStorage.
export function saveGameState(boxers) {
  if (typeof localStorage === 'undefined') return;
  try {
    const payload = {
      version: VERSION,
      lastUpdatedUtc: new Date().toISOString(),
      currentDate: getCurrentDate().toISOString(),
      boxers: boxers.map((b) => {
        const base = {
          id: b.name,
          ranking: b.ranking,
          matches: b.matches,
          wins: b.wins,
          losses: b.losses,
          draws: b.draws,
          winsByKO: b.winsByKO,
          titles: b.titles || [],
          earnings: b.earnings || 0,
          bank: b.bank || 0,
        };
        if (b.userCreated) {
          return {
            ...base,
            userCreated: true,
            nickName: b.nickName,
            country: b.country,
            continent: b.continent,
            age: b.age,
            stamina: b.stamina,
            power: b.power,
            health: b.health,
            speed: b.speed,
            defaultStrategy: b.defaultStrategy,
            ruleset: b.ruleset,
            earnings: b.earnings || 0,
            bank: b.bank || 0,
          };
        }
        return base;
      }),
      matchLog: getAllMatchLogs(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Ignore errors (e.g. storage unavailable)
  }
}

// Apply loaded state to the in-memory boxer registry.
export function applyLoadedState(state) {
  if (!state || !Array.isArray(state.boxers)) return;
  setPlayerBoxer(null);
  setMatchLog(state.matchLog || {});
  if (state.currentDate) {
    setCurrentDate(new Date(state.currentDate));
  }
  state.boxers.forEach((saved) => {
    let boxer = BOXERS.find((b) => b.name === saved.id);
    if (!boxer && saved.userCreated) {
      boxer = {
        name: saved.id,
        nickName: saved.nickName || '',
        country: saved.country || '',
        continent: saved.continent || '',
        age: saved.age || 18,
        stamina: saved.stamina ?? 1,
        power: saved.power ?? 1,
        health: saved.health ?? 1,
        speed: saved.speed ?? 1,
        ranking:
          saved.ranking ??
          BOXERS.reduce((m, b) => Math.max(m, b.ranking), 0) + 1,
        matches: saved.matches ?? 0,
        wins: saved.wins ?? 0,
        losses: saved.losses ?? 0,
        draws: saved.draws ?? 0,
        winsByKO: saved.winsByKO ?? 0,
        defaultStrategy: saved.defaultStrategy ?? 1,
        ruleset: saved.ruleset ?? 1,
        userCreated: true,
        titles: saved.titles ?? [],
        earnings: saved.earnings ?? 0,
        bank: saved.bank ?? saved.earnings ?? 0,
      };
      addBoxer(boxer);
      setPlayerBoxer(boxer);
      return;
    }
    if (!boxer) return;
    boxer.ranking = saved.ranking ?? boxer.ranking;
    boxer.matches = saved.matches ?? boxer.matches;
    boxer.wins = saved.wins ?? boxer.wins;
    boxer.losses = saved.losses ?? boxer.losses;
    boxer.draws = saved.draws ?? boxer.draws;
    boxer.winsByKO = saved.winsByKO ?? boxer.winsByKO;
    boxer.titles = saved.titles ?? boxer.titles ?? [];
    boxer.earnings = saved.earnings ?? boxer.earnings ?? 0;
    boxer.bank = saved.bank ?? boxer.bank ?? boxer.earnings ?? 0;
    if (saved.userCreated) {
      boxer.userCreated = true;
      boxer.nickName = saved.nickName ?? boxer.nickName;
      boxer.country = saved.country ?? boxer.country;
      boxer.continent = saved.continent ?? boxer.continent;
      boxer.age = saved.age ?? boxer.age;
      boxer.stamina = saved.stamina ?? boxer.stamina;
      boxer.power = saved.power ?? boxer.power;
      boxer.health = saved.health ?? boxer.health;
      boxer.speed = saved.speed ?? boxer.speed;
      boxer.defaultStrategy =
        saved.defaultStrategy ?? boxer.defaultStrategy;
      boxer.ruleset = saved.ruleset ?? boxer.ruleset;
      setPlayerBoxer(boxer);
    }
  });
}

// Remove saved data and restore defaults.
export function resetSavedData() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      // Ignore
    }
  }
  SoundManager.resetVolumes();
  resetBoxers();
  setPlayerBoxer(null);
  resetMatchLog();
  resetDate();
}

// Placeholder for future migration logic.
export function migrateIfNeeded(state) {
  if (!state) return state;
  if (state.version !== VERSION) {
    // Future versions can transform the state here.
    return state; // No migrations yet
  }
  return state;
}
