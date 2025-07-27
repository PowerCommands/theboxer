export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    console.log('GameScene: create started');

    // add ring background
    this.add.image(400, 300, 'ring');

    // define animations for boxer1
    this.anims.create({
      key: 'boxer1_idle',
      frames: [{ key: 'boxer1', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_punch',
      frames: this.anims.generateFrameNumbers('boxer1', { start: 1, end: 3 }),
      frameRate: 8,
      repeat: 0
    });

    // define animations for boxer2
    this.anims.create({
      key: 'boxer2_idle',
      frames: [{ key: 'boxer2', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_punch',
      frames: this.anims.generateFrameNumbers('boxer2', { start: 1, end: 3 }),
      frameRate: 8,
      repeat: 0
    });

    // create sprites
    this.player1 = this.add.sprite(200, 400, 'boxer1').play('boxer1_idle');
    this.player2 = this.add.sprite(600, 400, 'boxer2').play('boxer2_idle');

    // input: arrows for player1, WASD for player2
    this.cursors = this.input.keyboard.createCursorKeys();
    this.WASD = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      punch2: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

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
    if (this.cursors.left.isDown) {
      this.player1.x -= move;
    } else if (this.cursors.right.isDown) {
      this.player1.x += move;
    }
    if (this.cursors.up.isDown) {
      this.player1.y -= move;
    } else if (this.cursors.down.isDown) {
      this.player1.y += move;
    }

    // === PLAYER 2 MOVEMENT ===
    if (this.WASD.left.isDown) {
      this.player2.x -= move;
    } else if (this.WASD.right.isDown) {
      this.player2.x += move;
    }
    if (this.WASD.up.isDown) {
      this.player2.y -= move;
    } else if (this.WASD.down.isDown) {
      this.player2.y += move;
    }

    // === BOUNDARIES ===
    const halfW = 32; // half of frameWidth
    const halfH = 32; // half of frameHeight
    const minX = halfW;
    const maxX = this.sys.game.config.width - halfW;
    const minY = halfH;
    const maxY = this.sys.game.config.height - halfH;

    this.player1.x = Phaser.Math.Clamp(this.player1.x, minX, maxX);
    this.player1.y = Phaser.Math.Clamp(this.player1.y, minY, maxY);
    this.player2.x = Phaser.Math.Clamp(this.player2.x, minX, maxX);
    this.player2.y = Phaser.Math.Clamp(this.player2.y, minY, maxY);
  }
}
