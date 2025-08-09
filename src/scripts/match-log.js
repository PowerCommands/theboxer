let matchLog = [];

export function addMatchLog(entry) {
  matchLog.push(entry);
}

export function getMatchLog() {
  return matchLog;
}

export function setMatchLog(log = []) {
  matchLog = Array.isArray(log) ? log : [];
}

export function resetMatchLog() {
  matchLog = [];
}
