export class AnimTestScene extends window.Phaser.Scene {
  constructor() { super('AnimTest'); }

  create() {
    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;
    this.add.text(cx, cy, 'Anim Test — Spine-only scaffold', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Sanity check: press F to flash
    this.input.keyboard.on('keydown-F', () => this.cameras.main.flash(150));
  }
}
