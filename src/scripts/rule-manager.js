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

  recover(boxer){
    boxer.adjustHealth(0.01 * boxer.stamina);
    boxer.adjustPower(0.01 * boxer.stamina);
    boxer.adjustStamina(0.002);
  }

  evaluate(currentSecond) {    

    if (this.activeRule && currentSecond < this.activeUntil) {
      return;
    }
    if (this.activeRule && currentSecond >= this.activeUntil) {
      this.activeRule = null;
    }
    
    this.recover(this.b1);
    this.recover(this.b2);

    const tired1 = this.b1.stamina / this.b1.maxStamina < 0.3;
    const tired2 = this.b2.stamina / this.b2.maxStamina < 0.3;
    const dist = Math.abs(this.b1.sprite.x - this.b2.sprite.x);

    const getActions = (boxer) => {
      const ctrl = boxer.controller;
      return typeof ctrl.getLevel === 'function'
        ? STRATEGIES[ctrl.getLevel() - 1].actions
        : null;
    };

    if (dist < 50) {
      const h1 = this.b1.health / this.b1.maxHealth;
      const h2 = this.b2.health / this.b2.maxHealth;
      const a1 = getActions(this.b1);
      const a2 = getActions(this.b2);
      if (h1 === h2) {
        const seq = [{ back: true }, { back: true }, { back: true }];
        if (a1) this.fill(a1, currentSecond, seq);
        if (a2) this.fill(a2, currentSecond, seq);
      } else if (h1 < h2) {
        if (a1) this.fill(a1, currentSecond, [{ back: true }, { back: true }, { back: true }]);
        if (a2) this.fill(a2, currentSecond, [{ back: true }, { none: true }, { none: true }]);
      } else {
        if (a2) this.fill(a2, currentSecond, [{ back: true }, { back: true }, { back: true }]);
        if (a1) this.fill(a1, currentSecond, [{ none: true }, { none: true }, { back: true }]);
      }
      this.activeRule = 'close-distance';
      this.activeUntil = currentSecond + 3;
    }

    if (dist > 450) {
      const h1 = this.b1.health / this.b1.maxHealth;
      const h2 = this.b2.health / this.b2.maxHealth;
      const a1 = getActions(this.b1);
      const a2 = getActions(this.b2);
      if (h1 === h2) {
        const seq = [{ forward: true }, { forward: true }, { forward: true }];
        if (a1) this.fill(a1, currentSecond, seq);
        if (a2) this.fill(a2, currentSecond, seq);
      } else if (h1 < h2) {
        if (a1) this.fill(a1, currentSecond, [{ none: true }, { none: true }, { none: true }]);
        if (a2) this.fill(a2, currentSecond, [{ forward: true }, { forward: true }, { forward: true }]);
      } else {
        if (a2) this.fill(a2, currentSecond, [{ forward: true }, { forward: true }, { forward: true }]);
        if (a1) this.fill(a1, currentSecond, [{ none: true }, { none: true }, { back: true }]);
      }
      this.activeRule = 'ranged-distance';
      this.activeUntil = currentSecond + 3;
    }

    if (tired1 && tired2) {
      const a1 = getActions(this.b1);
      const a2 = getActions(this.b2);
      const seq = [{ back: true }, { back: true }, { back: true }];
      if (a1) this.fill(a1, currentSecond, seq);
      if (a2) this.fill(a2, currentSecond, seq);
      this.activeRule = 'both-tired';
      this.activeUntil = currentSecond + seq.length;
      return;
    }

    if (tired1 && !tired2) {
      if (typeof this.b1.controller.shiftLevel === 'function') {
        this.b1.controller.shiftLevel(-1);
      }
      if (typeof this.b2.controller.shiftLevel === 'function') {
        this.b2.controller.shiftLevel(2);
      }
      const a1 = getActions(this.b1);
      const a2 = getActions(this.b2);
      if (a1)
        this.fill(a1, currentSecond, [
          { back: true },
          { back: true },
          { block: true },
        ]);
      if (a2)
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
      if (typeof this.b2.controller.shiftLevel === 'function') {
        this.b2.controller.shiftLevel(-1);
      }
      if (typeof this.b1.controller.shiftLevel === 'function') {
        this.b1.controller.shiftLevel(2);
      }
      const a1 = getActions(this.b1);
      const a2 = getActions(this.b2);
      if (a2)
        this.fill(a2, currentSecond, [
          { back: true },
          { back: true },
          { block: true },
        ]);
      if (a1)
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

