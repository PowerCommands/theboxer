import { BOXER_PREFIXES, animKey } from './helpers.js';
import { eventBus } from './event-bus.js';

export const States = {
  ATTACK: 'attack',
  INJURED: 'injured',
  LOCKED: 'locked',
};

const STATE_ANIMS = {
  [States.ATTACK]: ['jabRight', 'jabLeft', 'uppercut'],
  [States.INJURED]: ['hurt1', 'hurt2', 'dizzy'],
  [States.LOCKED]: ['ko', 'win'],
};

const ACTION_ANIMS = {
  block: { key: 'block', loop: true },
  forward: { key: 'forward', loop: true },
  backward: { key: 'backward', loop: true },
  jabRight: { key: 'jabRight' },
  jabLeft: { key: 'jabLeft' },
  uppercut: { key: 'uppercut' },
  hurt1: { key: 'hurt1' },
  hurt2: { key: 'hurt2' },
  dizzy: { key: 'dizzy' },
  idle: { key: 'idle', loop: true },
  ko: { key: 'ko' },
  win: { key: 'win', loop: true },
};

export class Boxer {
  constructor(scene, x, y, prefix, controller, stats = {}) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, 'idle_000');
    this.sprite.play(animKey(prefix, 'idle'));
    this.prefix = prefix;
    this.controller = controller;
    this.stats = stats;
    this.speed = 200 * (stats.speed || 1);
    this.power = stats.power || 1;
    this.maxPower = this.power;
    this.stamina = stats.stamina || 1;
    this.maxStamina = this.stamina;
    this.maxHealth = stats.health || 1;
    this.health = this.maxHealth;
    // slightly smaller boxer sprites
    this.sprite.setScale(350 / this.sprite.height);
    // boxer1 faces right, boxer2 faces left
    this.facingRight = prefix === BOXER_PREFIXES.P1;
    this.sprite.setFlipX(this.facingRight);
    if (prefix === BOXER_PREFIXES.P2) this.sprite.setTint(0xbb7744);
    this.hasHit = false;
    this.isKO = false;
    this.isWinner = false;
    this.recoveryTimer = 0;
    this.lowStaminaMode = false;
    this.blockHoldTime = 0;
    this.isRetreating = false;
    this.wasTired = false;
    this.opponentWasTired = false;
    this.lastAction = 'idle';
  }

  getCurrentState() {
    const key = this.sprite.anims.currentAnim?.key || '';
    const base = key.replace(`${this.prefix}_`, '');
    if (STATE_ANIMS[States.LOCKED].includes(base)) return States.LOCKED;
    if (STATE_ANIMS[States.INJURED].includes(base)) return States.INJURED;
    if (STATE_ANIMS[States.ATTACK].includes(base)) return States.ATTACK;
    return null;
  }

  playAction(action) {
    const cfg = ACTION_ANIMS[action];
    if (!cfg) return;
    const key = animKey(this.prefix, cfg.key);
    this.lastAction = action;
    if (cfg.loop) {
      this.sprite.anims.play(key, true);
    } else {
      this.playOnce(key);
    }
  }

  handleFacing(actions) {
    if (actions.turnLeft) {
      this.facingRight = false;
      this.sprite.setFlipX(false);
    } else if (actions.turnRight) {
      this.facingRight = true;
      this.sprite.setFlipX(true);
    }
  }

  moveHorizontal(actions, amount) {
    if (actions.moveLeft) {
      this.sprite.x -= amount;
      const anim = this.facingRight ? 'backward' : 'forward';
      this.playAction(anim);
    } else if (actions.moveRight) {
      this.sprite.x += amount;
      const anim = this.facingRight ? 'forward' : 'backward';
      this.playAction(anim);
    }
  }

  applyMovement(actions, amount) {
    if (actions.moveLeft) this.sprite.x -= amount;
    if (actions.moveRight) this.sprite.x += amount;
    if (actions.moveUp) this.sprite.y -= amount;
    if (actions.moveDown) this.sprite.y += amount;
  }

  applyBounds() {
    const width = this.scene.sys.game.config.width;
    const height = this.scene.sys.game.config.height;
    this.sprite.x = Phaser.Math.Clamp(
      this.sprite.x,
      this.sprite.displayWidth / 2,
      width - this.sprite.displayWidth / 2
    );
    this.sprite.y = Phaser.Math.Clamp(
      this.sprite.y,
      this.sprite.displayHeight / 2,
      height - this.sprite.displayHeight / 2
    );
  }

  triggerKO() {
    this.sprite.removeAllListeners('animationcomplete');
    this.sprite.play(animKey(this.prefix, 'ko'));
    this.isKO = true;
    this.isRetreating = false;
    this.scene.events.emit('boxer-ko', this);
  }

  triggerWin() {
    this.sprite.anims.play(animKey(this.prefix, 'win'), true);
    this.isWinner = true;
  }

  update(delta, opponent) {
    const move = (this.speed * delta) / 1000;

    this.updateStrategy(opponent);

    let actions = this.controller.getActions(this, opponent);

    if (this.lowStaminaMode === undefined) this.lowStaminaMode = false;
    if (this.stamina < this.maxStamina / 3) {
      this.lowStaminaMode = true;
    } else if (this.lowStaminaMode && this.stamina >= this.maxStamina / 2) {
      this.lowStaminaMode = false;
    }
    if (this.lowStaminaMode) {
      actions = {
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
      if (this.facingRight) actions.moveLeft = true;
      else actions.moveRight = true;
      actions.block = true;
    }

    this.applyRecovery(delta, actions);

    if (this.lowStaminaMode) {
      if (actions.block && this.blockHoldTime <= 0) {
        this.blockHoldTime = 1000;
      }
      if (this.blockHoldTime > 0) {
        this.blockHoldTime -= delta;
        actions.block = true;
        actions.jabRight = false;
        actions.jabLeft = false;
        actions.uppercut = false;
      }
    } else {
      this.blockHoldTime = 0;
    }

    if (this.isRetreating) {
      const width = this.scene.sys.game.config.width;
      const minX = this.sprite.displayWidth / 2;
      const maxX = width - this.sprite.displayWidth / 2;

      if (this.facingRight) {
        if (this.sprite.x > minX) {
          actions = {
            moveLeft: true,
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
        } else {
          this.isRetreating = false;
        }
      } else {
        if (this.sprite.x < maxX) {
          actions = {
            moveLeft: false,
            moveRight: true,
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
        } else {
          this.isRetreating = false;
        }
      }
    }

    this.handleFacing(actions);

    const handlers = [
      { check: () => this.isKO, action: () => {} },
      { check: () => this.isWinner, action: () => this.playAction('win') },
      { check: () => actions.ko, action: () => this.triggerKO() },
      { check: () => actions.win, action: () => this.triggerWin() },
      { check: () => actions.hurt1, action: () => this.playAction('hurt1') },
      { check: () => actions.hurt2, action: () => this.playAction('hurt2') },
      { check: () => actions.dizzy, action: () => this.playAction('dizzy') },
      { check: () => actions.idle, action: () => this.playAction('idle') },
    ];

    for (const h of handlers) {
      if (h.check()) {
        h.action();
        if (!this.isKO && !this.isWinner) {
          this.applyMovement(actions, move);
        }
        this.applyBounds();
        return;
      }
    }

    const state = this.getCurrentState();
    if (state === States.LOCKED) {
      this.applyMovement(actions, move);
      this.applyBounds();
      return;
    }

    if (state !== States.ATTACK && state !== States.INJURED) {
      if (actions.block) {
        this.playAction('block');
      } else if (actions.jabRight) {
        this.playAction('jabRight');
      } else if (actions.jabLeft) {
        this.playAction('jabLeft');
      } else if (actions.uppercut) {
        this.playAction('uppercut');
      } else if (actions.moveLeft || actions.moveRight) {
        this.moveHorizontal(actions, move);
      } else {
        this.playAction('idle');
      }
    } else {
      if (actions.moveLeft) this.sprite.x -= move;
      if (actions.moveRight) this.sprite.x += move;
    }

    if (actions.moveUp) this.sprite.y -= move;
    if (actions.moveDown) this.sprite.y += move;

    const movingForward =
      (actions.moveRight && this.facingRight) ||
      (actions.moveLeft && !this.facingRight);
    if (movingForward) this.adjustStamina(-0.0006);

    this.applyBounds();
  }

  playOnce(key) {
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key);
      if (
        key === animKey(this.prefix, 'jabRight') ||
        key === animKey(this.prefix, 'jabLeft') ||
        key === animKey(this.prefix, 'uppercut')
      ) {
        this.hasHit = false;
        const isUppercut = key === animKey(this.prefix, 'uppercut');
        const powerCost = isUppercut ? 0.06 : 0.03;
        const staminaCost = isUppercut ? 0.03 : 0.015;
        this.adjustPower(-powerCost);
        this.adjustStamina(-staminaCost);
      }
      this.sprite.once('animationcomplete', () => {
        this.playAction('idle');
      });
    }
  }

  isAttacking() {
    const key = this.sprite.anims.currentAnim?.key;
    return (
      key === animKey(this.prefix, 'jabRight') ||
      key === animKey(this.prefix, 'jabLeft') ||
      key === animKey(this.prefix, 'uppercut')
    );
  }

  isBlocking() {
    const key = this.sprite.anims.currentAnim?.key;
    return key === animKey(this.prefix, 'block');
  }

  adjustPower(delta) {
    this.power = Phaser.Math.Clamp(this.power + delta, 0, this.maxPower);
    const player = this.prefix === BOXER_PREFIXES.P1 ? 'p1' : 'p2';
    eventBus.emit('power-changed', { player, value: this.power / this.maxPower });
  }

  adjustStamina(delta) {
    this.stamina = Phaser.Math.Clamp(this.stamina + delta, 0, this.maxStamina);
    const player = this.prefix === BOXER_PREFIXES.P1 ? 'p1' : 'p2';
    eventBus.emit('stamina-changed', {
      player,
      value: this.stamina / this.maxStamina,
    });
  }

  adjustHealth(delta) {
    this.health = Phaser.Math.Clamp(this.health + delta, 0, this.maxHealth);
    const player = this.prefix === BOXER_PREFIXES.P1 ? 'p1' : 'p2';
    eventBus.emit('health-changed', {
      player,
      value: this.health / this.maxHealth,
    });
  }

  updateStrategy(opponent) {
    const tired = this.stamina < this.maxStamina / 3;
    if (tired) {
      this.wasTired = true;
    }
    if (this.wasTired && this.stamina >= this.maxStamina / 2) {
      this.wasTired = false;
      if (this.controller.shiftLevel) this.controller.shiftLevel(-1);
    }

    const oppTired = opponent.stamina < opponent.maxStamina / 3;
    if (oppTired && !this.opponentWasTired && !tired) {
      if (this.controller.shiftLevel) this.controller.shiftLevel(1);
      this.opponentWasTired = true;
    }
    if (!oppTired) this.opponentWasTired = false;
  }

  applyRecovery(delta, actions) {
    this.recoveryTimer += delta;
    if (this.recoveryTimer >= 1000) {
      const movingBackward =
        (actions.moveLeft && this.facingRight) ||
        (actions.moveRight && !this.facingRight);
      if (actions.block || movingBackward) {
        this.adjustStamina(0.05);
        this.adjustHealth(0.02);
      }
      this.adjustPower(0.15 * this.stamina);
      this.recoveryTimer = 0;
    }
  }

  takeDamage(amount) {
    this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);

    if (this.health === 0) {
      this.sprite.removeAllListeners('animationcomplete');
      this.sprite.play(animKey(this.prefix, 'ko'));
      this.isKO = true;
      this.isRetreating = false;
      this.scene.events.emit('boxer-ko', this);
      return;
    }

    this.isRetreating = true;

    if (this.health < 0.3) {
      this.playOnce(animKey(this.prefix, 'dizzy'));
    } else if (this.health < 0.4) {
      this.playOnce(animKey(this.prefix, 'hurt2'));
    } else if (this.health < 0.6) {
      this.playOnce(animKey(this.prefix, 'hurt1'));
    }
  }
}
