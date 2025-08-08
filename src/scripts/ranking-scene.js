import { getRankings } from './boxer-stats.js';
import { getTestMode, setTestMode } from './config.js';
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
    this.add
      .rectangle(width / 2, 60, rectWidth, rowHeight, 0x808080, 0.5)
      .setOrigin(0.5, 0);
    const headers = `${'Rank'.padEnd(5)}${'Name'.padEnd(15)}${'Age'.padEnd(5)}${'M'.padEnd(5)}${'W'.padEnd(5)}${'L'.padEnd(5)}${'D'.padEnd(5)}${'KO'.padEnd(5)}`;
    this.add.text(80, 60, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });

    const boxers = getRankings();
    boxers.forEach((b, i) => {
      const y = 80 + i * 24;
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
      this.add.text(80, y, line, {
        font: '20px monospace',
        color: '#ffffff',
      });
    });

    const startBtn = this.add
      .text(width / 2, height - 60, 'Start new game', {
        font: '24px Arial',
        color: '#00ff00',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.scene.start('SelectBoxer');
      });

    const cbX = width / 2 + 180;
    const cbY = height - 65;
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

