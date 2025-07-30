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

    if (actions.turnLeft) {
      this.facingRight = false;
      this.sprite.setFlipX(false);
    } else if (actions.turnRight) {
      this.facingRight = true;
      this.sprite.setFlipX(true);
    }

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
