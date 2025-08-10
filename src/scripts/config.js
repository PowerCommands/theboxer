export const appConfig = {
  name: 'The Boxer',
  version: '0.0.002'
};

// Start the game in non-test mode by default.  The ranking screen
// provides a checkbox that can enable test mode if needed.
let testMode = false;

export function setTestMode(value) {
  testMode = value;
}

export function getTestMode() {
  return testMode;
}
