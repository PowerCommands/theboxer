// Precomputed AI playbooks for 10 offensive levels

function baseActions() {
  return {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    block: false,
    jabRight: false,
    jabLeft: false,
    uppercut: false,
    turnLeft: false,
    turnRight: false,
    hurt1: false,
    hurt2: false,
    dizzy: false,
    idle: false,
    ko: false,
    win: false,
  };
}

function generatePlaybook(level) {
  const forwardProb = Math.min(0.1 + 0.05 * level, 0.8);
  const backProb = Math.max(0.6 - 0.05 * level, 0.05);
  const blockProb = Math.max(0.7 - 0.05 * level, 0.1);
  const jabProb = Math.min(0.05 * level, 0.5);
  const upperProb = Math.min(0.02 * level, 0.25);
  const noneProb = Math.max(0.6 - 0.05 * level, 0.05);

  const actions = [];
  for (let i = 0; i < 180; i++) {
    if (Math.random() < noneProb) {
      actions.push({ none: true });
      continue;
    }
    const act = {
      forward: false,
      back: false,
      block: false,
      jabLeft: false,
      jabRight: false,
      uppercut: false,
    };
    if (Math.random() < forwardProb) {
      act.forward = true;
    } else if (Math.random() < backProb) {
      act.back = true;
    }
    if (Math.random() < blockProb) act.block = true;
    if (Math.random() < jabProb) {
      if (Math.random() < 0.5) act.jabLeft = true;
      else act.jabRight = true;
    }
    if (Math.random() < upperProb) act.uppercut = true;
    actions.push(act);
  }
  return actions;
}

// Separate playbook sets for each boxer so identical levels don't share actions
export const PLAYBOOKS_P1 = Array.from({ length: 10 }, (_, i) => ({
  actions: generatePlaybook(i + 1),
}));

export const PLAYBOOKS_P2 = Array.from({ length: 10 }, (_, i) => ({
  actions: generatePlaybook(i + 1),
}));

export function createBaseActions() {
  return baseActions();
}

