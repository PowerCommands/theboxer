import { getRankings } from './boxer-stats.js';
import { getTestMode, tableAlpha } from './config.js';
import { getPlayerBoxer } from './player-boxer.js';
import { SoundManager } from './sound-manager.js';
import { scheduleMatch, getPendingMatch } from './next-match.js';

export class SelectBoxerScene extends Phaser.Scene {
  constructor() {
    super('SelectBoxer');
    this.options = [];
    this.choice = [];
    this.filterText = '';
    this.setup = {};
  }

  create(data) {
    this.setup = data || {};
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    this.instruction = this.add
      .text(20, 20, '', { font: '24px Arial', color: '#ffffff' })
      .setOrigin(0, 0);

    const back = () => {
      this.scene.start('Ranking');
    };
    this.add
      .text(20, height - 40, 'Back', { font: '24px Arial', color: '#ffff00' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', back);
    this.input.keyboard.on('keydown-BACKSPACE', back);

    this.resetSelection();
  }

  resetSelection() {
    this.choice = [];
    this.filterText = '';
    if (!getTestMode()) {
      const player = getPlayerBoxer();
      if (player) this.choice = [player];
      this.instruction.setText('Choose your opponent');
    } else {
      this.instruction.setText('Choose first boxer');
    }
    this.showBoxerOptions();
  }

  showBoxerOptions() {
    this.clearOptions();
    const width = this.sys.game.config.width;
    const filter = (this.filterText || '').toLowerCase();
    const player = getPlayerBoxer();
    const selectedNames = this.choice.map((c) => c.name);
    let boxers = getRankings().filter((b) => {
      if (b !== player && selectedNames.includes(b.name)) return false;
      return b.name.toLowerCase().includes(filter);
    });
    if (!getTestMode() && player) {
      const playerRank = player.ranking;
      boxers = boxers.filter((b) => {
        if (b.ranking < playerRank) {
          return b.ranking >= playerRank - 3;
        }
        return true;
      });
    }
    const maxNameLen = boxers.reduce((m, b) => Math.max(m, b.name.length), 4);
    const columnWidths = [5, Math.max(15, maxNameLen + 1), 5, 5, 5, 5, 5, 5];
    const charWidth = 12;
    const rectWidth = columnWidths.reduce((a, c) => a + c, 0) * charWidth;
    const tableLeft = (width - rectWidth) / 2;
    const rowHeight = 24;
    const filterDom = this.add
      .dom(width - 220, 20)
      .createFromHTML(
        `<input type="text" placeholder="Filter boxers" style="width:200px;padding:4px;font-size:16px;" />`
      );
    filterDom.setOrigin(0, 0);
    const filterEl =
      filterDom.node.tagName === 'INPUT' ? filterDom.node : filterDom.node.querySelector('input');
    if (filterEl) {
      filterEl.value = this.filterText;
      filterEl.addEventListener('input', () => {
        this.filterText = filterEl.value;
        this.showBoxerOptions();
      });
    }
    this.options.push(filterDom);
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
      const isPlayer = !getTestMode() && b === player;
      const txt = this.add.text(tableLeft, y, line, {
        font: `${isPlayer ? 'bold ' : ''}20px monospace`,
        color: isPlayer ? '#555555' : '#ffffff',
      });
      if (!isPlayer) {
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => this.selectBoxer(b));
      }
      this.options.push(txt);
    });
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
    this.choice.push(boxer);
    if (getTestMode()) {
      if (this.choice.length < 2) {
        this.instruction.setText('Choose second boxer');
        this.showBoxerOptions();
        return;
      }
    }
    const [boxer1, boxer2] = getTestMode() ? this.choice : [this.choice[0], boxer];
    if (this.setup.fightPlan1 && this.setup.fightPlan1 !== 'default') {
      boxer1.ruleset = this.setup.fightPlan1;
    }
    if (this.setup.fightPlan2 && this.setup.fightPlan2 !== 'default') {
      boxer2.ruleset = this.setup.fightPlan2;
    }
    const rounds = this.setup.rounds ?? 1;
    const aiLevel1 = this.setup.isBoxer1Human ? null : this.setup.playbook1 ?? 'default';
    const aiLevel2 = this.setup.playbook2 ?? 'default';
    scheduleMatch({ boxer1, boxer2, aiLevel1, aiLevel2, rounds });
    const pending = getPendingMatch();
    if (pending) {
      this.scene.start('Calendar');
    } else {
      this.scene.start('Ranking');
    }
  }
}
