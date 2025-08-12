export const appConfig = {
  name: 'The Boxer',
  version: '0.0.003'
};

// Default transparency for UI tables (1.0 = fully opaque)
// Increased by 10% for more transparency
export const tableAlpha = 0.6;
// Test mode is enabled via the query string: ?mode=test
const params = new URLSearchParams(window.location.search);
let testMode = params.get('mode') === 'test';

export function getTestMode() {
  return testMode;
}

export function setTestMode(val) {
  testMode = !!val;
}
