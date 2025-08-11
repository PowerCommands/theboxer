import { MatchScene } from './match-scene.js';
import { SelectBoxerScene } from './select-boxer-scene.js';
import { OverlayUI } from './overlay.js';
import { RankingScene } from './ranking-scene.js';
import { SoundManager } from './sound-manager.js';
import { CreateBoxerScene } from './create-boxer-scene.js';
import { MatchLogScene } from './match-log-scene.js';
import { BackdropManager } from './backdrop-manager.js';
import { MatchIntroScene } from './match-intro-scene.js';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    console.log('BootScene: preload started');
    this.load.image('ring', 'assets/ring.png');
    this.load.audio('loop-menu', 'assets/sounds/loop-menu.mp3');
    this.load.audio('click-menu', 'assets/sounds/click-menu.mp3');
    this.load.audio('intro', 'assets/sounds/intro.mp3');
    this.load.audio('bell-signals', 'assets/sounds/bell-signals.mp3');
    this.load.audio('fight', 'assets/sounds/fight.mp3');
    this.load.audio('crowd-noise-01', 'assets/sounds/crowd-noise-01.mp3');
    this.load.audio('crowd-cheering', 'assets/sounds/crowd-cheering.mp3');
    this.load.audio('crowd-cheering-ko', 'assets/sounds/crowd-cheering-ko.mp3');
    this.load.audio('block', 'assets/sounds/block.mp3');
    this.load.audio('left-jab', 'assets/sounds/left-jab.mp3');
    this.load.audio('right-jab', 'assets/sounds/right-jab.mp3');
    this.load.audio('uppercut', 'assets/sounds/uppercut.mp3');
    this.load.audio('whoosh', 'assets/sounds/whoosh.mp3');
    this.load.audio('stinger', 'assets/sounds/whoosh.mp3');
    this.load.audio('coin_jingle', 'assets/sounds/coin-spill.mp3');
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
  }

  create() {
    console.log('BootScene: preload complete, switching to Ranking');
    SoundManager.init(this);
    BackdropManager.init();

    const gameSound = this.game.sound;
    const resume = () => {
      if (gameSound.context.state === 'suspended') {
        gameSound.context.resume();
      }
      SoundManager.playMenuLoop();
      document.body.removeEventListener('pointerdown', resume);
    };
    document.body.addEventListener('pointerdown', resume);

    // Start the overlay scene so match UI elements are ready when needed.
    this.scene.launch('OverlayUI');
    this.scene.sleep('OverlayUI');
    this.scene.setVisible('OverlayUI', false);
    this.scene.start('Ranking');
  }
}

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: 1400,
  height: 1050,
  parent: 'game-container',
  dom: { createContainer: true },
  transparent: true,
  scene: [
    BootScene,
    RankingScene,
    MatchLogScene,
    CreateBoxerScene,
    SelectBoxerScene,
    MatchIntroScene,
    MatchScene,
    OverlayUI,
  ],
};

window.addEventListener('load', () => {
  console.log('Initializing Phaser.Game with config:', config);
  new Phaser.Game(config);
});
