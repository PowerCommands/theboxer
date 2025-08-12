import { ArenaManager } from './arena-manager.js';
import { getMatchLog } from './match-log.js';
import { getMatchPreview } from './boxer-stats.js';

let pendingMatch = null;

function computeDate() {
  const logCount = getMatchLog().length;
  const baseDate = new Date(2025, 2, 5);
  const matchDate = new Date(baseDate);
  matchDate.setMonth(baseDate.getMonth() + logCount);
  const year = matchDate.getFullYear();
  const dateStr = matchDate.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
  });
  const [day, month] = dateStr.split(' ');
  const formattedDate = `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  return { year, date: formattedDate };
}

function computeTime(prestige = 1) {
  let start;
  let end;
  switch (prestige) {
    case 1:
      start = 12 * 60;
      end = 15 * 60;
      break;
    case 2:
      start = 15 * 60 + 30;
      end = 18 * 60 + 30;
      break;
    case 3:
      start = 19 * 60;
      end = 23 * 60 + 30;
      break;
    default:
      start = 12 * 60;
      end = 15 * 60;
  }
  const steps = Math.floor((end - start) / 30);
  const total = start + Math.floor(Math.random() * (steps + 1)) * 30;
  const hour = String(Math.floor(total / 60)).padStart(2, '0');
  const minute = String(total % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function scheduleMatch({ boxer1, boxer2, aiLevel1, aiLevel2, rounds }) {
  const highestRank = Math.min(boxer1.ranking, boxer2.ranking);
  const arena = ArenaManager.getRandomArena(highestRank);
  const { year, date } = computeDate();
  const time = computeTime(arena?.Prestige || 1);
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
    time,
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
