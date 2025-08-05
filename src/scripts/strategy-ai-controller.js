import { STRATEGIES, createBaseActions } from './ai-strategies.js';

function convertAction(action, boxer, opponent, preferredDistance) {
  if (action.none) return createBaseActions();
  const res = createBaseActions();
  if (action.block) res.block = true;
  if (action.jabLeft) res.jabLeft = true;
  if (action.jabRight) res.jabRight = true;
  if (action.uppercut) res.uppercut = true;

  const isAttacking = action.jabLeft || action.jabRight || action.uppercut;
  const isBlocking = action.block;
  const currentDist = Math.abs(boxer.sprite.x - opponent.sprite.x);

  if (currentDist > 350 && (isAttacking || isBlocking)) {
    return createBaseActions();
  }

  if (isAttacking) {
    if (action.forward && currentDist > 200) {
      if (boxer.sprite.x < opponent.sprite.x) res.moveRight = true;
      else res.moveLeft = true;
    }
    if (action.back) {
      if (boxer.sprite.x < opponent.sprite.x) res.moveLeft = true;
      else res.moveRight = true;
    }
  } else {
    const oppHealthPct = opponent.health / opponent.maxHealth;
    const targetDistance = oppHealthPct < 0.3 ? 200 : preferredDistance;
    const desired = Math.max(200, targetDistance);
    if (currentDist > desired) {
      if (boxer.sprite.x < opponent.sprite.x) res.moveRight = true;
      else res.moveLeft = true;
    } else if (currentDist < desired) {
      if (boxer.sprite.x < opponent.sprite.x) res.moveLeft = true;
      else res.moveRight = true;
    }
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
        const action = strategy.actions[this.index % strategy.actions.length];
        this.cached = convertAction(
          action,
          boxer,
          opponent,
          strategy.distance
        );
      this.index += 1;
      this.lastDecision = now;
    }
    return this.cached;
  }
}

