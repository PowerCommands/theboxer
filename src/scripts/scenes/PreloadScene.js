import { AnimTestScene } from './AnimTestScene.js';

export class PreloadScene extends window.Phaser.Scene {
  constructor() { super('Preload'); }

  // preload() {
  //   // Ladda Spineboy (Spine 4.2) direkt från Esoterics CDN:
  //   this.load.spineJson('spineboy-data', 'https://esotericsoftware.com/files/examples/4.2/spineboy/export/spineboy-pro.json');
  //   this.load.spineAtlas('spineboy-atlas', 'https://esotericsoftware.com/files/examples/4.2/spineboy/export/spineboy-pma.atlas');
  // }

  // create() {
  //   // Kontroll: är pluginet verkligen aktivt?
  //   console.log('Spine plugin present?', !!this.spine, 'spinephaser?', !!window.spinephaser);

  //   // Skapa en instans och spela 'idle'
  //   const boy = this.add.spine(400, 600, 'spineboy-data', 'spineboy-atlas');
  //   boy.skeleton.setSlotsToSetupPose();
  //   boy.animationState.setAnimation(0, 'idle', true);
  // }

  create() {
    console.log('Has spinephaser?', !!window.spinephaser);
    console.log('Has SpinePlugin?', !!window.spinephaser?.SpinePlugin);
    console.log('Scene has spine?', !!this.spine);

    this.add.text(10, 10, 'Plugin test', { color: '#fff' });
  }

}
