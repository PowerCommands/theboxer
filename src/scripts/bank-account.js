const BANK_KEY = 'theBoxer.bank.v1';

function loadTransactions() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function saveTransactions(txs) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(BANK_KEY, JSON.stringify(txs));
  } catch (err) {
    // ignore
  }
}

export function addTransaction(amount) {
  const txs = loadTransactions();
  txs.push(amount);
  saveTransactions(txs);
}

export function getTransactions() {
  return loadTransactions();
}

export function getBalance() {
  return loadTransactions().reduce((sum, v) => sum + v, 0);
}

export function resetBankAccount() {
  saveTransactions([]);
}
