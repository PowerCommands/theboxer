import { getRankings } from './boxer-stats.js';
import { getTestMode, tableAlpha } from './config.js';
import { getPlayerBoxer } from './player-boxer.js';
import { SoundManager } from './sound-manager.js';
import {
  scheduleMatch,
  getPendingMatch,
  clearPendingMatch,
} from './next-match.js';

export class SelectBoxerScene extends Phaser.Scene {
  constructor() {
    super('SelectBoxer');
    this.step = 1;
    this.choice = [];
    this.options = [];
    this.selectedStrategy1 = null;
    this.selectedStrategy2 = null;
    this.isBoxer1Human = false;
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

    if (getTestMode()) {
      // checkbox to toggle human control for boxer1 in test mode
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
        .setOrigin(0.5, 0)
        .setVisible(this.isBoxer1Human);
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
    }

    // When returning to this scene (e.g. after a match) the previous
    // selection state may still linger because the scene instance is
    // reused.  Reset everything so that the boxer options can be
    // selected again.
    this.resetSelection();
  }

  showBoxerOptions() {
    this.clearOptions();
    const width = this.sys.game.config.width;
    const boxers = getRankings();
    const maxNameLen = boxers.reduce((m, b) => Math.max(m, b.name.length), 4);
    const columnWidths = [5, Math.max(15, maxNameLen + 1), 5, 5, 5, 5, 5, 5];
    const charWidth = 12;
    const rectWidth = columnWidths.reduce((a, c) => a + c, 0) * charWidth;
    const tableLeft = (width - rectWidth) / 2;
    const rowHeight = 24;
    this.options.push(
      this.add
        .rectangle(width / 2, 60, rectWidth, rowHeight, 0x001b44, tableAlpha)
        .setOrigin(0.5, 0)
    );
    const headers =
      `${'Rank'.padEnd(columnWidths[0])}` +
      `${'Name'.padEnd(columnWidths[1])}` +
      `${'Age'.padEnd(columnWidths[2])}` +
      `${'M'.padEnd(columnWidths[3])}` +
      `${'W'.padEnd(columnWidths[4])}` +
      `${'L'.padEnd(columnWidths[5])}` +
      `${'D'.padEnd(columnWidths[6])}` +
      `${'KO'.padEnd(columnWidths[7])}`;
    const headerText = this.add.text(tableLeft, 60, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });
    this.options.push(headerText);
    boxers.forEach((b, i) => {
      const y = 80 + i * 24;
      this.options.push(
        this.add
          .rectangle(width / 2, y, rectWidth, rowHeight, 0x001b44, tableAlpha)
          .setOrigin(0.5, 0)
      );
      const line =
        `${b.ranking.toString().padEnd(columnWidths[0])}` +
        `${b.name.padEnd(columnWidths[1])}` +
        `${b.age.toString().padEnd(columnWidths[2])}` +
        `${b.matches.toString().padEnd(columnWidths[3])}` +
        `${b.wins.toString().padEnd(columnWidths[4])}` +
        `${b.losses.toString().padEnd(columnWidths[5])}` +
        `${b.draws.toString().padEnd(columnWidths[6])}` +
        `${b.winsByKO.toString().padEnd(columnWidths[7])}`;
      const txt = this.add.text(tableLeft, y, line, {
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

  showControlOptions() {
    this.clearOptions();
    const width = this.sys.game.config.width;
    const keyboard = this.add.text(width / 2, 60, 'Keyboard', {
      font: '20px Arial',
      color: '#ffffff',
    });
    keyboard.setOrigin(0.5, 0);
    keyboard.setInteractive({ useHandCursor: true });
    keyboard.on('pointerdown', () => this.selectControl('human'));
    const ai = this.add.text(width / 2, 100, 'AI', {
      font: '20px Arial',
      color: '#ffffff',
    });
    ai.setOrigin(0.5, 0);
    ai.setInteractive({ useHandCursor: true });
    ai.on('pointerdown', () => this.selectControl('ai'));
    this.options.push(keyboard, ai);
  }

  showOpponentOptions() {
    this.clearOptions();
    const width = this.sys.game.config.width;
    const allBoxers = getRankings();
    const maxNameLen = allBoxers.reduce((m, b) => Math.max(m, b.name.length), 4);
    const namePad = Math.max(15, maxNameLen + 1);
    const columnWidths = [5, namePad, 5, 5, 5, 5, 5, 5];
    const totalChars = columnWidths.reduce((a, c) => a + c, 0);
    const charWidth = 12;
    const rectWidth = totalChars * charWidth;
    const rowHeight = 24;
    const tableLeft = (width - rectWidth) / 2;
    this.options.push(
      this.add
        .rectangle(width / 2, 60, rectWidth, rowHeight, 0x001b44, tableAlpha)
        .setOrigin(0.5, 0)
    );
    const headers = `${'Rank'.padEnd(columnWidths[0])}${'Name'.padEnd(columnWidths[1])}${'Age'.padEnd(columnWidths[2])}${'M'.padEnd(columnWidths[3])}${'W'.padEnd(columnWidths[4])}${'L'.padEnd(columnWidths[5])}${'D'.padEnd(columnWidths[6])}${'KO'.padEnd(columnWidths[7])}`;
    const headerText = this.add.text(tableLeft, 60, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });
    this.options.push(headerText);
    const player = getPlayerBoxer();
    const boxers = allBoxers.filter((b) => {
      if (b === player) return true;
      // Allow facing any lower-ranked boxer but limit higher-ranked
      // opponents to within three positions above the player.
      if (b.ranking < player.ranking) {
        return b.ranking >= player.ranking - 3;
      }
      return true;
    });
    boxers.forEach((b, i) => {
      const y = 80 + i * 24;
      this.options.push(
        this.add
          .rectangle(width / 2, y, rectWidth, rowHeight, 0x001b44, tableAlpha)
          .setOrigin(0.5, 0)
      );
      const line = `${b.ranking.toString().padEnd(columnWidths[0])}${b.name.padEnd(columnWidths[1])}${b.age.toString().padEnd(columnWidths[2])}${b.matches.toString().padEnd(columnWidths[3])}${b.wins.toString().padEnd(columnWidths[4])}${b.losses.toString().padEnd(columnWidths[5])}${b.draws.toString().padEnd(columnWidths[6])}${b.winsByKO.toString().padEnd(columnWidths[7])}`;
      const isPlayer = b === player;
      const txt = this.add.text(tableLeft, y, line, {
        font: '20px monospace',
        color: isPlayer ? '#404040' : '#ffffff',
        fontStyle: isPlayer ? 'bold' : 'normal',
      });
      if (!isPlayer) {
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => this.selectBoxer(b));
      }
      this.options.push(txt);
    });
  }

  selectControl(mode) {
    SoundManager.playClick();
    this.isBoxer1Human = mode === 'human';
    if (this.isBoxer1Human) {
      this.selectedStrategy1 = 'default';
      this.step = 2;
      this.instruction.setText('Choose your opponent');
      this.showOpponentOptions();
    } else {
      this.step = 1;
      this.instruction.setText('Choose Player 1 strategy');
      this.showStrategyOptions();
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
    SoundManager.playClick();
    if (!getTestMode() && this.step === 2) {
      this.choice.push(boxer);
      this.selectedStrategy2 = 'default';
      this.step = 3;
      this.instruction.setText('Choose number of rounds (1-13)');
      this.showRoundOptions();
      return;
    }

    this.choice.push(boxer);
    if (this.step === 1) {
      if (this.humanBox) this.humanBox.disableInteractive();
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
          this.step = 2;
          this.instruction.setText('Choose your opponent');
          this.showOpponentOptions();
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
    SoundManager.playClick();
    if (this.step === 1) {
      // non-test mode: player strategy selection
      this.selectedStrategy1 = level;
      this.input.once('pointerup', () => {
        this.step = 2;
        this.instruction.setText('Choose your opponent');
        this.showOpponentOptions();
      });
    } else if (this.step === 2) {
      // test mode: player strategy selection
      this.selectedStrategy1 = level;
      this.input.once('pointerup', () => {
        this.step = 3;
        this.instruction.setText('Choose your opponent');
        this.showBoxerOptions();
      });
    } else if (this.step === 4) {
      // test mode: opponent strategy selection
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
    const [boxer1, boxer2] = this.choice;
    const rounds = this.selectedRounds ?? 1;
    const aiLevel1 = this.isBoxer1Human
      ? null
      : this.selectedStrategy1 ?? 'default';
    const aiLevel2 = this.selectedStrategy2 ?? 'default';
    scheduleMatch({ boxer1, boxer2, aiLevel1, aiLevel2, rounds });
    const pending = getPendingMatch();
    if (pending) {
      const matchData = {
        ...pending,
        red: pending.boxer1,
        blue: pending.boxer2,
      };
      clearPendingMatch();
      this.scene.start('MatchIntroScene', matchData);
    } else {
      this.scene.start('Ranking');
    }
  }

  resetSelection() {
    this.choice = [];
    this.selectedStrategy1 = null;
    this.selectedStrategy2 = null;
    this.selectedRounds = null;
    this.isBoxer1Human = false;
    if (!getTestMode() && getPlayerBoxer()) {
      this.choice = [getPlayerBoxer()];
      this.step = 0;
      this.instruction.setText('Choose control method');
      this.showControlOptions();
    } else {
      this.step = 1;
      if (this.humanCheck) this.humanCheck.setVisible(false);
      if (this.humanBox) this.humanBox.setInteractive({ useHandCursor: true });
      this.instruction.setText('Choose your boxer');
      this.showBoxerOptions();
    }
  }

}
