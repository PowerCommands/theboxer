export const BOXER_PREFIXES = {
  P1: 'boxer1',
  P2: 'boxer2',
};

export function animKey(prefix, name) {
  return `${prefix}_${name}`;
}

// Format a numeric amount into a dollar string with space separated thousands
// e.g. 5000000 -> "$5 000 000". Returns '-' if amount is null or undefined.
export function formatMoney(amount) {
  if (amount == null) return '-';
  return `$${amount
    .toLocaleString('sv-SE')
    .replace(/\u00A0/g, ' ')}`;
}
