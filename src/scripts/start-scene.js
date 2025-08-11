import { loadGameState } from './save-system.js';
import { SoundManager } from './sound-manager.js';

// Phaser is loaded globally via a script tag in index.html

// Determine if a save game exists.
const HAS_SAVE = !!loadGameState();

function resolveNewCareerKey() {
  // Scene key defined in create-boxer-scene.js (super('CreateBoxer'))
  return 'CreateBoxer';
}

function resolveContinueKey() {
  // Career hub / rankings scene key
  return 'Ranking';
}

function resolveOptionsKey() {
  // Using minimal OptionsScene defined elsewhere
  return 'OptionsScene';
}

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
    this.menu = [];
    this.focusIndex = -1;
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // Background: image if available, otherwise dark rectangle
    if (this.textures.exists('arena_bg_dark')) {
      const bg = this.add.image(width / 2, height / 2, 'arena_bg_dark');
      const scale = Math.max(width / bg.width, height / bg.height);
      bg.setScale(scale);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    }

    // Title
    this.add
      .text(width / 2, height * 0.2, 'THE BOXER', {
        font: '64px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Glove image sweeps in from below
    const gloveStartY = height + 200;
    const gloveEndY = height * 0.32 + 40;
    const glove = this.add.image(width / 2, gloveStartY, 'glove_vertical');
    glove.setDisplaySize(400, 400);
    glove.setAlpha(0);
    this.tweens.add({
      targets: glove,
      y: gloveEndY,
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });

    // Play cinematic intro sound once audio is unlocked
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        SoundManager.playCinematicIntro();
      });
    } else {
      SoundManager.playCinematicIntro();
    }

    const items = [];
    if (HAS_SAVE) {
      items.push({
        label: 'Continue Career',
        enabled: true,
        onClick: () => this.goTo(resolveContinueKey()),
      });
    } else {
      items.push({
        label: 'Start New Career',
        enabled: true,
        onClick: () => this.goTo(resolveNewCareerKey()),
      });
    }
    items.push({
      label: 'Options',
      enabled: true,
      onClick: () => this.goTo(resolveOptionsKey()),
    });

    const spacing = 70;
    const startY = height * 0.4;

    items.forEach((data, idx) => {
      const item = this.createMenuItem(data.label, {
        enabled: data.enabled,
        onClick: data.onClick,
      });
      item.root.x = width / 2;
      item.root.y = startY + idx * spacing;
      this.menu.push(item);
      if (item.enabled) {
        item.root.on('pointerover', () => this.setFocus(idx));
      }
    });

    const firstEnabled = this.menu.findIndex((m) => m.enabled);
    if (firstEnabled >= 0) {
      this.setFocus(firstEnabled);
    }

    // Keyboard navigation
    this.input.keyboard.on('keydown-UP', () => this.moveFocus(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveFocus(1));
    this.input.keyboard.on('keydown-ENTER', () => this.activateFocused());
    this.input.keyboard.on('keydown-SPACE', () => this.activateFocused());

    // Footer build version
    if (window.BUILD_VERSION) {
      this.add
        .text(width - 10, height - 10, window.BUILD_VERSION, {
          font: '16px Arial',
          color: '#ffffff',
          alpha: 0.3,
        })
        .setOrigin(1, 1);
    }
  }

  createMenuItem(label, opts = {}) {
    const { enabled = true, onClick } = opts;
    const root = this.add.container(0, 0);
    const text = this.add.text(0, 0, label, {
      font: '32px Arial',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    root.add(text);
    root.setSize(text.width, text.height);

    if (enabled) {
      root
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onClick && onClick());
    } else {
      root.alpha = 0.5;
    }

    return { root, text, enabled, onClick };
  }

  setFocus(index) {
    if (index < 0 || index >= this.menu.length || !this.menu[index].enabled) {
      return;
    }
    this.focusIndex = index;
    this.menu.forEach((item, i) => {
      if (i === index) {
        item.root.setScale(1.1);
        item.text.setColor('#ffff00');
      } else {
        item.root.setScale(1);
        item.text.setColor('#ffffff');
      }
    });
  }

  moveFocus(dir) {
    if (this.focusIndex === -1) return;
    let idx = this.focusIndex;
    do {
      idx = (idx + dir + this.menu.length) % this.menu.length;
    } while (!this.menu[idx].enabled);
    this.setFocus(idx);
  }

  activateFocused() {
    const item = this.menu[this.focusIndex];
    if (item && item.enabled && item.onClick) {
      item.onClick();
    }
  }

  goTo(key) {
    const cam = this.cameras.main;
    cam.once('camerafadeoutcomplete', () => {
      this.scene.start(key);
    });
    cam.zoomTo(1.05, 140);
    this.time.delayedCall(140, () => {
      cam.fadeOut(350, 0, 0, 0);
    });
  }
}
