import { BOXERS } from './boxers.js';

// Record a win/loss result between two boxers.
export function recordResult(winner, loser, method) {
  if (!winner || !loser) return;
  winner.matches = (winner.matches || 0) + 1;
  loser.matches = (loser.matches || 0) + 1;
  winner.wins = (winner.wins || 0) + 1;
  loser.losses = (loser.losses || 0) + 1;
  if (method === 'KO') {
    winner.winsByKO = (winner.winsByKO || 0) + 1;
  }
  // Swap rankings if a lower-ranked boxer defeats a higher-ranked one
  if (winner.ranking > loser.ranking) {
    const temp = winner.ranking;
    winner.ranking = loser.ranking;
    loser.ranking = temp;
  }
}

// Record a draw between two boxers.
export function recordDraw(boxer1, boxer2) {
  boxer1.matches = (boxer1.matches || 0) + 1;
  boxer2.matches = (boxer2.matches || 0) + 1;
  boxer1.draws = (boxer1.draws || 0) + 1;
  boxer2.draws = (boxer2.draws || 0) + 1;
}

// Get a list of boxers sorted by current ranking.
export function getRankings() {
  return BOXERS.slice().sort((a, b) => a.ranking - b.ranking);
}

