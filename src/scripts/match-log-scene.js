import { getMatchLog } from './match-log.js';
import { SoundManager } from './sound-manager.js';
import { getPlayerBoxer } from './player-boxer.js';
import { tableAlpha } from './config.js';
import { formatMoney } from './helpers.js';

export class MatchLogScene extends Phaser.Scene {
  constructor() {
    super('MatchLog');
  }

  create(data) {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    SoundManager.playMenuLoop();
    const boxer = data?.boxer || getPlayerBoxer();
    const header = boxer
      ? `${boxer.name} (${boxer.wins || 0} Win ${boxer.losses || 0} Loss ${
          boxer.winsByKO || 0
        } KO)`
      : 'Match log';
    this.add
      .text(width / 2, 20, header, {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    this.log = getMatchLog(boxer?.name);
    this.expandedRows = new Set();
    const tableWidth = width * 0.95;
    const startX = width * 0.025;
    const rowHeight = 24;
    this.tableWidth = tableWidth;
    this.rowHeight = rowHeight;
    this.startX = startX;
    this.tableBottom = height * 0.85;
    const colPercents = [
      0.08,
      0.28,
      0.08,
      0.19,
      0.08,
      0.06,
      0.06,
      0.07,
      0.1,
    ];
    let accum = startX;
    this.colX = colPercents.map((p) => {
      const x = accum;
      accum += p * tableWidth;
      return x;
    });
    const headerY = 80;
    this.add
      .rectangle(width / 2, headerY, tableWidth, rowHeight, 0x001b44, tableAlpha)
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

    const btnX = width / 2;
    const btnY = height * 0.93;
    const bgColor = 0x001b44;
    const bgAlpha = 0.4;
    const backBtn = this.add.container(btnX, btnY);
    backBtn.setSize(500, 80);
    const bg = this.add.rectangle(0, 0, 500, 80, bgColor, bgAlpha);
    const label = this.add
      .text(0, 0, 'Back', { font: '32px Arial', color: '#ffffff' })
      .setOrigin(0.5);
    const gloveL = this.add
      .image(-300, 0, 'glove_horizontal')
      .setDisplaySize(100, 70);
    const gloveR = this.add
      .image(300, 0, 'glove_horizontal')
      .setDisplaySize(100, 70)
      .setFlipX(true);
    backBtn.add([bg, label, gloveL, gloveR]);
    this.tweens.add({ targets: gloveL, x: -150, duration: 800, ease: 'Sine.Out' });
    this.tweens.add({ targets: gloveR, x: 150, duration: 800, ease: 'Sine.Out' });
    backBtn
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
    for (let [index, entry] of this.log.entries()) {
      if (y > this.tableBottom) {
        break;
      }
      const rowRect = this.add
        .rectangle(width / 2, y, this.tableWidth, rowHeight, 0x001b44, tableAlpha)
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
      const [day, monthName] = String(entry.date).split(' ');
      const months = {
        Januari: '01',
        Februari: '02',
        Mars: '03',
        April: '04',
        Maj: '05',
        Juni: '06',
        Juli: '07',
        Augusti: '08',
        September: '09',
        Oktober: '10',
        November: '11',
        December: '12',
      };
      const monthNum = months[monthName] || '01';
      const dateStr = `${entry.year}${monthNum}${String(day).padStart(2, '0')}`;
      const timeStr =
        entry.method === 'KO' ? String(entry.time).padStart(5, '0') : '-';
      const row = [
        dateStr,
        arenaText,
        entry.rank,
        `${entry.opponent} (rank ${entry.opponentRank})`,
        entry.result,
        entry.method === 'KO' ? 'KO' : entry.score,
        entry.round,
        timeStr,
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
        for (const rd of entry.roundDetails) {
          if (y > this.tableBottom) {
            break;
          }
          const detail = this.add.text(
            this.colX[2],
            y,
            `R${rd.round}: ${rd.userScore}-${rd.oppScore} (${rd.totalUser}-${rd.totalOpp})`,
            { font: '18px Arial', color: '#cccccc' }
          );
          this.rowObjs.push(detail);
          y += 20;
        }
      }
    }
  }
}
