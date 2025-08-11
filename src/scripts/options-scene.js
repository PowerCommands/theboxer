import Phaser from 'phaser';

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create() {
    const { width, height } = this.sys.game.config;

    this.add
      .text(width / 2, height * 0.2, 'Options', {
        font: '48px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(width / 2, height * 0.8, 'Back', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const setColor = (hover) => back.setColor(hover ? '#ffff00' : '#ffffff');
    back.on('pointerover', () => setColor(true));
    back.on('pointerout', () => setColor(false));
    back.on('pointerdown', () => this.scene.start('StartScene'));

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('StartScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('StartScene'));
  }
}
