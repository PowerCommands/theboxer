import { BOXERS } from './boxers.js';
import { recordResult } from './boxer-stats.js';
import { addMatchLog } from './match-log.js';

function computeRange(matchIndex) {
  const baseDate = new Date(2025, 2, 5); // March 5, 2025
  const upcoming = new Date(baseDate);
  upcoming.setMonth(baseDate.getMonth() + matchIndex);
  const start = new Date(upcoming.getFullYear(), upcoming.getMonth() - 1, 6);
  const end = new Date(upcoming.getFullYear(), upcoming.getMonth(), 4);
  return { start, end };
}

function randomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const time = startTime + Math.random() * (endTime - startTime);
  const d = new Date(time);
  return d.toISOString().split('T')[0];
}

function pickRandom(pool) {
  const index = Math.floor(Math.random() * pool.length);
  return pool.splice(index, 1)[0];
}

export function generateMonthlyMatches(matchIndex, excluded = []) {
  const { start, end } = computeRange(matchIndex);
  const exclude = new Set(excluded);
  const lowRank = BOXERS.filter(
    (b) => b.ranking >= 50 && !exclude.has(b.name)
  );
  const highRank = BOXERS.filter(
    (b) => b.ranking < 50 && !exclude.has(b.name)
  );
  const matches = [];
  function addMatch(pool) {
    const boxer1 = pickRandom(pool);
    const boxer2 = pickRandom(pool);
    exclude.add(boxer1.name);
    exclude.add(boxer2.name);
    matches.push({
      date: randomDate(start, end),
      boxer1,
      boxer2,
      result: null,
    });
  }
  for (let i = 0; i < 5 && lowRank.length > 1; i++) addMatch(lowRank);
  for (let i = 0; i < 5 && highRank.length > 1; i++) addMatch(highRank);
  matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  return { matches, participants: Array.from(exclude) };
}

function boxerWeight(boxer) {
  const sum = boxer.health + boxer.stamina + boxer.power + boxer.speed;
  const penalty = Math.max(0, boxer.age - 18) * 0.1;
  return Math.max(0, sum - penalty);
}

export async function simulateMatch(match, delayMs = 3000) {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  const w1 = boxerWeight(match.boxer1);
  const w2 = boxerWeight(match.boxer2);
  const total = w1 + w2;
  const winner = Math.random() * total < w1 ? match.boxer1 : match.boxer2;
  const loser = winner === match.boxer1 ? match.boxer2 : match.boxer1;
  const ko = Math.random() < 0.1;
  const round = ko ? Math.floor(Math.random() * 3) + 1 : 3;
  const method = ko ? 'KO' : 'Decision';
  const rounds = [];
  for (let r = 1; r <= round; r++) {
    if (ko && r === round) {
      rounds.push(`Round ${r}: ${winner.name} wins by KO`);
    } else {
      const loserPts = 8 + Math.floor(Math.random() * 2);
      rounds.push(`Round ${r}: ${winner.name} 10-${loserPts}`);
    }
  }
  const b1RankBefore = match.boxer1.ranking;
  const b2RankBefore = match.boxer2.ranking;
  const b1EarnBefore = match.boxer1.earnings || 0;
  const b2EarnBefore = match.boxer2.earnings || 0;
  const winnerTitlesBefore = (winner.titles || []).slice();
  recordResult(winner, loser, method);
  const prize1 = match.boxer1.earnings - b1EarnBefore;
  const prize2 = match.boxer2.earnings - b2EarnBefore;
  const titlesWon = (winner.titles || []).filter(
    (t) => !winnerTitlesBefore.includes(t)
  );
  addMatchLog(match.boxer1.name, {
    opponent: match.boxer2.name,
    result: winner === match.boxer1 ? 'Win' : 'Loss',
    method,
    prize: prize1,
    rankingBefore: b1RankBefore,
    rankingAfter: match.boxer1.ranking,
  });
  addMatchLog(match.boxer2.name, {
    opponent: match.boxer1.name,
    result: winner === match.boxer2 ? 'Win' : 'Loss',
    method,
    prize: prize2,
    rankingBefore: b2RankBefore,
    rankingAfter: match.boxer2.ranking,
  });
  match.result = {
    winner: winner.name,
    loser: loser.name,
    method,
    round,
    rounds,
    prize: winner === match.boxer1 ? prize1 : prize2,
    rankingBefore: winner === match.boxer1 ? b1RankBefore : b2RankBefore,
    rankingAfter: winner.ranking,
    titlesWon,
  };
  return match.result;
}

export async function simulateAll(matches, delayMs = 3000) {
  const results = [];
  for (const m of matches) {
    results.push(await simulateMatch(m, delayMs));
  }
  return results;
}
