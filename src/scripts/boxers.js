import { BOXER_DATA } from './boxer-data.js';

// Mutable array of boxers used throughout the game.
export const BOXERS = BOXER_DATA.map((b) => ({ ...b }));

// Allow dynamic addition of new boxers (e.g. player created ones).
export function addBoxer(boxer) {
  BOXERS.push(boxer);
}

// Snapshot of the initial boxer data for resets.
const DEFAULT_BOXERS = BOXER_DATA.map((b) => ({ ...b }));

// Restore boxer data to the original defaults.
export function resetBoxers() {
  BOXERS.length = 0;
  DEFAULT_BOXERS.forEach((b) => BOXERS.push({ ...b }));
}
