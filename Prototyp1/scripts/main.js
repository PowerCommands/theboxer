import { MatchScene } from './match-scene.js';
import { SelectBoxerScene } from './select-boxer-scene.js';
import { OverlayUI } from './overlay.js';
import { RankingScene } from './ranking-scene.js';
import { SoundManager } from './sound-manager.js';
import { CreateBoxerScene } from './create-boxer-scene.js';
import { MatchLogScene } from './match-log-scene.js';
import { StartScene } from './start-scene.js';
import { OptionsScene } from './options-scene.js';
import { MatchSetupScene } from './match-setup-scene.js';
import { PerksScene } from './perks-scene.js';
import { BackdropManager } from './backdrop-manager.js';
import { MatchIntroScene } from './match-intro-scene.js';
import { TITLES } from './title-data.js';
import { PERKS } from './perks-data.js';
import { GameResultScene } from './game-result-scene.js';
import { CalendarScene } from './calendar-scene.js';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    console.log('BootScene: preload started');
    this.load.image('arena_bg_dark', 'assets/arena/backdrop-dark.png');
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
    this.load.audio(
      'cinematic-intro',
      'assets/sounds/cinematic-intro.mp3'
    );
    this.load.audio('whoosh', 'assets/sounds/whoosh.mp3');
    this.load.audio('stinger', 'assets/sounds/whoosh.mp3');
    this.load.audio('coin_jingle', 'assets/sounds/coin-spill.mp3');
    this.load.image('coin', 'assets/arena/coin.png');
    this.load.image('fight_card', 'assets/arena/fight-card.png');
    this.load.image(
      'glove_horizontal',
      'assets/arena/glove-horisontal.png'
    );
    this.load.image(
      'glove_vertical',
      'assets/arena/glove-vertical.png'
    );
    this.load.image('keyboard', 'assets/arena/keyboard.png');
    this.load.image('computer', 'assets/arena/computer.png');
    TITLES.forEach((t) => {
      this.load.image(t.name, `assets/titles/${t.name.toLowerCase()}.png`);
    });
    PERKS.forEach((p) => {
      const key = `${p.Name.toLowerCase()}-level${p.Level}`;
      this.load.image(
        key,
        `assets/Perks/${p.Name.toLowerCase()}-level${p.Level}.png`
      );
    });
    this.load.image('perk_add', 'assets/Perks/add.png');
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
    console.log('BootScene: preload complete, switching to StartScene');
    SoundManager.init(this);
    BackdropManager.init();

    const gameSound = this.game.sound;
    const unlockAndPlay = () => {
      if (gameSound.context.state === 'suspended') {
        gameSound.context.resume();
      }
      SoundManager.playMenuLoop();
    };
    unlockAndPlay();
    if (gameSound.context.state !== 'running') {
      document.body.addEventListener('pointerdown', unlockAndPlay, {
        once: true,
      });
    }

    // Start the overlay scene so match UI elements are ready when needed.
    this.scene.launch('OverlayUI');
    this.scene.sleep('OverlayUI');
    this.scene.setVisible('OverlayUI', false);
    this.scene.start('StartScene');
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
    StartScene,
    RankingScene,
    MatchLogScene,
    PerksScene,
    CreateBoxerScene,
    OptionsScene,
    MatchSetupScene,
    SelectBoxerScene,
    CalendarScene,
    MatchIntroScene,
    MatchScene,
    GameResultScene,
    OverlayUI,
  ],
};

window.addEventListener('load', () => {
  console.log('Initializing Phaser.Game with config:', config);
  const game = new Phaser.Game(config);
  // Expose game instance globally so we can access the scene manager
  window.game = game;

  // Global listener to open the Options scene with Escape
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const activeScenes = game.scene.getScenes(true);
    // Do nothing if Options is already open
    if (activeScenes.some((s) => s.scene.key === 'OptionsScene')) return;

    // Ignore overlay scene when determining current scene
    const candidates = activeScenes.filter(
      (s) => s.scene.key !== 'OverlayUI'
    );
    const current = candidates[candidates.length - 1];
    if (!current) return;
    const currentKey = current.scene.key;

    // Pause overlay if it is running so it doesn't intercept input
    const overlayActive = activeScenes.some(
      (s) => s.scene.key === 'OverlayUI'
    );
    if (overlayActive) {
      game.scene.pause('OverlayUI');
    }

    // If a match is in progress, ensure it's paused
    if (currentKey === 'MatchScene' && !current.paused) {
      current.togglePause();
    }

    game.scene.pause(currentKey);
    game.scene.run('OptionsScene', {
      fromScene: currentKey,
      overlayActive,
    });
    game.scene.bringToTop('OptionsScene');
  });
});
