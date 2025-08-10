import { getMatchLog } from './match-log.js';
import { SoundManager } from './sound-manager.js';
import { getPlayerBoxer } from './player-boxer.js';
import { tableAlpha } from './config.js';
import { formatMoney } from './helpers.js';

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
    const tableWidth = width * 0.95;
    const startX = width * 0.025;
    const rowHeight = 24;
    this.tableWidth = tableWidth;
    this.rowHeight = rowHeight;
    this.startX = startX;
    const colPercents = [
      0.05,
      0.07,
      0.28,
      0.08,
      0.19,
      0.08,
      0.06,
      0.06,
      0.06,
      0.07,
    ];
    let accum = startX;
    this.colX = colPercents.map((p) => {
      const x = accum;
      accum += p * tableWidth;
      return x;
    });
    const headerY = 80;
    this.add
      .rectangle(width / 2, headerY, tableWidth, rowHeight, 0x808080, tableAlpha)
      .setOrigin(0.5, 0);
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
        'Arena',
        'Rank',
        'Opponent',
        'Result',
        'How',
        'Round',
        'Time',
        'Prize money',
      ];
      headers.forEach((h, i) => {
        this.add.text(this.colX[i], headerY, h, {
          font: '18px Arial',
          color: '#ffffff',
        });
      });
      this.startY = headerY + rowHeight + 6;
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
    const width = this.sys.game.config.width;
    const rowHeight = this.rowHeight;
    this.log.forEach((entry, index) => {
      const rowRect = this.add
        .rectangle(width / 2, y, this.tableWidth, rowHeight, 0x808080, tableAlpha)
        .setOrigin(0.5, 0);
      this.rowObjs.push(rowRect);

      const toggle = this.add
        .text(this.startX - 15, y, this.expandedRows.has(index) ? '-' : '+', {
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

      const arenaText = [entry.arena?.Name, entry.arena?.City]
        .filter(Boolean)
        .join(', ');
      const row = [
        entry.year,
        entry.date,
        arenaText,
        entry.rank,
        `${entry.opponent} (rank ${entry.opponentRank})`,
        entry.result,
        entry.method === 'KO' ? 'KO' : entry.score,
        entry.round,
        entry.method === 'KO' ? entry.time : '-',
        entry.prize != null ? formatMoney(entry.prize) : '-',
      ];
      row.forEach((text, i) => {
        const obj = this.add.text(this.colX[i], y, String(text), {
          font: '16px Arial',
          color: '#ffffff',
        });
        this.rowObjs.push(obj);
      });
      y += rowHeight;

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
