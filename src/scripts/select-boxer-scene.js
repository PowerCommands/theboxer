import { BOXERS } from './boxer-data.js';

export class SelectBoxerScene extends Phaser.Scene {
  constructor() {
    super('SelectBoxer');
    this.step = 1;
    this.choice = [];
  }

  create() {
    const width = this.sys.game.config.width;
    this.instruction = this.add
      .text(width / 2, 20, 'Välj Boxer 1', {
        font: '24px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    BOXERS.forEach((b, i) => {
      const y = 60 + i * 30;
      const txt = this.add.text(50, y, `${b.name} (${b.country})`, {
        font: '20px Arial',
        color: '#ffffff',
      });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => this.select(i));
    });
  }

  select(index) {
    this.choice.push(BOXERS[index]);
    if (this.step === 1) {
      this.step = 2;
      this.instruction.setText('Välj Boxer 2');
    } else {
      const [boxer1, boxer2] = this.choice;
      this.scene.launch('OverlayUI');
      this.scene.start('Match', { boxer1, boxer2 });
    }
  }
}
