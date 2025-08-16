import { PLAYBOOKS_P1, PLAYBOOKS_P2, createBaseActions } from './ai-playbooks.js';

function convertAction(action, boxer, opponent) {
  if (action.none) return createBaseActions();
  const res = createBaseActions();
  if (action.block) res.block = true;
  if (action.jabLeft) res.jabLeft = true;
  if (action.jabRight) res.jabRight = true;
  if (action.uppercut) res.uppercut = true;
  if (action.forward) {
    if (boxer.sprite.x < opponent.sprite.x) res.moveRight = true;
    else res.moveLeft = true;
  }
  if (action.back) {
    if (boxer.sprite.x < opponent.sprite.x) res.moveLeft = true;
    else res.moveRight = true;
  }
  return res;
}

export class PlaybookAIController {
  constructor(level = 1, boxerId = 1) {
    this.level = Phaser.Math.Clamp(level, 1, 10);
    this.index = 0;
    this.lastDecision = -1;
    this.cached = createBaseActions();
    this.boxerId = boxerId === 2 ? 2 : 1;
  }

  getLevel() {
    return this.level;
  }

  setLevel(level) {
    this.level = Phaser.Math.Clamp(level, 1, 10);
  }

  shiftLevel(delta) {
    this.setLevel(this.level + delta);
  }

  getActions(boxer, opponent, currentSecond) {
    const playbooks = this.boxerId === 1 ? PLAYBOOKS_P1 : PLAYBOOKS_P2;
    const playbook = playbooks[this.level - 1];
    if (currentSecond !== this.lastDecision) {
      const action = playbook.actions[this.index % playbook.actions.length];
      this.cached = convertAction(action, boxer, opponent);
      this.index += 1;
      this.lastDecision = currentSecond;
    }
    return this.cached;
  }
}

