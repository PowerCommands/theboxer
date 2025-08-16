// start-scene.js
import { loadGameState } from './save-system.js';
import { SoundManager } from './sound-manager.js';
import { appConfig } from './config.js';

// Phaser laddas globalt

function resolveNewCareerKey() { return 'CreateBoxer'; }
function resolveContinueKey()  { return 'Ranking'; }
function resolveOptionsKey()   { return 'OptionsScene'; }

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
    this.menu = [];
    this.focusIndex = -1;
    this._leaving = false;
  }

  create() {
    const width  = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // VIKTIGT: rensa state vid återinträde i scenen
    this.menu = [];
    this.focusIndex = -1;
    this._leaving = false;

    // Beräkna HAS_SAVE varje gång
    const HAS_SAVE = !!loadGameState();

    // Bakgrund
    if (this.textures.exists('arena_bg_dark')) {
      const bg = this.add.image(width / 2, height / 2, 'arena_bg_dark');
      const scale = Math.max(width / bg.width, height / bg.height);
      bg.setScale(scale);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    }

    // Titel
    this.add.text(width / 2, height * 0.2, 'THE BOXER', {
      font: '64px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Valfri glove (bara om texturen finns)
    if (this.textures.exists('glove_vertical')) {
      const glove = this.add.image(width / 2, height + 200, 'glove_vertical');
      glove.setDisplaySize(400, 400).setAlpha(0);
      this.tweens.add({
        targets: glove, y: height * 0.32 + 40, alpha: 1, duration: 800, ease: 'Power2'
      });
    }

    // Intro-ljud
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => SoundManager.playCinematicIntro?.());
    } else {
      SoundManager.playCinematicIntro?.();
    }

    // Meny
    const items = [];
    if (HAS_SAVE) {
      items.push({ label: 'Continue Career', enabled: true, onClick: () => this.goTo(resolveContinueKey()) });
    } else {
      items.push({ label: 'Start New Career', enabled: true, onClick: () => this.goTo(resolveNewCareerKey()) });
    }
    items.push({ label: 'Options', enabled: true, onClick: () => this.goTo(resolveOptionsKey()) });

    const spacing = 70;
    const startY  = height * 0.4;

    items.forEach((data, idx) => {
      const item = this.createMenuItem(data.label, { enabled: data.enabled, onClick: data.onClick });
      item.root.x = width / 2;
      item.root.y = startY + idx * spacing;
      this.menu.push(item);
      if (item.enabled) item.root.on('pointerover', () => this.setFocus(idx));
    });

    // Sätt fokus i nästa tick (säker init-ordning)
    this.time.delayedCall(0, () => {
      const firstEnabled = this.menu.findIndex(m => m && m.enabled && m.root?.active && m.text?.active);
      if (firstEnabled >= 0) this.setFocus(firstEnabled);
    });

    // Tangenter
    this.input.keyboard.on('keydown-UP',    () => this.moveFocus(-1));
    this.input.keyboard.on('keydown-DOWN',  () => this.moveFocus(1));
    this.input.keyboard.on('keydown-ENTER', () => this.activateFocused());
    this.input.keyboard.on('keydown-SPACE', () => this.activateFocused());

    // Show current version in the bottom-right corner
    this.add.text(width - 10, height - 10, `v${appConfig.version}`, {
      font: '16px Arial',
      color: '#ffffff',
    }).setOrigin(1, 1);

    // Städning vid SHUTDOWN
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.removeAllListeners();
      if (this.tweens?.killAll) this.tweens.killAll();
    });
  }

  createMenuItem(label, opts = {}) {
    const { enabled = true, onClick } = opts;
    const root = this.add.container(0, 0);
    const text = this.add.text(0, 0, label, { font: '32px Arial', color: '#ffffff' }).setOrigin(0.5);

    root.add(text);
    root.setSize(text.width, text.height);

    if (enabled) {
      root.setInteractive({ useHandCursor: true }).on('pointerdown', () => onClick && onClick());
    } else {
      root.alpha = 0.5;
    }

    return { root, text, enabled, onClick };
  }

  setFocus(index) {
    // Guards mot korrupt/återanvänd meny
    if (!Array.isArray(this.menu) || this.menu.length === 0) return;
    if (index < 0 || index >= this.menu.length) return;
    const cur = this.menu[index];
    if (!cur || !cur.enabled || !cur.root?.active || !cur.text?.active) return;

    this.focusIndex = index;

    this.menu.forEach((item, i) => {
      if (!item || !item.root?.active || !item.text?.active) return;
      if (i === index) {
        item.root.setScale(1.1);
        item.text.setColor('#ffff00');
      } else {
        item.root.setScale(1.0);
        item.text.setColor('#ffffff');
      }
    });
  }

  moveFocus(dir) {
    if (this.focusIndex === -1 || !Array.isArray(this.menu) || this.menu.length === 0) return;
    let idx = this.focusIndex;
    for (let i = 0; i < this.menu.length; i++) {
      idx = (idx + dir + this.menu.length) % this.menu.length;
      const m = this.menu[idx];
      if (m && m.enabled && m.root?.active && m.text?.active) { this.setFocus(idx); return; }
    }
  }

  activateFocused() {
    const item = this.menu?.[this.focusIndex];
    if (item && item.enabled && item.onClick) item.onClick();
  }

  goTo(key) {
    if (this._leaving) return;
    this._leaving = true;

    this.input.enabled = false;
    if (this.tweens?.killAll) this.tweens.killAll();
    this.scene.setVisible(false);

    const cam = this.cameras.main;
    cam.once('camerafadeoutcomplete', () => {
      const startNext = () => {
        this.game.events.off(Phaser.Core.Events.POST_RENDER, startNext);
        this.scene.start(key);
      };
      this.game.events.once(Phaser.Core.Events.POST_RENDER, startNext);
    });
    cam.fadeOut(220, 0, 0, 0);
  }
}
