import {
  OffensiveStrategy,
  DefensiveStrategy,
  NeutralStrategy,
  createBaseActions,
} from './ai-strategies.js';

export class StrategyAIController {
  constructor(initial = 'offensive') {
    this.strategies = {
      offensive: new OffensiveStrategy(),
      neutral: new NeutralStrategy(),
      defensive: new DefensiveStrategy(),
    };
    this.currentName = initial in this.strategies ? initial : 'offensive';
    this.current = this.strategies[this.currentName];
    this.baseStrategy = this.currentName;
    this.lastSwitch = 0;
    this.switchCooldown = 1000; // ms
    this.lastDecision = 0;
    this.decisionInterval = 200; // ms
    this.cached = createBaseActions();
  }

  setStrategy(name) {
    const now = Date.now();
    if (
      this.strategies[name] &&
      name !== this.currentName &&
      now - this.lastSwitch > this.switchCooldown
    ) {
      this.currentName = name;
      this.current = this.strategies[name];
      this.lastSwitch = now;
    }
  }

  getActions(boxer, opponent) {
    const now = Date.now();
    if (now - this.lastDecision > this.decisionInterval) {
      this.cached = this.current.decide(boxer, opponent);
      this.lastDecision = now;
    }
    return this.cached;
  }
}
