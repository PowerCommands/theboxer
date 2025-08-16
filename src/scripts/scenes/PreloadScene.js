import { AnimTestScene } from './AnimTestScene.js';

export class PreloadScene extends window.Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    // Exportera från Spine: boxer.skel + boxer.atlas (+ boxer.png via atlasen)
    this.load.spineBinary('boxer-data', 'assets/spine/boxer/boxer.skel');
    this.load.spineAtlas('boxer-atlas', 'assets/spine/boxer/boxer.atlas'); // PNG laddas automatiskt
  }

  create() {
    // Skapa instans
    const boxer = this.add.spine(400, 600, 'boxer-data', 'boxer-atlas');

    // (valfritt) välj skin
    boxer.skeleton.setSkinByName?.('boxerA');
    boxer.skeleton.setSlotsToSetupPose?.();

    // spela en animation
    boxer.animationState.setAnimation(0, 'idle', true);

    this.scene.add('AnimTest', AnimTestScene, true);
    this.scene.remove('Preload');
  }
}
