import { getMatchLog } from './match-log.js';
import { SoundManager } from './sound-manager.js';
import { getPlayerBoxer } from './player-boxer.js';
import { tableAlpha } from './config.js';
import { formatMoney } from './helpers.js';
import { getBalance } from './bank-account.js';

export class MatchLogScene extends Phaser.Scene {
  constructor() {
    super('MatchLog');
  }

  create(data) {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    SoundManager.playMenuLoop();
    const startX = width * 0.025;
    const boxer = data?.boxer || getPlayerBoxer();
    const header = boxer
      ? `${boxer.name} (${boxer.wins || 0} Win ${boxer.losses || 0} Loss ${
          boxer.winsByKO || 0
        } KO)`
      : 'Match log';
    this.add
      .text(startX, 20, header, {
        font: '28px Arial',
        color: '#ffffff',
      })
      .setOrigin(0, 0);

    let headerY = 80;
    if (boxer) {
      const balance =
        boxer === getPlayerBoxer() ? getBalance() : boxer.bank || 0;
      const balanceText = this.add
        .text(startX, 60, `Bank account balance: ${formatMoney(balance)}`, {
          font: '24px Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0);
      if (boxer === getPlayerBoxer()) {
        this.add
          .text(
            balanceText.x + balanceText.displayWidth + 20,
            60,
            'Buy Perks',
            { font: '24px Arial', color: '#ffff00' }
          )
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.scene.start('PerksScene');
          });
      }
      const perksY = 120;
      if (boxer.perks && boxer.perks.length) {
        let x = startX + 32;
        boxer.perks.forEach((perk) => {
          const key = `${perk.Name.toLowerCase()}-level${perk.Level}`;
          this.add.image(x, perksY, key).setDisplaySize(64, 64);
          x += 80;
        });
        if (boxer === getPlayerBoxer()) {
          const addBtn = this.add.container(x, perksY);
          addBtn.add(
            this.add.image(0, 0, 'fight_card').setDisplaySize(32, 32)
          );
          addBtn.add(
            this.add.image(0, 0, 'perk_add').setDisplaySize(28, 28)
          );
          addBtn.setSize(32, 32);
          addBtn
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
              this.scene.start('PerksScene');
            });
        }
        headerY = perksY + 80;
      } else if (boxer === getPlayerBoxer()) {
        const x = startX + 32;
        const addBtn = this.add.container(x, perksY);
        addBtn.add(
          this.add.image(0, 0, 'fight_card').setDisplaySize(32, 32)
        );
        addBtn.add(
          this.add.image(0, 0, 'perk_add').setDisplaySize(28, 28)
        );
        addBtn.setSize(32, 32);
        addBtn
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.scene.start('PerksScene');
          });
        headerY = perksY + 80;
      }
    }

    this.log = getMatchLog(boxer?.name);
    this.expandedRows = new Set();
    const tableWidth = width * 0.95;
    const rowHeight = 24;
    this.tableWidth = tableWidth;
    this.rowHeight = rowHeight;
    this.startX = startX;
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
      this.viewportHeight = height * 0.85 - this.startY;
      // Container for all log rows
      this.content = this.add.container(0, 0);
      this.scrollY = 0;
      this.renderRows();
      // Mask the content so it becomes scrollable
      const maskShape = this.add
        .rectangle(
          width / 2,
          this.startY + this.viewportHeight / 2,
          tableWidth + 40,
          this.viewportHeight,
          0x000000,
          0
        )
        .setOrigin(0.5);
      const geoMask = maskShape.createGeometryMask();
      this.content.setMask(geoMask);

      const setScroll = (s) => {
        this.scrollY = Phaser.Math.Clamp(s, 0, this.maxScroll);
        this.content.y = -this.scrollY;
      };
      const WHEEL_STEP = 40;
      this.input.on('wheel', (_p, _go, _dx, dy) => {
        setScroll(this.scrollY + (dy > 0 ? WHEEL_STEP : -WHEEL_STEP));
      });
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
    if (this.content) {
      this.content.removeAll(true);
    }
    let y = this.startY;
    const width = this.sys.game.config.width;
    const rowHeight = this.rowHeight;
    for (let [index, entry] of this.log.entries()) {
      const rowRect = this.add
        .rectangle(width / 2, y, this.tableWidth, rowHeight, 0x001b44, tableAlpha)
        .setOrigin(0.5, 0);
      this.content.add(rowRect);

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
      this.content.add(toggle);

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
      const timeStr = entry.method === 'KO' ? String(entry.time) : '-';
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
        this.content.add(obj);
      });
      y += rowHeight;

      if (this.expandedRows.has(index) && Array.isArray(entry.roundDetails)) {
        for (const rd of entry.roundDetails) {
          const detail = this.add.text(
            this.colX[2],
            y,
            `R${rd.round}: ${rd.userScore}-${rd.oppScore} (${rd.totalUser}-${rd.totalOpp})`,
            { font: '18px Arial', color: '#cccccc' }
          );
          this.content.add(detail);
          y += 20;
        }
      }
    }
    this.contentHeight = y - this.startY;
    this.maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
    this.content.y = -this.scrollY;
  }
}
