import { BOXERS } from './boxer-data.js';

export class SelectBoxerScene extends Phaser.Scene {
  constructor() {
    super('SelectBoxer');
    this.step = 1;
    this.choice = [];
    this.options = [];
  }

  create() {
    const width = this.sys.game.config.width;
    this.instruction = this.add
      .text(width / 2, 20, 'Välj Boxer 1', {
        font: '24px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);
    this.showBoxerOptions();
  }

  showBoxerOptions() {
    this.clearOptions();
    BOXERS.forEach((b, i) => {
      const y = 60 + i * 30;
      const txt = this.add.text(50, y, `${b.name} (${b.country})`, {
        font: '20px Arial',
        color: '#ffffff',
      });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => this.selectBoxer(i));
      this.options.push(txt);
    });
  }

  showStrategyOptions() {
    this.clearOptions();
    for (let i = 1; i <= 10; i++) {
      const y = 60 + i * 30;
      const txt = this.add.text(50, y, `Strategi ${i}`, {
        font: '20px Arial',
        color: '#ffffff',
      });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => this.startMatch(i));
      this.options.push(txt);
    }
  }

  clearOptions() {
    this.options.forEach((o) => o.destroy());
    this.options = [];
  }

  selectBoxer(index) {
    this.choice.push(BOXERS[index]);
    if (this.step === 1) {
      this.step = 2;
      this.instruction.setText('Välj Boxer 2');
    } else if (this.step === 2) {
      this.step = 3;
      this.instruction.setText('Välj Strategi');
      this.showStrategyOptions();
    }
  }

  startMatch(level) {
    const [boxer1, boxer2] = this.choice;
    this.scene.launch('OverlayUI');
    this.scene.start('Match', { boxer1, boxer2, aiLevel: level });
  }
}
