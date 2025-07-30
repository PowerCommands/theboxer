export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    console.log('GameScene: create started');

    // add ring background
    this.add.image(400, 300, 'ring');

    // create idle animation frames shared by both boxers
    const idleFrames = [];
    for (let i = 0; i < 10; i++) {
      const frame = i.toString().padStart(3, '0');
      idleFrames.push({ key: `idle_${frame}` });
    }
    // walk animation frames
    const forwardFrames = [];
    const backwardFrames = [];
    const blockFrames = [];
    for (let i = 0; i < 10; i++) {
      const frame = i.toString().padStart(3, '0');
      forwardFrames.push({ key: `forward_${frame}` });
      backwardFrames.push({ key: `backward_${frame}` });
      blockFrames.push({ key: `block_${frame}` });
    }
    this.anims.create({
      key: 'boxer1_idle',
      frames: idleFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_punch',
      frames: this.anims.generateFrameNumbers('boxer1', { start: 1, end: 3 }),
      frameRate: 8,
      repeat: 0
    });
    this.anims.create({
      key: 'boxer1_forward',
      frames: forwardFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_backward',
      frames: backwardFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_block',
      frames: blockFrames,
      frameRate: 10,
      repeat: -1
    });

    // define animations for boxer2
    this.anims.create({
      key: 'boxer2_idle',
      frames: idleFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_punch',
      frames: this.anims.generateFrameNumbers('boxer2', { start: 1, end: 3 }),
      frameRate: 8,
      repeat: 0
    });
    this.anims.create({
      key: 'boxer2_forward',
      frames: forwardFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_backward',
      frames: backwardFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_block',
      frames: blockFrames,
      frameRate: 10,
      repeat: -1
    });

    // create sprites using the new idle frames
    this.player1 = this.add.sprite(200, 400, 'idle_000').play('boxer1_idle');
    this.player1.setScale(400 / this.player1.height);
    this.player1.setFlipX(true);

    this.player2 = this.add.sprite(600, 400, 'idle_000').play('boxer2_idle');
    this.player2.setScale(400 / this.player2.height);

    // input: arrows for player1, WASD for player2
    this.cursors = this.input.keyboard.createCursorKeys();
    this.WASD = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      punch2: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
    // block keys
    this.blockKey1 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.X
    );
    this.blockKey2 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.FIVE
    );

    // punch events
    this.input.keyboard.on('keydown-SPACE', () => {
      console.log('SPACE pressed: boxer1 punches');
      this.player1.play('boxer1_punch');
      this.player1.once('animationcomplete', () => {
        this.player1.play('boxer1_idle');
      });
    });
    this.input.keyboard.on('keydown-SHIFT', () => {
      console.log('SHIFT pressed: boxer2 punches');
      this.player2.play('boxer2_punch');
      this.player2.once('animationcomplete', () => {
        this.player2.play('boxer2_idle');
      });
    });

    console.log('GameScene: create complete');
  }

  update(time, delta) {
    const speed = 200;
    const move = (speed * delta) / 1000;

    // === PLAYER 1 MOVEMENT ===
    const p1Anim = this.player1.anims.currentAnim
      ? this.player1.anims.currentAnim.key
      : '';
    if (p1Anim !== 'boxer1_punch') {
      if (this.blockKey1.isDown) {
        this.player1.anims.play('boxer1_block', true);
      } else if (this.cursors.left.isDown) {
        this.player1.x -= move;
        this.player1.anims.play('boxer1_backward', true);
      } else if (this.cursors.right.isDown) {
        this.player1.x += move;
        this.player1.anims.play('boxer1_forward', true);
      } else {
        this.player1.anims.play('boxer1_idle', true);
      }
    }
    if (this.cursors.up.isDown) {
      this.player1.y -= move;
    } else if (this.cursors.down.isDown) {
      this.player1.y += move;
    }

    // === PLAYER 2 MOVEMENT ===
    const p2Anim = this.player2.anims.currentAnim
      ? this.player2.anims.currentAnim.key
      : '';
    if (p2Anim !== 'boxer2_punch') {
      if (this.blockKey2.isDown) {
        this.player2.anims.play('boxer2_block', true);
      } else if (this.WASD.left.isDown) {
        this.player2.x -= move;
        this.player2.anims.play('boxer2_forward', true);
      } else if (this.WASD.right.isDown) {
        this.player2.x += move;
        this.player2.anims.play('boxer2_backward', true);
      } else {
        this.player2.anims.play('boxer2_idle', true);
      }
    }
    if (this.WASD.up.isDown) {
      this.player2.y -= move;
    } else if (this.WASD.down.isDown) {
      this.player2.y += move;
    }

    // === BOUNDARIES ===
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    this.player1.x = Phaser.Math.Clamp(
      this.player1.x,
      this.player1.displayWidth / 2,
      width - this.player1.displayWidth / 2
    );
    this.player1.y = Phaser.Math.Clamp(
      this.player1.y,
      this.player1.displayHeight / 2,
      height - this.player1.displayHeight / 2
    );

    this.player2.x = Phaser.Math.Clamp(
      this.player2.x,
      this.player2.displayWidth / 2,
      width - this.player2.displayWidth / 2
    );
    this.player2.y = Phaser.Math.Clamp(
      this.player2.y,
      this.player2.displayHeight / 2,
      height - this.player2.displayHeight / 2
    );
  }
}
