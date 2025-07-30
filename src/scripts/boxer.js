export class Boxer {
  constructor(scene, x, y, prefix, controller) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, 'idle_000');
    this.sprite.play(`${prefix}_idle`);
    this.prefix = prefix;
    this.controller = controller;
    this.speed = 200;
    this.sprite.setScale(400 / this.sprite.height);
    // boxer1 faces right, boxer2 faces left
    this.facingRight = prefix === 'boxer1';
    this.sprite.setFlipX(this.facingRight);
    if (prefix === 'boxer2') this.sprite.setTint(0xbb7744);
  }

  update(delta) {
    const move = (this.speed * delta) / 1000;
    const actions = this.controller.getActions();
    const injuredStates = [
      `${this.prefix}_hurt1`,
      `${this.prefix}_hurt2`,
      `${this.prefix}_dizzy`,
    ];
    const attackStates = [
      `${this.prefix}_jabRight`,
      `${this.prefix}_jabLeft`,
      `${this.prefix}_uppercut`,
    ];
    const lockedStates = [
      `${this.prefix}_ko`,
      `${this.prefix}_win`,
    ];

    if (actions.turnLeft) {
      this.facingRight = false;
      this.sprite.setFlipX(false);
    } else if (actions.turnRight) {
      this.facingRight = true;
      this.sprite.setFlipX(true);
    }

    if (actions.ko) {
      this.sprite.play(`${this.prefix}_ko`);
      return;
    }
    if (actions.win) {
      this.sprite.anims.play(`${this.prefix}_win`, true);
      return;
    }
    if (actions.hurt1) {
      this.playOnce(`${this.prefix}_hurt1`);
    } else if (actions.hurt2) {
      this.playOnce(`${this.prefix}_hurt2`);
    } else if (actions.dizzy) {
      this.playOnce(`${this.prefix}_dizzy`);
    } else if (actions.idle) {
      this.sprite.anims.play(`${this.prefix}_idle`, true);
    }

    const current = this.sprite.anims.currentAnim?.key || '';

    if (lockedStates.includes(current)) {
      return;
    }

    const isInjured = injuredStates.includes(current);
    const isAttacking = attackStates.includes(current);

    if (!isInjured && !isAttacking) {
      if (actions.block) {
        this.sprite.anims.play(`${this.prefix}_block`, true);
      } else if (actions.jabRight) {
        this.playOnce(`${this.prefix}_jabRight`);
      } else if (actions.jabLeft) {
        this.playOnce(`${this.prefix}_jabLeft`);
      } else if (actions.uppercut) {
        this.playOnce(`${this.prefix}_uppercut`);
      } else if (actions.moveLeft) {
        this.sprite.x -= move;
        const anim = this.facingRight ? 'backward' : 'forward';
        this.sprite.anims.play(`${this.prefix}_${anim}`, true);
      } else if (actions.moveRight) {
        this.sprite.x += move;
        const anim = this.facingRight ? 'forward' : 'backward';
        this.sprite.anims.play(`${this.prefix}_${anim}`, true);
      } else {
        this.sprite.anims.play(`${this.prefix}_idle`, true);
      }
    } else {
      if (actions.moveLeft) {
        this.sprite.x -= move;
      } else if (actions.moveRight) {
        this.sprite.x += move;
      }
    }

    if (actions.moveUp) {
      this.sprite.y -= move;
    } else if (actions.moveDown) {
      this.sprite.y += move;
    }

    // boundaries
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

  playOnce(key) {
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key);
      this.sprite.once('animationcomplete', () => {
        this.sprite.play(`${this.prefix}_idle`);
      });
    }
  }
}
