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
    this.sprite.play(`${prefix}_idle`);
    this.prefix = prefix;
    this.controller = controller;
    this.stats = stats;
    this.speed = 200 * (stats.speed || 1);
    this.power = stats.power || 1;
    this.stamina = stats.stamina || 1;
    this.maxHealth = stats.health || 1;
    this.health = this.maxHealth;
    // slightly smaller boxer sprites
    this.sprite.setScale(350 / this.sprite.height);
    // boxer1 faces right, boxer2 faces left
    this.facingRight = prefix === 'boxer1';
    this.sprite.setFlipX(this.facingRight);
    if (prefix === 'boxer2') this.sprite.setTint(0xbb7744);
    this.hasHit = false;
    this.isKO = false;
    this.isWinner = false;
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
    const key = `${this.prefix}_${cfg.key}`;
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
    this.sprite.play(`${this.prefix}_ko`);
    this.isKO = true;
    this.scene.events.emit('boxer-ko', this);
  }

  triggerWin() {
    this.sprite.anims.play(`${this.prefix}_win`, true);
    this.isWinner = true;
  }

  update(delta) {
    const move = (this.speed * delta) / 1000;
    const actions = this.controller.getActions();

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
        this.applyMovement(actions, move);
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

    this.applyBounds();
  }

  playOnce(key) {
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key);
      if (
        key === `${this.prefix}_jabRight` ||
        key === `${this.prefix}_jabLeft` ||
        key === `${this.prefix}_uppercut`
      ) {
        this.hasHit = false;
      }
      this.sprite.once('animationcomplete', () => {
        this.sprite.play(`${this.prefix}_idle`);
      });
    }
  }

  isAttacking() {
    const key = this.sprite.anims.currentAnim?.key;
    return (
      key === `${this.prefix}_jabRight` ||
      key === `${this.prefix}_jabLeft` ||
      key === `${this.prefix}_uppercut`
    );
  }

  isBlocking() {
    const key = this.sprite.anims.currentAnim?.key;
    return key === `${this.prefix}_block`;
  }

  takeDamage(amount) {
    this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);

    if (this.health === 0) {
      this.sprite.play(`${this.prefix}_ko`);
      this.isKO = true;
      this.scene.events.emit('boxer-ko', this);
      return;
    }

    if (this.health < 0.3) {
      this.playOnce(`${this.prefix}_dizzy`);
    } else if (this.health < 0.4) {
      this.playOnce(`${this.prefix}_hurt2`);
    } else if (this.health < 0.6) {
      this.playOnce(`${this.prefix}_hurt1`);
    }
  }
}
