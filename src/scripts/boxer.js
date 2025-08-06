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
  block: { key: 'block' },
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
    this.speed = 100 * (stats.speed || 1);
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
    if (action === 'block') {
      if (this.isBlocking()) return;
      this.sprite.play(key);
      return;
    }
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

  applyBounds(opponent, prevX, prevY) {
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

    if (opponent) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        opponent.sprite.x,
        opponent.sprite.y
      );
      if (dist < 150) {
        this.sprite.x = prevX;
        this.sprite.y = prevY;
      }
    }
  }

  triggerKO() {
    this.sprite.removeAllListeners('animationcomplete');
    this.sprite.play(animKey(this.prefix, 'ko'));
    this.isKO = true;
    this.scene.events.emit('boxer-ko', this);
  }

  triggerWin() {
    this.sprite.anims.play(animKey(this.prefix, 'win'), true);
    this.isWinner = true;
  }

  update(delta, opponent, currentSecond) {
    const move = (this.speed * delta) / 1000;

    const prevX = this.sprite.x;
    const prevY = this.sprite.y;

    let actions = this.controller.getActions(this, opponent, currentSecond);

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
        this.applyBounds(opponent, prevX, prevY);
        return;
      }
    }

    const state = this.getCurrentState();
    if (state === States.LOCKED) {
      this.applyMovement(actions, move);
      this.applyBounds(opponent, prevX, prevY);
      return;
    }

    if (state !== States.ATTACK && state !== States.INJURED) {
      if (actions.jabRight) {
        this.playAction('jabRight');
      } else if (actions.jabLeft) {
        this.playAction('jabLeft');
      } else if (actions.uppercut) {
        this.playAction('uppercut');
      } else if (actions.moveLeft || actions.moveRight) {
        this.moveHorizontal(actions, move);
      } else if (actions.block) {
        this.playAction('block');
      } else {
        this.playAction('idle');
      }
    } else {
      if (actions.moveLeft) this.sprite.x -= move;
      if (actions.moveRight) this.sprite.x += move;
    }

    if (actions.moveUp) this.sprite.y -= move;
    if (actions.moveDown) this.sprite.y += move;

    this.applyBounds(opponent, prevX, prevY);
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

  takeDamage(amount) {
    this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);

    if (this.health === 0) {
      this.sprite.removeAllListeners('animationcomplete');
      this.sprite.play(animKey(this.prefix, 'ko'));
      this.isKO = true;
      this.scene.events.emit('boxer-ko', this);
      return;
    }
    
    if(this.health < 0.2){
      this.playOnce(animKey(this.prefix, 'dizzy'));      
      return;
    }
    if(this.health < 0.35){
      this.playOnce(animKey(this.prefix, 'hurt2'));      
      return;
    }        
    if(amount > 0.015){
      this.playOnce(animKey(this.prefix, 'hurt1'));
    }    
  }
}
