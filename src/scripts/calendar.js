import { BOXER_DATA } from './boxer-data.js';

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
  const lowRank = BOXER_DATA.filter(
    (b) => b.ranking >= 50 && !exclude.has(b.name)
  );
  const highRank = BOXER_DATA.filter(
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
  match.result = {
    winner: winner.name,
    loser: loser.name,
    method,
    round,
    rounds,
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
