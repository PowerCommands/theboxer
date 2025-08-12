import { eventBus } from './event-bus.js';

export class SoundManager {
  static init(scene) {
    if (this.initialized) return;
    this.initialized = true;
    this.scene = scene;
    const vol = { volume: 0.7 };
    const volLow = { volume: 0.4 };
    const commentator = { volume: 1, setVolume(v) { this.volume = v; } };
    this.sounds = {
      menuLoop: scene.sound.add('loop-menu', { loop: true, ...vol }),
      click: scene.sound.add('click-menu', vol + 2),
      intro: scene.sound.add('intro', volLow),
      bell: scene.sound.add('bell-signals', vol),
      fight: scene.sound.add('fight', vol),
      crowd: scene.sound.add('crowd-noise-01', { loop: true, ...vol }),
      block: scene.sound.add('block', vol),
      leftJab: scene.sound.add('left-jab', vol),
      rightJab: scene.sound.add('right-jab', vol),
      uppercut: scene.sound.add('uppercut', vol),
      cheer: scene.sound.add('crowd-cheering', vol),
      cheerKO: scene.sound.add('crowd-cheering-ko', vol),
      cinematicIntro: scene.sound.add('cinematic-intro', { ...vol }),
      commentator,
    };

    this.defaultVolumes = {};
    Object.entries(this.sounds).forEach(([k, s]) => {
      this.defaultVolumes[k] = s.volume;
    });

    try {
      const raw = localStorage.getItem('theBoxer.volumes');
      if (raw) {
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([k, v]) => {
          if (this.sounds[k]) {
            this.sounds[k].setVolume(v);
          }
        });
      }
    } catch (err) {
      // ignore
    }

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

    eventBus.on('boxer-staggered', () => {
      this.sounds?.cheer?.play();
    });

    eventBus.on('match-winner', ({ method }) => {
      if (this.sounds.crowd && this.sounds.crowd.isPlaying) {
        this.sounds.crowd.stop();
      }
      if (method === 'KO' || method === 'Points') {
        this.sounds?.cheerKO?.play();
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

  static playCinematicIntro() {
    if (this.cinematicIntroPlayed) return;
    this.cinematicIntroPlayed = true;
    this.sounds?.cinematicIntro?.play();
  }

  static playBellStart() {
    const soundId = this.sounds?.bell?.play({ seek: 0, volume: 0.8 });
    if (soundId != null) {
      setTimeout(() => this.sounds?.bell?.stop(soundId), 3000);
    }
  }

  static playBellEnd() {
    this.sounds?.bell?.play({ seek: 17, duration: 3, volume: 0.8 });
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

  static playCheering() {
    this.sounds?.cheer?.play();
  }

  static saveVolumes() {
    if (!this.sounds) return;
    try {
      const data = {};
      Object.entries(this.sounds).forEach(([k, s]) => {
        data[k] = s.volume;
      });
      localStorage.setItem('theBoxer.volumes', JSON.stringify(data));
    } catch (err) {
      // ignore
    }
  }

  static resetVolumes() {
    if (!this.sounds) return;
    Object.entries(this.sounds).forEach(([k, s]) => {
      const v = this.defaultVolumes ? this.defaultVolumes[k] : undefined;
      if (v != null) s.setVolume(v);
    });
    try {
      localStorage.removeItem('theBoxer.volumes');
    } catch (err) {
      // ignore
    }
  }
}
