import { eventBus } from './event-bus.js';

export class SoundManager {
  static init(scene) {
    if (this.initialized) return;
    this.initialized = true;
    this.scene = scene;
    this.sounds = {
      menuLoop: scene.sound.add('loop-menu', { loop: true }),
      click: scene.sound.add('click-menu'),
      intro: scene.sound.add('intro'),
      bell: scene.sound.add('bell-signals'),
      fight: scene.sound.add('fight'),
      crowd: scene.sound.add('crowd-noise-01', { loop: true }),
      block: scene.sound.add('block'),
      leftJab: scene.sound.add('left-jab'),
      rightJab: scene.sound.add('right-jab'),
      uppercut: scene.sound.add('uppercut'),
    };

    eventBus.on('round-started', () => {
      if (this.sounds.intro && this.sounds.intro.isPlaying) {
        this.sounds.intro.stop();
      }
      this.playBellStart();
      if (this.sounds.fight) {
        this.sounds.fight.play();
      }
      if (this.sounds.crowd && !this.sounds.crowd.isPlaying) {
        this.sounds.crowd.play();
      }
    });

    eventBus.on('round-ended', () => {
      this.playBellEnd();
      if (this.sounds.crowd && this.sounds.crowd.isPlaying) {
        this.sounds.crowd.stop();
      }
    });

    eventBus.on('match-winner', () => {
      if (this.sounds.crowd && this.sounds.crowd.isPlaying) {
        this.sounds.crowd.stop();
      }
    });
  }

  static playMenuLoop() {
    if (this.sounds?.menuLoop && !this.sounds.menuLoop.isPlaying) {
      this.sounds.menuLoop.play();
    }
  }

  static stopMenuLoop() {
    if (this.sounds?.menuLoop && this.sounds.menuLoop.isPlaying) {
      this.sounds.menuLoop.stop();
    }
  }

  static playClick() {
    this.sounds?.click?.play();
  }

  static playIntro() {
    this.sounds?.intro?.play();
  }

  static playBellStart() {
    this.sounds?.bell?.play({ seek: 0, duration: 3 });
  }

  static playBellEnd() {
    this.sounds?.bell?.play({ seek: 17, duration: 3 });
  }

  static playBlock() {
    this.sounds?.block?.play();
  }

  static playLeftJab() {
    this.sounds?.leftJab?.play();
  }

  static playRightJab() {
    this.sounds?.rightJab?.play();
  }

  static playUppercut() {
    this.sounds?.uppercut?.play();
  }
}
