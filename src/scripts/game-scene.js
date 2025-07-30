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
    // walk and block animation frames
    const forwardFrames = [];
    const backwardFrames = [];
    const blockFrames = [];
    const jabRightFrames = [];
    const jabLeftFrames = [];
    const uppercutFrames = [];
    const hurt1Frames = [];
    const hurt2Frames = [];
    const dizzyFrames = [];
    const koFrames = [];
    for (let i = 0; i < 10; i++) {
      const frame = i.toString().padStart(3, '0');
      forwardFrames.push({ key: `forward_${frame}` });
      backwardFrames.push({ key: `backward_${frame}` });
      blockFrames.push({ key: `block_${frame}` });
    }
    for (let i = 0; i < 8; i++) {
      const frame = i.toString().padStart(3, '0');
      jabRightFrames.push({ key: `jabRight_${frame}` });
      jabLeftFrames.push({ key: `jabLeft_${frame}` });
      uppercutFrames.push({ key: `uppercut_${frame}` });
      hurt1Frames.push({ key: `hurt1_${frame}` });
      hurt2Frames.push({ key: `hurt2_${frame}` });
      dizzyFrames.push({ key: `dizzy_${frame}` });
      koFrames.push({ key: `ko_${frame}` });
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
      key: 'boxer1_jabRight',
      frames: jabRightFrames,
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'boxer1_jabLeft',
      frames: jabLeftFrames,
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'boxer1_uppercut',
      frames: uppercutFrames,
      frameRate: 10,
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
    this.anims.create({
      key: 'boxer1_hurt1',
      frames: hurt1Frames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_hurt2',
      frames: hurt2Frames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_dizzy',
      frames: dizzyFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer1_ko',
      frames: koFrames,
      frameRate: 10,
      repeat: 0
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
      key: 'boxer2_jabRight',
      frames: jabRightFrames,
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'boxer2_jabLeft',
      frames: jabLeftFrames,
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'boxer2_uppercut',
      frames: uppercutFrames,
      frameRate: 10,
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
    this.anims.create({
      key: 'boxer2_hurt1',
      frames: hurt1Frames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_hurt2',
      frames: hurt2Frames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_dizzy',
      frames: dizzyFrames,
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'boxer2_ko',
      frames: koFrames,
      frameRate: 10,
      repeat: 0
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
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    // block keys
    this.blockKey1 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE
    );
    this.blockKey2 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.X
    );

    // punch events for each boxer
    this.input.keyboard.on('keydown-PAGEDOWN', () => {
      this.player1.play('boxer1_jabRight');
      this.player1.once('animationcomplete', () => {
        this.player1.play('boxer1_idle');
      });
    });
    this.input.keyboard.on('keydown-DELETE', () => {
      this.player1.play('boxer1_jabLeft');
      this.player1.once('animationcomplete', () => {
        this.player1.play('boxer1_idle');
      });
    });
    this.input.keyboard.on('keydown-NUMPAD_ZERO', () => {
      this.player1.play('boxer1_uppercut');
      this.player1.once('animationcomplete', () => {
        this.player1.play('boxer1_idle');
      });
    });

    this.input.keyboard.on('keydown-E', () => {
      this.player2.play('boxer2_jabRight');
      this.player2.once('animationcomplete', () => {
        this.player2.play('boxer2_idle');
      });
    });
    this.input.keyboard.on('keydown-Q', () => {
      this.player2.play('boxer2_jabLeft');
      this.player2.once('animationcomplete', () => {
        this.player2.play('boxer2_idle');
      });
    });
    this.input.keyboard.on('keydown-F', () => {
      this.player2.play('boxer2_uppercut');
      this.player2.once('animationcomplete', () => {
        this.player2.play('boxer2_idle');
      });
    });

    // hurt animation controls
    this.input.keyboard.on('keydown-ONE', () => {
      this.player1.play('boxer1_hurt1');
    });
    this.input.keyboard.on('keydown-TWO', () => {
      this.player1.play('boxer1_hurt2');
    });
    this.input.keyboard.on('keydown-THREE', () => {
      this.player1.play('boxer1_dizzy');
    });
    this.input.keyboard.on('keydown-FOUR', () => {
      this.player2.play('boxer2_hurt1');
    });
    this.input.keyboard.on('keydown-FIVE', () => {
      this.player2.play('boxer2_hurt2');
    });
    this.input.keyboard.on('keydown-SIX', () => {
      this.player2.play('boxer2_dizzy');
    });
    this.input.keyboard.on('keydown-SEVEN', () => {
      this.player1.play('boxer1_idle');
    });
    this.input.keyboard.on('keydown-EIGHT', () => {
      this.player2.play('boxer2_idle');
    });
    this.input.keyboard.on('keydown-NUMPAD_EIGHT', () => {
      this.player1.play('boxer1_ko');
    });
    this.input.keyboard.on('keydown-G', () => {
      this.player2.play('boxer2_ko');
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
    const p1Punching = [
      'boxer1_punch',
      'boxer1_jabRight',
      'boxer1_jabLeft',
      'boxer1_uppercut'
    ].includes(p1Anim);
    const p1Hurting = [
      'boxer1_hurt1',
      'boxer1_hurt2',
      'boxer1_dizzy',
      'boxer1_ko'
    ].includes(p1Anim);
    if (!p1Punching && !p1Hurting) {
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
    const p2Punching = [
      'boxer2_punch',
      'boxer2_jabRight',
      'boxer2_jabLeft',
      'boxer2_uppercut'
    ].includes(p2Anim);
    const p2Hurting = [
      'boxer2_hurt1',
      'boxer2_hurt2',
      'boxer2_dizzy',
      'boxer2_ko'
    ].includes(p2Anim);
    if (!p2Punching && !p2Hurting) {
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
