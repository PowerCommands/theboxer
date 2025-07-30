export class KeyboardController {
  constructor(scene, keys) {
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys(keys || {});
  }

  getActions() {
    return {
      moveLeft: this.cursors.left.isDown || this.keys.left?.isDown,
      moveRight: this.cursors.right.isDown || this.keys.right?.isDown,
      moveUp: this.cursors.up.isDown || this.keys.up?.isDown,
      moveDown: this.cursors.down.isDown || this.keys.down?.isDown,
      block: this.keys.block?.isDown,
      jabRight: Phaser.Input.Keyboard.JustDown(this.keys.jabRight),
      jabLeft: Phaser.Input.Keyboard.JustDown(this.keys.jabLeft),
      uppercut: Phaser.Input.Keyboard.JustDown(this.keys.uppercut),
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
      };
      this.current = actions;
    }
    return this.current;
  }
}
