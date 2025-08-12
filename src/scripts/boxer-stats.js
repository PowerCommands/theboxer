import { BOXERS } from './boxers.js';
import { TITLES } from './title-data.js';
import { getPlayerBoxer } from './player-boxer.js';
import { addTransaction } from './bank-account.js';

const TITLE_MAP = TITLES.reduce((acc, t) => {
  acc[t.name] = t;
  return acc;
}, {});

function roundThousand(value) {
  return Math.round(value / 1000) * 1000;
}

function randomThousand(min, max) {
  return roundThousand(min + Math.random() * (max - min));
}

function basePrizeForRank(rank) {
  if (rank >= 75) return { base: randomThousand(5000, 10000), bonus: 1 };
  if (rank >= 50) return { base: randomThousand(10000, 50000), bonus: 1.5 };
  if (rank >= 20) return { base: randomThousand(50000, 100000), bonus: 2 };
  return { base: randomThousand(100000, 250000), bonus: 3 };
}

function beltsOnLine(b1, b2) {
  const titles = new Set();
  const check = (t) => {
    const info = TITLE_MAP[t];
    if (!info) return;
    if (info.region === 'Global') {
      titles.add(t);
    } else if (b1.continent === info.region && b2.continent === info.region) {
      titles.add(t);
    }
  };
  (b1.titles || []).forEach(check);
  (b2.titles || []).forEach(check);
  return titles.size;
}

function titlesOnLineList(b1, b2) {
  const titles = new Set();
  const check = (t) => {
    const info = TITLE_MAP[t];
    if (!info) return;
    if (info.region === 'Global') {
      titles.add(t);
    } else if (b1.continent === info.region && b2.continent === info.region) {
      titles.add(t);
    }
  };
  (b1.titles || []).forEach(check);
  (b2.titles || []).forEach(check);
  return Array.from(titles);
}

export function getMatchPreview(b1, b2) {
  const titles = titlesOnLineList(b1, b2);
  const worstRank = Math.max(b1.ranking || 100, b2.ranking || 100);
  const { base, bonus } = basePrizeForRank(worstRank);
  const beltMult = Math.pow(3, titles.length);
  const purse = roundThousand(base * beltMult);
  const winnerBonus = roundThousand(purse * bonus);
  return {
    purse,
    winnerBonus,
    titlesOnTheLine: titles.map((code) => ({ code })),
  };
}

function awardEarnings(b1, b2, winner) {
  const worstRank = Math.max(b1.ranking || 100, b2.ranking || 100);
  const { base, bonus } = basePrizeForRank(worstRank);
  const beltMult = Math.pow(3, beltsOnLine(b1, b2));
  const purse = base * beltMult;
  const loserAmt = roundThousand(purse);
  const winnerAmt = winner ? roundThousand(purse * (1 + bonus)) : loserAmt;
  const b1Prize = winner === b1 ? winnerAmt : loserAmt;
  const b2Prize = winner === b2 ? winnerAmt : loserAmt;
  b1.earnings = (b1.earnings || 0) + b1Prize;
  b2.earnings = (b2.earnings || 0) + b2Prize;
  b1.bank = (b1.bank || 0) + b1Prize;
  b2.bank = (b2.bank || 0) + b2Prize;
  const player = getPlayerBoxer();
  if (b1 === player) addTransaction(b1Prize);
  if (b2 === player) addTransaction(b2Prize);
}

// Record a win/loss result between two boxers.
export function recordResult(winner, loser, method) {
  if (!winner || !loser) return;
  awardEarnings(winner, loser, winner);
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
  updateTitles(winner, loser);
}

// Record a draw between two boxers.
export function recordDraw(boxer1, boxer2) {
  boxer1.matches = (boxer1.matches || 0) + 1;
  boxer2.matches = (boxer2.matches || 0) + 1;
  boxer1.draws = (boxer1.draws || 0) + 1;
  boxer2.draws = (boxer2.draws || 0) + 1;
  awardEarnings(boxer1, boxer2, null);
}

// Get a list of boxers sorted by current ranking.
export function getRankings() {
  return BOXERS.slice().sort((a, b) => a.ranking - b.ranking);
}

function updateTitles(winner, loser) {
  winner.titles = winner.titles || [];
  loser.titles = loser.titles || [];
  const allTitles = winner.titles.concat(loser.titles);
  const hasGlobal = allTitles.some((name) => TITLE_MAP[name]?.region === 'Global');

  if (hasGlobal) {
    winner.titles = Array.from(new Set(allTitles));
    loser.titles = [];
    return;
  }

  loser.titles = loser.titles.filter((name) => {
    const info = TITLE_MAP[name];
    if (
      info &&
      info.region !== 'Global' &&
      winner.continent === info.region &&
      loser.continent === info.region
    ) {
      if (!winner.titles.includes(name)) winner.titles.push(name);
      return false;
    }
    return true;
  });
}

