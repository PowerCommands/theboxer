import { getRankings } from './boxer-stats.js';
import { getTestMode } from './config.js';

export class SelectBoxerScene extends Phaser.Scene {
  constructor() {
    super('SelectBoxer');
    this.step = 1;
    this.choice = [];
    this.options = [];
    this.selectedStrategy1 = null;
    this.selectedStrategy2 = null;
    this.isBoxer1Human = true;
    this.selectedRounds = null;
  }

  create() {
    const width = this.sys.game.config.width;
    this.instruction = this.add
      .text(width / 2, 20, '', {
        font: '24px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    // checkbox to toggle human control for boxer1
    const cbX = width - 250;
    this.humanBox = this.add
      .rectangle(cbX, 25, 20, 20, 0xffffff)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.humanCheck = this.add
      .text(cbX + 10, 25, 'X', {
        font: '20px Arial',
        color: '#000000',
      })
      .setOrigin(0.5, 0);
    this.add
      .text(cbX + 30, 20, 'Human Controlled', {
        font: '20px Arial',
        color: '#ffffff',
      })
      .setOrigin(0, 0);
    this.humanBox.on('pointerdown', () => {
      this.isBoxer1Human = !this.isBoxer1Human;
      this.humanCheck.setVisible(this.isBoxer1Human);
    });

    // When returning to this scene (e.g. after a match) the previous
    // selection state may still linger because the scene instance is
    // reused.  Reset everything so that the boxer options can be
    // selected again.
    this.resetSelection();
  }

  showBoxerOptions() {
    this.clearOptions();
    const headers = `${'Rank'.padEnd(5)}${'Name'.padEnd(15)}${'Age'.padEnd(5)}${'M'.padEnd(5)}${'W'.padEnd(5)}${'L'.padEnd(5)}${'D'.padEnd(5)}${'KO'.padEnd(5)}`;
    const headerText = this.add.text(80, 60, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });
    this.options.push(headerText);
    const boxers = getRankings();
    boxers.forEach((b, i) => {
      const line = `${b.ranking.toString().padEnd(5)}${b.name.padEnd(15)}${b.age
        .toString()
        .padEnd(5)}${b.matches
        .toString()
        .padEnd(5)}${b.wins.toString().padEnd(5)}${b.losses
        .toString()
        .padEnd(5)}${b.draws
        .toString()
        .padEnd(5)}${b.winsByKO.toString().padEnd(5)}`;
      const y = 80 + i * 24;
      const txt = this.add.text(80, y, line, {
        font: '20px monospace',
        color: '#ffffff',
      });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => this.selectBoxer(b));
      this.options.push(txt);
    });
  }

  showStrategyOptions() {
    this.clearOptions();
    let y = 60;
    const defTxt = this.add.text(50, y, `Default`, {
      font: '20px Arial',
      color: '#ffffff',
    });
    defTxt.setInteractive({ useHandCursor: true });
    defTxt.on('pointerdown', () => this.selectStrategy('default'));
    this.options.push(defTxt);
    for (let i = 1; i <= 10; i++) {
      y += 30;
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

  selectBoxer(boxer) {
    this.choice.push(boxer);
    if (this.step === 1) {
      this.humanBox.disableInteractive();
      if (this.isBoxer1Human) {
        this.step = 3;
        this.instruction.setText('Choose your opponent');
      } else {
        if (getTestMode()) {
          this.step = 2;
          this.instruction.setText('Choose Player 1 strategy');
          this.showStrategyOptions();
        } else {
          this.selectedStrategy1 = 'default';
          this.step = 3;
          this.instruction.setText('Choose your opponent');
        }
      }
    } else if (this.step === 3) {
      if (getTestMode()) {
        this.step = 4;
        this.instruction.setText("Choose the opponent's strategy");
        this.showStrategyOptions();
      } else {
        this.selectedStrategy2 = 'default';
        this.step = 5;
        this.instruction.setText('Choose number of rounds (1-13)');
        this.showRoundOptions();
      }
    }
  }

  selectStrategy(level) {
    if (this.step === 2) {
      this.selectedStrategy1 = level;
      this.input.once('pointerup', () => {
        this.step = 3;
        this.instruction.setText('Choose your opponent');
        this.showBoxerOptions();
      });
    } else if (this.step === 4) {
      this.selectedStrategy2 = level;
      this.input.once('pointerup', () => {
        this.step = 5;
        this.instruction.setText('Choose number of rounds (1-13)');
        this.showRoundOptions();
      });
    }
  }

  showRoundOptions() {
    this.clearOptions();
    for (let i = 1; i <= 13; i++) {
      const y = 60 + i * 25;
      const txt = this.add.text(50, y, `${i}`, {
        font: '20px Arial',
        color: '#ffffff',
      });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => this.selectRounds(i));
      this.options.push(txt);
    }
  }

  selectRounds(num) {
    this.selectedRounds = num;
    this.input.once('pointerup', () => this.showSummary());
  }

  showSummary() {
    this.clearOptions();
    const width = this.sys.game.config.width;
    const [player, opponent] = this.choice;
    this.instruction.setText('Summary');

    const summaryLines = [
      `Player 1: ${player.name}`,
      this.isBoxer1Human
        ? 'Human controlled'
        : `Strategy: ${
            this.selectedStrategy1 === 'default'
              ? 'Default'
              : this.selectedStrategy1
          }`,
      `Player 2: ${opponent.name}`,
      `Strategy: ${
        this.selectedStrategy2 === 'default'
          ? 'Default'
          : this.selectedStrategy2
      }`,
      `Rounds: ${this.selectedRounds}`,
    ];
    const summaryText = summaryLines.join('\n');
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
    this.selectedStrategy1 = null;
    this.selectedStrategy2 = null;
    this.selectedRounds = null;
    this.isBoxer1Human = true;
    if (this.humanCheck) this.humanCheck.setVisible(true);
    if (this.humanBox) this.humanBox.setInteractive({ useHandCursor: true });
    this.instruction.setText('Choose your boxer');
    this.showBoxerOptions();
  }

  startMatch() {
    const [boxer1, boxer2] = this.choice;
    const rounds = this.selectedRounds ?? 1;
    const aiLevel1 = this.isBoxer1Human
      ? null
      : this.selectedStrategy1 ?? 'default';
    const aiLevel2 = this.selectedStrategy2 ?? 'default';
    this.scene.launch('OverlayUI');
    this.scene.start('Match', {
      boxer1,
      boxer2,
      aiLevel1,
      aiLevel2,
      rounds,
    });
  }
}
