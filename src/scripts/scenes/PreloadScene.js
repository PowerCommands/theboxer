import { AnimTestScene } from './AnimTestScene.js';

export class PreloadScene extends window.Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    // Later: load only the Spine assets needed for the current match.
    // Example (when runtime is added):
    // this.load.text('boxer_skel', 'assets/spine/boxer/boxer_skeleton.json');
    // this.load.text('boxer_atlas', 'assets/spine/boxer/boxer.atlas');
    // this.load.image('boxer_tex', 'assets/spine/boxer/boxer.png');
  }

  create() {
    this.scene.add('AnimTest', AnimTestScene, true);
    this.scene.remove('Preload');
  }
}
