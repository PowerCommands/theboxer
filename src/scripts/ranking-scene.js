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

    const rectWidth = width - 160;
    const rowHeight = 24;
    const tableLeft = 80;
    const tableTop = 60;
    this.add
      .rectangle(width / 2, tableTop, rectWidth, rowHeight, 0x808080, 0.5)
      .setOrigin(0.5, 0);
    const headers = `${'Rank'.padEnd(5)}${'Name'.padEnd(15)}${'Age'.padEnd(5)}${'M'.padEnd(5)}${'W'.padEnd(5)}${'L'.padEnd(5)}${'D'.padEnd(5)}${'KO'.padEnd(5)}`;
    this.add.text(tableLeft, tableTop, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });

    const boxers = getRankings();
    const tableBottom = tableTop + 20 + boxers.length * rowHeight;
    boxers.forEach((b, i) => {
      const y = tableTop + 20 + i * rowHeight; // 20px offset from header
      this.add
        .rectangle(width / 2, y, rectWidth, rowHeight, 0x808080, 0.5)
        .setOrigin(0.5, 0);
      const line = `${b.ranking.toString().padEnd(5)}${b.name.padEnd(15)}${b.age
        .toString()
        .padEnd(5)}${b.matches
        .toString()
        .padEnd(5)}${b.wins.toString().padEnd(5)}${b.losses
        .toString()
        .padEnd(5)}${b.draws
        .toString()
        .padEnd(5)}${b.winsByKO.toString().padEnd(5)}`;
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

