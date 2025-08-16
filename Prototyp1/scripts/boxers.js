import { BOXER_DATA } from './boxer-data.js';

function roundThousand(value) {
  return Math.round(value / 1000) * 1000;
}

function randomThousand(min, max) {
  return roundThousand(min + Math.random() * (max - min));
}

function initialEarnings(ranking) {
  const lerp = (r, start, end, min, max) => {
    const ratio = (end - r) / (end - start);
    const base = min + ratio * (max - min);
    const variance = (max - min) * 0.1;
    const low = Math.max(min, base - variance);
    const high = Math.min(max, base + variance);
    return randomThousand(low, high);
  };
  if (ranking <= 20) return lerp(ranking, 1, 20, 1_000_000, 5_000_000);
  if (ranking <= 50) return lerp(ranking, 21, 50, 1_000_000, 2_000_000);
  if (ranking <= 80) return lerp(ranking, 51, 80, 500_000, 1_000_000);
  return lerp(ranking, 81, 120, 10_000, 50_000);
}

const INIT_BOXERS = BOXER_DATA.map((b) => {
  const earn = initialEarnings(b.ranking || 100);
  return {
    ...b,
    earnings: earn,
    bank: earn,
    perks: [],
  };
});

// Mutable array of boxers used throughout the game.
export const BOXERS = INIT_BOXERS.map((b) => ({ ...b }));

// Allow dynamic addition of new boxers (e.g. player created ones).
export function addBoxer(boxer) {
  BOXERS.push(boxer);
}

// Snapshot of the initial boxer data for resets.
const DEFAULT_BOXERS = INIT_BOXERS.map((b) => ({ ...b }));

// Restore boxer data to the original defaults.
export function resetBoxers() {
  BOXERS.length = 0;
  DEFAULT_BOXERS.forEach((b) => BOXERS.push({ ...b }));
}
