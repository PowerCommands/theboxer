import { getRankings } from './boxer-stats.js';
import { getTestMode, setTestMode } from './config.js';
import { getPlayerBoxer } from './player-boxer.js';
import { SoundManager } from './sound-manager.js';

export class RankingScene extends Phaser.Scene {
  constructor() {
    super('Ranking');
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    SoundManager.playMenuLoop();
    this.add
      .text(width / 2, 20, 'Ranking', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const boxers = getRankings();
    const maxNameLen = boxers.reduce((m, b) => Math.max(m, b.name.length), 4);
    const namePad = Math.max(15, maxNameLen + 1);
    const columnWidths = [5, namePad, 5, 5, 5, 5, 5, 5];
    const totalChars = columnWidths.reduce((a, c) => a + c, 0);
    const charWidth = 12;
    const rectWidth = totalChars * charWidth;
    const rowHeight = 24;
    const tableTop = 60;
    const tableLeft = (width - rectWidth) / 2;
    this.add
      .rectangle(width / 2, tableTop, rectWidth, rowHeight, 0x808080, 0.5)
      .setOrigin(0.5, 0);
    const headers = `${'Rank'.padEnd(columnWidths[0])}${'Name'.padEnd(columnWidths[1])}${'Age'.padEnd(columnWidths[2])}${'M'.padEnd(columnWidths[3])}${'W'.padEnd(columnWidths[4])}${'L'.padEnd(columnWidths[5])}${'D'.padEnd(columnWidths[6])}${'KO'.padEnd(columnWidths[7])}`;
    this.add.text(tableLeft, tableTop, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });

    const tableBottom = tableTop + 20 + boxers.length * rowHeight;
    boxers.forEach((b, i) => {
      const y = tableTop + 20 + i * rowHeight; // 20px offset from header
      this.add
        .rectangle(width / 2, y, rectWidth, rowHeight, 0x808080, 0.5)
        .setOrigin(0.5, 0);
      const line = `${b.ranking.toString().padEnd(columnWidths[0])}${b.name.padEnd(columnWidths[1])}${b.age.toString().padEnd(columnWidths[2])}${b.matches.toString().padEnd(columnWidths[3])}${b.wins.toString().padEnd(columnWidths[4])}${b.losses.toString().padEnd(columnWidths[5])}${b.draws.toString().padEnd(columnWidths[6])}${b.winsByKO.toString().padEnd(columnWidths[7])}`;
      this.add.text(tableLeft, y, line, {
        font: '20px monospace',
        color: '#ffffff',
      });
    });

    const hasPlayer = !!getPlayerBoxer();
    const btnLabel = getTestMode()
      ? 'Start new game'
      : hasPlayer
      ? 'Start next match'
      : 'Start new game';
    const startBtn = this.add
      .text(tableLeft, tableBottom + 10, btnLabel, {
        font: '24px Arial',
        color: '#00ff00',
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        if (getTestMode()) {
          this.scene.start('SelectBoxer');
        } else if (hasPlayer) {
          this.scene.start('SelectBoxer');
        } else {
          this.scene.start('CreateBoxer');
        }
      });

    const cbX = tableLeft;
    const cbY = tableTop - 40;
    const testBox = this.add
      .rectangle(cbX, cbY, 20, 20, 0xffffff)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    const testCheck = this.add
      .text(cbX + 10, cbY, 'X', {
        font: '20px Arial',
        color: '#000000',
      })
      .setOrigin(0.5, 0)
      .setVisible(getTestMode());
    this.add
      .text(cbX + 30, cbY - 5, 'Test mode', {
        font: '20px Arial',
        color: '#ffffff',
      })
      .setOrigin(0, 0);
    testBox.on('pointerdown', () => {
      const newVal = !getTestMode();
      setTestMode(newVal);
      testCheck.setVisible(newVal);
    });
  }
}

