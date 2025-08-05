import { STRATEGIES, createBaseActions } from './ai-strategies.js';

function convertAction(action, boxer, opponent) {
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

export class StrategyAIController {
  constructor(level = 1) {
    this.level = Phaser.Math.Clamp(level, 1, 10);
    this.index = 0;
    this.lastDecision = 0;
    this.decisionInterval = 500; // ms per round second
    this.cached = createBaseActions();
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

  getActions(boxer, opponent) {
    const now = Date.now();
    if (now - this.lastDecision > this.decisionInterval) {
      const strategy = STRATEGIES[this.level - 1];
      const action = strategy[this.index % strategy.length];
      this.cached = convertAction(action, boxer, opponent);
      this.index += 1;
      this.lastDecision = now;
    }
    return this.cached;
  }
}

