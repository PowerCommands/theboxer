import { Boxer } from './boxer.js';
import { KeyboardController } from './controllers.js';

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
    const winFrames = [];
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
    for (let i = 0; i < 4; i++) {
      const frame = i.toString().padStart(3, '0');
      winFrames.push({ key: `win_${frame}` });
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
    this.anims.create({
      key: 'boxer1_win',
      frames: winFrames,
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
    this.anims.create({
      key: 'boxer2_win',
      frames: winFrames,
      frameRate: 10,
      repeat: -1
    });

    // controllers
    const controller1 = new KeyboardController(this, {
      jabRight: Phaser.Input.Keyboard.KeyCodes.PAGEDOWN,
      jabLeft: Phaser.Input.Keyboard.KeyCodes.DELETE,
      uppercut: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO,
      block: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE,
      hurt1: Phaser.Input.Keyboard.KeyCodes.ONE,
      hurt2: Phaser.Input.Keyboard.KeyCodes.TWO,
      dizzy: Phaser.Input.Keyboard.KeyCodes.THREE,
      idle: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      ko: Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT,
      win: Phaser.Input.Keyboard.KeyCodes.ZERO,
    });
    const controller2 = new KeyboardController(this, {
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jabRight: Phaser.Input.Keyboard.KeyCodes.E,
      jabLeft: Phaser.Input.Keyboard.KeyCodes.Q,
      uppercut: Phaser.Input.Keyboard.KeyCodes.F,
      block: Phaser.Input.Keyboard.KeyCodes.X,
      hurt1: Phaser.Input.Keyboard.KeyCodes.FOUR,
      hurt2: Phaser.Input.Keyboard.KeyCodes.FIVE,
      dizzy: Phaser.Input.Keyboard.KeyCodes.SIX,
      idle: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      ko: Phaser.Input.Keyboard.KeyCodes.G,
      win: Phaser.Input.Keyboard.KeyCodes.PLUS,
    });

    this.player1 = new Boxer(this, 200, 400, 'boxer1', controller1);
    this.player2 = new Boxer(this, 600, 400, 'boxer2', controller2);

    console.log('GameScene: create complete');
  }

  update(time, delta) {
    this.player1.update(delta);
    this.player2.update(delta);
  }
}
