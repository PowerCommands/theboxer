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
