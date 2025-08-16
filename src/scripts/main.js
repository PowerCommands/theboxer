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
      { key: 'SpinePlugin', plugin: window.SpinePlugin, sceneKey: 'spine' }
    ]
  },
  scene: [BootScene]
});
