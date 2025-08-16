let matchLog = {};

export function addMatchLog(boxer, entry) {
  if (!matchLog[boxer]) {
    matchLog[boxer] = [];
  }
  matchLog[boxer].push(entry);
}

export function getMatchLog(boxer) {
  if (boxer) {
    return matchLog[boxer] || [];
  }
  return Object.values(matchLog).flat();
}

export function getAllMatchLogs() {
  return matchLog;
}

export function setMatchLog(log = {}) {
  if (log && typeof log === 'object' && !Array.isArray(log)) {
    matchLog = log;
  } else {
    matchLog = {};
  }
}

export function resetMatchLog() {
  matchLog = {};
}
