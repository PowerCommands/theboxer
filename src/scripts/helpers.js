export const BOXER_PREFIXES = {
  P1: 'boxer1',
  P2: 'boxer2',
};

export function animKey(prefix, name) {
  return `${prefix}_${name}`;
}
