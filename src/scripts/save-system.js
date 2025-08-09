import { BOXERS, resetBoxers } from './boxer-data.js';
import { setPlayerBoxer } from './player-boxer.js';

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
      boxers: boxers.map((b) => ({
        id: b.name,
        ranking: b.ranking,
        matches: b.matches,
        wins: b.wins,
        losses: b.losses,
        draws: b.draws,
        winsByKO: b.winsByKO,
      })),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Ignore errors (e.g. storage unavailable)
  }
}

// Apply loaded state to the in-memory boxer registry.
export function applyLoadedState(state) {
  if (!state || !Array.isArray(state.boxers)) return;
  state.boxers.forEach((saved) => {
    const boxer = BOXERS.find((b) => b.name === saved.id);
    if (!boxer) return;
    boxer.ranking = saved.ranking ?? boxer.ranking;
    boxer.matches = saved.matches ?? boxer.matches;
    boxer.wins = saved.wins ?? boxer.wins;
    boxer.losses = saved.losses ?? boxer.losses;
    boxer.draws = saved.draws ?? boxer.draws;
    boxer.winsByKO = saved.winsByKO ?? boxer.winsByKO;
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
  resetBoxers();
  setPlayerBoxer(null);
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
