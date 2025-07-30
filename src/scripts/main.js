// Import GameScene from its own file
import { GameScene } from './game-scene.js';
import { OverlayUI } from './overlay.js';

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
      this.load.image(
        `idle_${frame}`,
        `assets/1-Idle/__Boxer2_Idle_${frame}.png`
      );
      this.load.image(
        `forward_${frame}`,
        `assets/2-Walk/1-Forward/__Boxer2_Forward_${frame}.png`
      );
      this.load.image(
        `backward_${frame}`,
        `assets/2-Walk/2-Backward/__Boxer2_Backward_${frame}.png`
      );
      this.load.image(
        `block_${frame}`,
        `assets/4-Block/__Boxer2_Block_${frame}.png`
      );
    }
    // Load punch animation frames (8 each)
    for (let i = 0; i < 8; i++) {
      const frame = i.toString().padStart(3, '0');
      this.load.image(
        `jabRight_${frame}`,
        `assets/3-Punch/1-JabRight/__Boxer2_Punch1_${frame}.png`
      );
      this.load.image(
        `jabLeft_${frame}`,
        `assets/3-Punch/2-JabLeft/__Boxer2_Punch2_${frame}.png`
      );
      this.load.image(
        `uppercut_${frame}`,
        `assets/3-Punch/3-Uppercut/__Boxer2_Punch3_${frame}.png`
      );
    }
    // Load hurt animations (8 frames each)
    for (let i = 0; i < 8; i++) {
      const frame = i.toString().padStart(3, '0');
      this.load.image(
        `hurt1_${frame}`,
        `assets/5-Hurt/1-Hurt/__Boxer2_Hurt1_${frame}.png`
      );
      this.load.image(
        `hurt2_${frame}`,
        `assets/5-Hurt/2-HurtAlt/__Boxer2_Hurt2_${frame}.png`
      );
      this.load.image(
        `ko_${frame}`,
        `assets/6-KO/__Boxer2_KO_${frame}.png`
      );
    }
    // Dizzy animation uses 10 frames
    for (let i = 0; i < 10; i++) {
      const frame = i.toString().padStart(3, '0');
      this.load.image(
        `dizzy_${frame}`,
        `assets/5-Hurt/3-Dizzy/__Boxer2_Dizzy_${frame}.png`
      );
    }
    // Load win animation frames (4 frames)
    for (let i = 0; i < 4; i++) {
      const frame = i.toString().padStart(3, '0');
      this.load.image(
        `win_${frame}`,
        `assets/7-Win/__Boxer2_win_${frame}.png`
      );
    }
    // Legacy punch sprite sheets were removed from the project. The
    // animations now rely solely on the individual frame images loaded
    // above, so skip loading these missing assets.
  }

  create() {
    console.log('BootScene: preload complete, switching to GameScene');
    this.scene.start('Game');
    this.scene.launch('OverlayUI');
  }
}

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: [BootScene, GameScene, OverlayUI]
};

window.addEventListener('load', () => {
  console.log('Initializing Phaser.Game with config:', config);
  new Phaser.Game(config);
});
