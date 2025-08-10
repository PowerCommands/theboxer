export const appConfig = {
  name: 'The Boxer',
  version: '0.0.002'
};

// Default transparency for UI tables (1.0 = fully opaque)
// Increased by 10% for more transparency
export const tableAlpha = 0.6;

// Start the game in non-test mode by default.  The ranking screen
// provides a checkbox that can enable test mode if needed.
let testMode = false;

export function setTestMode(value) {
  testMode = value;
}

export function getTestMode() {
  return testMode;
}
