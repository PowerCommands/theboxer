const BANK_KEY = 'theBoxer.bank.v1';

function loadTransactions() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map((t) => {
      if (typeof t === 'number') {
        return { amount: t, description: '' };
      }
      const amt = typeof t?.amount === 'number' ? t.amount : 0;
      const desc = typeof t?.description === 'string' ? t.description : '';
      return { amount: amt, description: desc };
    });
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

export function addTransaction(amount, description = '') {
  const txs = loadTransactions();
  txs.push({ amount, description });
  saveTransactions(txs);
}

export function getTransactions() {
  return loadTransactions();
}

export function getBalance() {
  return loadTransactions().reduce((sum, v) => sum + (v.amount || 0), 0);
}

export function resetBankAccount() {
  saveTransactions([]);
}
