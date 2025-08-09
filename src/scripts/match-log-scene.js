import { getMatchLog } from './match-log.js';
import { SoundManager } from './sound-manager.js';
import { getPlayerBoxer } from './player-boxer.js';

export class MatchLogScene extends Phaser.Scene {
  constructor() {
    super('MatchLog');
  }

  create() {
    const width = this.sys.game.config.width;
    SoundManager.playMenuLoop();
    const player = getPlayerBoxer();
    const header = player
      ? `${player.name} (${player.wins || 0} Win ${player.losses || 0} Loss ${
          player.winsByKO || 0
        } KO)`
      : 'Match log';
    this.add
      .text(width / 2, 20, header, {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const log = getMatchLog();
    let y = 80;
    if (!log.length) {
      this.add
        .text(width / 2, y, 'No matches recorded', {
          font: '24px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0);
    } else {
      const headers = [
        'Year',
        'Date',
        'Rank',
        'Opponent',
        'Result',
        'How',
        'Round',
        'Time',
      ];
      const x = [20, 80, 150, 220, 420, 500, 580, 660];
      headers.forEach((h, i) => {
        this.add.text(x[i], y, h, { font: '24px Arial', color: '#ffffff' });
      });
      y += 30;
      log.forEach((entry) => {
        const row = [
          entry.year,
          entry.date,
          entry.rank,
          `${entry.opponent} (rank ${entry.opponentRank})`,
          entry.result,
          entry.method === 'KO' ? 'KO' : entry.score,
          entry.round,
          entry.method === 'KO' ? entry.time : '-',
        ];
        row.forEach((text, i) => {
          this.add.text(x[i], y, String(text), {
            font: '20px Arial',
            color: '#ffffff',
          });
        });
        y += 24;
      });
    }

    this.add
      .text(20, this.sys.game.config.height - 40, 'Back', {
        font: '24px Arial',
        color: '#00ff00',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.scene.start('Ranking');
      });
  }
}
