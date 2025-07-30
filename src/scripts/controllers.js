export class KeyboardController {
  constructor(scene, keys) {
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys(keys || {});
  }

  getActions() {
    const shift = this.cursors.shift.isDown;
    const leftKey = this.keys.left || this.cursors.left;
    const rightKey = this.keys.right || this.cursors.right;

    return {
      moveLeft: leftKey.isDown && !shift,
      moveRight: rightKey.isDown && !shift,
      moveUp: this.cursors.up.isDown || this.keys.up?.isDown,
      moveDown: this.cursors.down.isDown || this.keys.down?.isDown,
      block: this.keys.block?.isDown,
      jabRight: Phaser.Input.Keyboard.JustDown(this.keys.jabRight),
      jabLeft: Phaser.Input.Keyboard.JustDown(this.keys.jabLeft),
      uppercut: Phaser.Input.Keyboard.JustDown(this.keys.uppercut),
      turnLeft: shift && Phaser.Input.Keyboard.JustDown(leftKey),
      turnRight: shift && Phaser.Input.Keyboard.JustDown(rightKey),
      hurt1: Phaser.Input.Keyboard.JustDown(this.keys.hurt1),
      hurt2: Phaser.Input.Keyboard.JustDown(this.keys.hurt2),
      dizzy: Phaser.Input.Keyboard.JustDown(this.keys.dizzy),
      idle: Phaser.Input.Keyboard.JustDown(this.keys.idle),
      ko: Phaser.Input.Keyboard.JustDown(this.keys.ko),
    };
  }
}

export class RandomAIController {
  constructor() {
    this.timer = 0;
    this.current = {};
  }

  getActions() {
    const now = Date.now();
    if (now - this.timer > 500) {
      this.timer = now;
      const actions = {
        moveLeft: Math.random() < 0.3,
        moveRight: Math.random() < 0.3,
        moveUp: Math.random() < 0.3,
        moveDown: Math.random() < 0.3,
        block: Math.random() < 0.1,
        jabRight: Math.random() < 0.05,
        jabLeft: Math.random() < 0.05,
        uppercut: Math.random() < 0.02,
        turnLeft: false,
        turnRight: false,
        hurt1: false,
        hurt2: false,
        dizzy: false,
        idle: false,
        ko: false,
      };
      this.current = actions;
    }
    return this.current;
  }
}
