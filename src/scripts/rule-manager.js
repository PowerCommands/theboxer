import { STRATEGIES } from './ai-strategies.js';

export class RuleManager {
  constructor(boxer1, boxer2) {
    this.b1 = boxer1;
    this.b2 = boxer2;
    this.activeRule = null;
    this.activeUntil = 0;
  }

  fill(actions, start, seq) {
    for (let i = 0; i < seq.length; i++) {
      const idx = start + i;
      if (idx >= 0 && idx < actions.length) {
        actions[idx] = seq[i];
      }
    }
  }

  evaluate(currentSecond) {
    if (this.activeRule && currentSecond < this.activeUntil) {
      return;
    }
    if (this.activeRule && currentSecond >= this.activeUntil) {
      this.activeRule = null;
    }    

    const tired1 = this.b1.stamina / this.b1.maxStamina < 0.3;
    const tired2 = this.b2.stamina / this.b2.maxStamina < 0.3;
    const dist = Math.abs(this.b1.sprite.x - this.b2.sprite.x);

    if (dist < 50) {
      const h1 = this.b1.health / this.b1.maxHealth;
      const h2 = this.b2.health / this.b2.maxHealth;
      const a1 = STRATEGIES[this.b1.controller.getLevel() - 1].actions;
      const a2 = STRATEGIES[this.b2.controller.getLevel() - 1].actions;
      if (h1 === h2) {
        const seq = [{ back: true }, { back: true }, { back: true }];
        this.fill(a1, currentSecond, seq);
        this.fill(a2, currentSecond, seq);
      } else if (h1 < h2) {
        this.fill(a1, currentSecond, [{ back: true }, { back: true }, { back: true }]);
        this.fill(a2, currentSecond, [{ back: true },{ none: true }, { none: true }]);
      } else {
        this.fill(a2, currentSecond, [{ back: true }, { back: true }, { back: true }]);
        this.fill(a1, currentSecond, [{ none: true }, { none: true }, { back: true }]);
      }
      this.activeRule = 'close-distance';
      this.activeUntil = currentSecond + 3;
    }

    if (dist > 450) {
      const h1 = this.b1.health / this.b1.maxHealth;
      const h2 = this.b2.health / this.b2.maxHealth;
      const a1 = STRATEGIES[this.b1.controller.getLevel() - 1].actions;
      const a2 = STRATEGIES[this.b2.controller.getLevel() - 1].actions;
      if (h1 === h2) {
        const seq = [{ forward: true }, { forward: true }, { forward: true }];
        this.fill(a1, currentSecond, seq);
        this.fill(a2, currentSecond, seq);
      } else if (h1 < h2) {
        this.fill(a1, currentSecond, [{ none: true }, { none: true }, { none: true }]);
        this.fill(a2, currentSecond, [{ forward: true },{ forward: true }, { forward: true }]);
      } else {
        this.fill(a2, currentSecond, [{ forward: true }, { forward: true }, { forward: true }]);
        this.fill(a1, currentSecond, [{ none: true }, { none: true }, { back: true }]);
      }
      this.activeRule = 'ranged-distance';
      this.activeUntil = currentSecond + 3;
    }

    if (tired1 && tired2) {
      const a1 = STRATEGIES[this.b1.controller.getLevel() - 1].actions;
      const a2 = STRATEGIES[this.b2.controller.getLevel() - 1].actions;
      const seq = [{ back: true }, { back: true }, { back: true }];
      this.fill(a1, currentSecond, seq);
      this.fill(a2, currentSecond, seq);
      this.activeRule = 'both-tired';
      this.activeUntil = currentSecond + seq.length;
      return;
    }

    if (tired1 && !tired2) {
      this.b1.controller.shiftLevel(-1);
      this.b2.controller.shiftLevel(2);
      const a1 = STRATEGIES[this.b1.controller.getLevel() - 1].actions;
      const a2 = STRATEGIES[this.b2.controller.getLevel() - 1].actions;
      this.fill(a1, currentSecond, [
        { back: true },
        { back: true },
        { block: true },
      ]);
      this.fill(a2, currentSecond, [
        { forward: true },
        { forward: true },
        { uppercut: true },
      ]);
      this.activeRule = 'p1-tired';
      this.activeUntil = currentSecond + 3;
      return;
    }

    if (!tired1 && tired2) {
      this.b2.controller.shiftLevel(-1);
      this.b1.controller.shiftLevel(2);
      const a1 = STRATEGIES[this.b1.controller.getLevel() - 1].actions;
      const a2 = STRATEGIES[this.b2.controller.getLevel() - 1].actions;
      this.fill(a2, currentSecond, [
        { back: true },
        { back: true },
        { block: true },
      ]);
      this.fill(a1, currentSecond, [
        { none: true },
        { none: true },
        { uppercut: true },
      ]);
      this.activeRule = 'p2-tired';
      this.activeUntil = currentSecond + 3;
      return;
    }    
  }
}

