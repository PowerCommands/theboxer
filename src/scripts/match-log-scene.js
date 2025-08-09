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

    this.log = getMatchLog();
    this.expandedRows = new Set();
    this.colX = [20, 90, 170, 330, 630, 720, 800, 880];
    const headerY = 80;
    if (!this.log.length) {
      this.add
        .text(width / 2, headerY, 'No matches recorded', {
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
      headers.forEach((h, i) => {
        this.add.text(this.colX[i], headerY, h, {
          font: '24px Arial',
          color: '#ffffff',
        });
      });
      this.startY = headerY + 30;
      this.renderRows();
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

  renderRows() {
    if (this.rowObjs) {
      this.rowObjs.forEach((obj) => obj.destroy());
    }
    this.rowObjs = [];
    let y = this.startY;
    this.log.forEach((entry, index) => {
      const toggle = this.add
        .text(5, y, this.expandedRows.has(index) ? '-' : '+', {
          font: '20px Arial',
          color: '#00ff00',
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          if (this.expandedRows.has(index)) {
            this.expandedRows.delete(index);
          } else {
            this.expandedRows.add(index);
          }
          this.renderRows();
        });
      this.rowObjs.push(toggle);

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
        const obj = this.add.text(this.colX[i], y, String(text), {
          font: '20px Arial',
          color: '#ffffff',
        });
        this.rowObjs.push(obj);
      });
      y += 24;

      if (this.expandedRows.has(index) && Array.isArray(entry.roundDetails)) {
        entry.roundDetails.forEach((rd) => {
          const detail = this.add.text(
            this.colX[3],
            y,
            `R${rd.round}: ${rd.userScore}-${rd.oppScore} (${rd.totalUser}-${rd.totalOpp})`,
            { font: '18px Arial', color: '#cccccc' }
          );
          this.rowObjs.push(detail);
          y += 20;
        });
      }
    });
  }
}
