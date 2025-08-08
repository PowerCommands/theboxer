export const appConfig = {
  name: 'The boxer',
  version: '0.0.001'
};

let testMode = true;

export function setTestMode(value) {
  testMode = value;
}

export function getTestMode() {
  return testMode;
}
