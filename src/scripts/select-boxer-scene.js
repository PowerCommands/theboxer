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
      .text(width / 2, 20, '', {
        font: '24px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);
    // When returning to this scene (e.g. after a match) the previous
    // selection state may still linger because the scene instance is
    // reused.  Reset everything so that the boxer options can be
    // selected again.
    this.resetSelection();
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
    this.options.forEach((o) => {
      if (o && !o.destroyed) {
        o.destroy();
      }
    });
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
    // Defer showing the summary until the pointer is released.
    // Destroying interactive objects during their pointerdown handler
    // can leave the input system in an inconsistent state, which makes
    // subsequent buttons (like OK/Cancel) unresponsive. Waiting for the
    // pointerup event ensures the previous interaction completes before
    // clearing the options and adding new interactive elements.
    this.input.once('pointerup', () => this.showSummary());
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
    // Use the button's own pointerup event to start the match.
    // Listening on the scene's global input and waiting for a
    // subsequent pointerup could miss the event if the pointer is
    // released outside the game canvas. By reacting directly to the
    // button's pointerup event we ensure the match always starts when
    // the player confirms their selection, while still waiting until
    // the click interaction has fully completed.
    okBtn.on('pointerup', () => {
      this.startMatch();
    });

    const cancelBtn = this.add
      .text(width / 2 + 60, 200, 'Cancel', {
        font: '20px Arial',
        color: '#ff0000',
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    // Likewise, handle cancel on pointerup so that destroying and
    // recreating the option elements does not interfere with the
    // current pointerdown processing.
    cancelBtn.on('pointerup', () => {
      this.resetSelection();
    });

    this.options.push(okBtn, cancelBtn);
  }

  resetSelection() {
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
