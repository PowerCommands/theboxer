import { getBalance } from './bank-account.js';

let playerBoxer = null;

export function setPlayerBoxer(boxer) {
  playerBoxer = boxer;
  if (boxer) {
    boxer.bank = getBalance();
  }
}

export function getPlayerBoxer() {
  return playerBoxer;
}

export function getStrategyPerkLevel(boxer = playerBoxer) {
  if (!boxer?.perks) return 0;
  return boxer.perks
    .filter((p) => p.Name === 'Strategy')
    .reduce((max, p) => Math.max(max, p.Level), 0);
}

export function getMaxStrategyLevel(boxer = playerBoxer) {
  const lvl = getStrategyPerkLevel(boxer);
  if (lvl >= 3) return 10;
  if (lvl === 2) return 6;
  if (lvl === 1) return 3;
  return 1;
}
