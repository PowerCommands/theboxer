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
    this.lastDecision = 0;
    this.decisionInterval = 500; // ms per round second
    this.cached = createBaseActions();
    this.retreating = false;
    this.lastRetreat = 0;
    this.idleSeeking = false;
    this.lastIdleSeek = 0;
    this.lastMove = Date.now();
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
    const strategy = STRATEGIES[this.level - 1];
    if (now - this.lastDecision > this.decisionInterval) {
      const action = strategy.actions[this.index % strategy.actions.length];
      this.cached = convertAction(
        action,
        boxer,
        opponent
      );
      this.index += 1;
      this.lastDecision = now;
    }

    const dist = Math.abs(boxer.sprite.x - opponent.sprite.x);

    if (this.cached.moveLeft || this.cached.moveRight) {
      this.lastMove = now;
    }

    if (this.retreating) {
      if (dist < strategy.distance) {
        const forced = createBaseActions();
        if (boxer.sprite.x < opponent.sprite.x) forced.moveLeft = true;
        else forced.moveRight = true;
        this.cached = forced;
        this.lastMove = now;
      } else {
        this.retreating = false;
        this.lastRetreat = now;
      }
    } else if (dist < 50 && now - this.lastRetreat > 10000) {
      this.retreating = true;
    } else if (!this.idleSeeking) {
      if (now - this.lastMove > 5000 && now - this.lastIdleSeek > 10000) {
        this.idleSeeking = true;
      }
    }

    if (this.idleSeeking && !this.retreating) {
      if (Math.abs(dist - strategy.distance) > 10) {
        const forced = createBaseActions();
        if (dist < strategy.distance) {
          if (boxer.sprite.x < opponent.sprite.x) forced.moveLeft = true;
          else forced.moveRight = true;
        } else {
          if (boxer.sprite.x < opponent.sprite.x) forced.moveRight = true;
          else forced.moveLeft = true;
        }
        this.cached = forced;
        this.lastMove = now;
      } else {
        this.idleSeeking = false;
        this.lastIdleSeek = now;
      }
    }

    return this.cached;
  }
}

