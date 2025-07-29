// Import GameScene from its own file
import { GameScene } from './game-scene.js';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    console.log('BootScene: preload started');
    this.load.image('ring', 'assets/ring.png');
    // Load idle animation frames for the boxers
    for (let i = 0; i < 10; i++) {
      const frame = i.toString().padStart(3, '0');
      this.load.image(`idle_${frame}`, `assets/1-Idle/__Boxer2_Idle_${frame}.png`);
    }
    this.load.spritesheet('boxer1', 'assets/boxer1.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('boxer2', 'assets/boxer2.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    console.log('BootScene: preload complete, switching to GameScene');
    this.scene.start('Game');
  }
}

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: [BootScene, GameScene]
};

window.addEventListener('load', () => {
  console.log('Initializing Phaser.Game with config:', config);
  new Phaser.Game(config);
});
