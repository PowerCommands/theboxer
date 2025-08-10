import { ArenaManager } from './arena-manager.js';
import { getMatchLog } from './match-log.js';
import { getMatchPreview } from './boxer-stats.js';

let pendingMatch = null;

function computeDate() {
  const logCount = getMatchLog().length;
  const baseDate = new Date(2025, 2, 5);
  const matchDate = new Date(baseDate);
  matchDate.setDate(baseDate.getDate() + logCount * 20);
  const year = matchDate.getFullYear();
  const dateStr = matchDate.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
  });
  const [day, month] = dateStr.split(' ');
  const formattedDate = `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  return { year, date: formattedDate };
}

export function scheduleMatch({ boxer1, boxer2, aiLevel1, aiLevel2, rounds }) {
  const highestRank = Math.min(boxer1.ranking, boxer2.ranking);
  const arena = ArenaManager.getRandomArena(highestRank);
  const { year, date } = computeDate();
  const { purse, winnerBonus, titlesOnTheLine } = getMatchPreview(
    boxer1,
    boxer2
  );
  pendingMatch = {
    boxer1,
    boxer2,
    aiLevel1,
    aiLevel2,
    rounds,
    arena,
    year,
    date,
    purse,
    winnerBonus,
    titlesOnTheLine,
  };
}

export function getPendingMatch() {
  return pendingMatch;
}

export function clearPendingMatch() {
  pendingMatch = null;
}
