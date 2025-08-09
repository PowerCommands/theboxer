import { STRATEGIES_P1, STRATEGIES_P2 } from './ai-strategies.js';
import { showComment } from './comment-manager.js';

export class RuleSet1Manager {
  constructor(selfBoxer, opponentBoxer) {
    this.self = selfBoxer;
    this.opp = opponentBoxer;
    this.activeRule = null;
    this.activeUntil = 0;
    this.lastStrategyMinute = -1;
    this.name = 'ruleset1';
  }

  fill(actions, start, seq) {
    for (let i = 0; i < seq.length; i++) {
      const idx = start + i;
      if (idx >= 0 && idx < actions.length) {
        actions[idx] = seq[i];
      }
    }
  }

  recover(boxer) {
    boxer.adjustHealth(0.02 * boxer.stamina);
    boxer.adjustPower(0.02 * boxer.stamina);
    boxer.adjustStamina(0.008);
  }

  canShift(currentSecond) {
    const minute = Math.floor(currentSecond / 60);
    if (this.lastStrategyMinute !== minute) {
      this.lastStrategyMinute = minute;
      return true;
    }
    return false;
  }

  resetStrategyChanges() {
    this.lastStrategyMinute = -1;
  }

  currentRule() {
    return this.activeRule;
  }

  getActions() {
    const ctrl = this.self.controller;
    if (typeof ctrl.getLevel === 'function') {
      const strategies = ctrl.boxerId === 2 ? STRATEGIES_P2 : STRATEGIES_P1;
      return strategies[ctrl.getLevel() - 1].actions;
    }
    return null;
  }

  checkLastMinute(currentSecond, aSelf) {
    const scene = this.self.scene;
    if (
      scene.roundTimer.round === scene.maxRounds &&
      scene.roundTimer.remaining === 60
    ) {
      const hits = scene.hits;
      let behind = null;
      if (hits.p1 === hits.p2) {
        if (scene.player1.health < scene.player2.health) behind = scene.player1;
        else if (scene.player2.health < scene.player1.health)
          behind = scene.player2;
      } else {
        behind = hits.p1 < hits.p2 ? scene.player1 : scene.player2;
      }
      const leading = behind === scene.player1 ? scene.player2 : scene.player1;
      if (this.self === behind) {
        const ctrl = this.self.controller;
        if (
          typeof ctrl.setLevel === 'function' &&
          this.canShift(currentSecond)
        ) {
          showComment(
            this.self.stats.name +
              ' knows he is losing and is now pushing desperately.',
            true
          );
          if (ctrl.getLevel() < 7) {
            ctrl.setLevel(7);
          }
        }
      } else if (this.self === leading) {
        if (aSelf)
          this.fill(aSelf, currentSecond, [
            { back: true },
            { back: true },
            { block: true },
            { block: true },
          ]);
        this.activeRule = 'protect-lead';
        this.activeUntil = currentSecond + 5;
      }
    }
  }

  evaluate(currentSecond) {
    try {
      const aSelf = this.getActions();
      this.checkLastMinute(currentSecond, aSelf);
      if (this.activeRule && currentSecond < this.activeUntil) {
        return;
      }
      if (this.activeRule && currentSecond >= this.activeUntil) {
        this.activeRule = null;
      }

      this.recover(this.self);

      const tiredSelf = this.self.stamina / this.self.maxStamina < 0.3;
      const tiredOpp = this.opp.stamina / this.opp.maxStamina < 0.3;
      const dist = Math.abs(this.self.sprite.x - this.opp.sprite.x);

      if (dist < 152) {
        const hSelf = this.self.health / this.self.maxHealth;
        const hOpp = this.opp.health / this.opp.maxHealth;
        if (hSelf === hOpp) {
          if (aSelf)
            this.fill(aSelf, currentSecond, [{ back: true }, { none: true }]);
        } else if (hSelf < hOpp) {
          if (aSelf)
            this.fill(aSelf, currentSecond, [{ back: true }, { back: true }]);
        } else {
          if (aSelf) this.fill(aSelf, currentSecond, [{ none: true }]);
        }
        this.activeRule = 'close-distance';
        this.activeUntil = currentSecond + 15;
      }

      const staggeredSelf = this.self.isStaggered === true;
      if (staggeredSelf) {
        showComment(
          this.self.stats.nickName + ' is hurt and is trying to escape...',
          5
        );
        if (aSelf)
          this.fill(aSelf, currentSecond, [
            { back: true },
            { back: true },
            { back: true },
            { block: true },
          ]);
        this.self.isStaggered = false;
        if (tiredSelf && typeof this.self.controller.shiftLevel === 'function') {
          this.self.controller.shiftLevel(-1);
        }
        this.activeRule = 'staggered';
        this.activeUntil = currentSecond + 4;
      }

      if (dist > 450) {
        showComment(
          'The boxer is passive and holds a great distance to each other.',
          5
        );
        const hSelf = this.self.health / this.self.maxHealth;
        const hOpp = this.opp.health / this.opp.maxHealth;
        if (hSelf === hOpp) {
          if (aSelf)
            this.fill(aSelf, currentSecond, [
              { forward: true },
              { forward: true },
              { forward: true },
            ]);
        } else if (hSelf < hOpp) {
          if (aSelf)
            this.fill(aSelf, currentSecond, [
              { none: true },
              { none: true },
              { none: true },
            ]);
        } else {
          if (aSelf)
            this.fill(aSelf, currentSecond, [
              { none: true },
              { none: true },
              { back: true },
            ]);
        }
        this.activeRule = 'ranged-distance';
        this.activeUntil = currentSecond + 3;
        return;
      }

      if (tiredSelf && tiredOpp) {
        showComment('The boxers looks tired, the crows is booing.', 5);
        if (aSelf)
          this.fill(aSelf, currentSecond, [
            { back: true },
            { back: true },
            { back: true },
          ]);
        this.activeRule = 'both-tired';
        this.activeUntil = currentSecond + 3;
        return;
      }

      if (tiredSelf && !tiredOpp) {
        showComment(this.self.stats.nickName + ' looks really tired.', 5);
        if (
          typeof this.self.controller.shiftLevel === 'function' &&
          this.canShift(currentSecond)
        ) {
          this.self.controller.shiftLevel(-1);
        }
        if (aSelf)
          this.fill(aSelf, currentSecond, [
            { back: true },
            { back: true },
            { block: true },
          ]);
        this.activeRule = 'self-tired';
        this.activeUntil = currentSecond + 3;
        return;
      }

      if (!tiredSelf && tiredOpp) {
        showComment(this.opp.stats.nickName + ' looks really tired.', 5);
        if (
          typeof this.self.controller.shiftLevel === 'function' &&
          this.canShift(currentSecond)
        ) {
          this.self.controller.shiftLevel(1);
        }
        if (aSelf)
          this.fill(aSelf, currentSecond, [
            { none: true },
            { none: true },
            { uppercut: true },
          ]);
        this.activeRule = 'opponent-tired';
        this.activeUntil = currentSecond + 3;
        return;
      }
    } catch (err) {
      this.activeRule = 'none';
      this.activeUntil = currentSecond + 1;
      console.error('RuleSet1Manager evaluate error:', err);
      return;
    }
  }
}

