export class BootScene extends window.Phaser.Scene {
  constructor() { super('Boot'); }
  async create() {
    this.scene.add('Preload', (await import('./PreloadScene.js')).PreloadScene, true);
  }
}
