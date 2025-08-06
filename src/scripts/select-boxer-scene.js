import { BOXERS } from './boxer-data.js';

export class SelectBoxerScene extends Phaser.Scene {
  constructor() {
    super('SelectBoxer');
    this.step = 1;
    this.choice = [];
    this.options = [];
    this.selectedStrategy = null;
  }

  create() {
    const width = this.sys.game.config.width;
    this.instruction = this.add
      .text(width / 2, 20, 'Choose your boxer', {
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
      const txt = this.add.text(50, y, `Strategy ${i}`, {
        font: '20px Arial',
        color: '#ffffff',
      });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => this.selectStrategy(i));
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
      this.instruction.setText('Choose your opponent');
    } else if (this.step === 2) {
      this.step = 3;
      this.instruction.setText("Choose the opponent's strategy");
      this.showStrategyOptions();
    }
  }

  selectStrategy(level) {
    this.selectedStrategy = level;
    this.showSummary();
  }

  showSummary() {
    this.clearOptions();
    const width = this.sys.game.config.width;
    const [player, opponent] = this.choice;
    this.instruction.setText('Summary');

    const summaryText = `You: ${player.name}
Opponent: ${opponent.name}
Strategy: ${this.selectedStrategy}`;
    const summary = this.add
      .text(width / 2, 80, summaryText, {
        font: '20px Arial',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.options.push(summary);

    const okBtn = this.add
      .text(width / 2 - 60, 200, 'OK', {
        font: '20px Arial',
        color: '#00ff00',
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    okBtn.on('pointerdown', () => this.startMatch());

    const cancelBtn = this.add
      .text(width / 2 + 60, 200, 'Cancel', {
        font: '20px Arial',
        color: '#ff0000',
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.resetSelection());

    this.options.push(okBtn, cancelBtn);
  }

  resetSelection() {
    this.clearOptions();
    this.choice = [];
    this.step = 1;
    this.selectedStrategy = null;
    this.instruction.setText('Choose your boxer');
    this.showBoxerOptions();
  }

  startMatch() {
    const [boxer1, boxer2] = this.choice;
    const aiLevel = this.selectedStrategy ?? 1;
    this.scene.launch('OverlayUI');
    this.scene.start('Match', {
      boxer1,
      boxer2,
      aiLevel,
    });
  }
}
