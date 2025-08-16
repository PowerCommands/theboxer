import { BootScene } from './scenes/BootScene.js';

new window.Phaser.Game({
  type: window.Phaser.AUTO,
  parent: 'game-container',     // matches index.html
  width: 1280,                  // internal 16:10 design resolution
  height: 800,
  backgroundColor: '#111111',
  pixelArt: true,
  scale: {
    mode: window.Phaser.Scale.FIT,
    autoCenter: window.Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    scene: [
      // Register the Spine plugin so its loader and game object factories are available
      // in every scene. The "mapping" property exposes the plugin on the Scene instance
      // as `this.spine` instead of using the invalid "sceneKey" field, which caused
      // Phaser to report "Missing plugin for key: SpinePlugin" and left loader methods
      // like `this.load.spineBinary` undefined.
      { key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }
    ]
  },
  scene: [BootScene]
});
