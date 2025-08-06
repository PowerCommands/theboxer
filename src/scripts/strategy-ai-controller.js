import { STRATEGIES, createBaseActions } from './ai-strategies.js';

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

export class StrategyAIController {
  constructor(level = 1) {
    this.level = Phaser.Math.Clamp(level, 1, 10);
    this.index = 0;
    this.lastDecision = -1;
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

  getActions(boxer, opponent, currentSecond) {
    const strategy = STRATEGIES[this.level - 1];
    if (currentSecond !== this.lastDecision) {
      const action = strategy.actions[this.index % strategy.actions.length];
      this.cached = convertAction(action, boxer, opponent);
      this.index += 1;
      this.lastDecision = currentSecond;
    }
    return this.cached;
  }
}

