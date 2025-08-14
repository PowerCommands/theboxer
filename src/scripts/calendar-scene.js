import {
  generateMonthlyMatches,
  simulateMatch,
  getCurrentMatches,
  setCurrentMatches,
  getLastParticipants,
} from './calendar.js';
import { getPendingMatch, clearPendingMatch } from './next-match.js';
import { getMatchLog } from './match-log.js';
import { getMatchPreview } from './boxer-stats.js';
import { SoundManager } from './sound-manager.js';
import { formatMoney } from './helpers.js';

export class CalendarScene extends Phaser.Scene {
  constructor() {
    super('Calendar');
    this.matches = [];
    this.rows = [];
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    SoundManager.playMenuLoop();
    const pending = getPendingMatch();
    if (!pending) {
      // No scheduled player match, return to rankings
      this.scene.start('Ranking');
      return;
    }

    const stored = getCurrentMatches();
    if (stored && stored.length > 0) {
      this.matches = stored;
    } else {
      const { matches } = generateMonthlyMatches([
        ...getLastParticipants(),
        pending.boxer1.name,
        pending.boxer2.name,
      ]);
      // Player match is always last
      this.matches = [...matches, { ...pending, player: true }];
      setCurrentMatches(this.matches);
    }

    this.playerIndex = this.matches.findIndex((m) => m.player);
    this.playerMatch = this.matches[this.playerIndex];

    this.title = this.add
      .text(width / 2, 20, 'Upcoming Matches', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    // Player match info and action buttons
    const infoY = height * 0.82 - 50;
    this.playerTitles = this.add
      .text(width / 2, infoY, '', { font: '24px Arial', color: '#ffff00' })
      .setOrigin(0.5, 0);
    this.playerInfo = this.add
      .text(width / 2, infoY + 24, '', { font: '24px Arial', color: '#ffffff' })
      .setOrigin(0.5, 0);
    this.playerDetails = this.add
      .text(width / 2, infoY + 48, '', { font: '20px Arial', color: '#ffffff' })
      .setOrigin(0.5, 0);
    const btnY = height * 0.9;
    this.simBtn = this.add
      .text(width * 0.4, btnY, 'Simulate', {
        font: '32px Arial',
        color: '#00ff00',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.simulate(this.playerMatch));
    this.playBtn = this.add
      .text(width * 0.6, btnY, 'Fight', {
        font: '32px Arial',
        color: '#00ff00',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.playMatch(this.playerMatch, this.playerIndex));

    this.tooltip = this.add
      .text(0, 0, '', { font: '18px Arial', color: '#ffff00', backgroundColor: '#000000' })
      .setOrigin(0.5, 1)
      .setDepth(1000)
      .setVisible(false);

    this.render();

    const back = () => {
      this.scene.start('Ranking');
    };
    this.add
      .text(150, height * 0.93, 'Back', {
        font: '24px Arial',
        color: '#ffff00',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', back);
    this.input.keyboard.on('keydown-BACKSPACE', back);
  }

  formatResult(match) {
    if (!match.result) return '';
    const { winner, method, round, prize, rankingBefore, rankingAfter, titlesWon } =
      match.result;
    const arrow = rankingAfter < rankingBefore ? ' ↑' : '';
    const titleText = titlesWon && titlesWon.length > 0 ? ` ${titlesWon.join(',')}` : '';
    return `${winner} ${method} R${round} ${formatMoney(prize)} Rank ${rankingBefore}→${rankingAfter}${arrow}${titleText}`;
  }

  render() {
    this.rows.flat().forEach((r) => r.destroy());
    this.rows = [];
    const width = this.sys.game.config.width;
    const startY = 80;
    const rowH = 40;
    const colX = [
      width * 0.08,
      width * 0.26,
      width * 0.44,
      width * 0.6,
      width * 0.78,
      width * 0.9,
    ];

    const headers = ['Date', 'Boxer 1', 'Boxer 2', 'Titles', 'Result', 'Action'];
    const headerRow = headers.map((h, idx) =>
      this.add
        .text(colX[idx], startY, h, { font: '20px Arial', color: '#ffff00' })
        .setOrigin(0.5, 0)
    );
    this.rows.push(headerRow);

    let rowIdx = 0;
    this.matches.forEach((m, i) => {
      if (m.player) return;
      const y = startY + (rowIdx + 1) * rowH;
      const row = [];
      if (m.result) {
        const resultLine = `${m.date} ${m.boxer1.name} (${m.boxer1.ranking}) vs ${m.boxer2.name} (${m.boxer2.ranking}) ${this.formatResult(
          m
        )}`;
        row.push(
          this.add
            .text(width / 2, y, resultLine, { font: '20px Arial', color: '#ffffff' })
            .setOrigin(0.5, 0)
        );
        this.rows.push(row);
        rowIdx++;
        return;
      }
      row.push(
        this.add
          .text(colX[0], y, m.date, { font: '20px Arial', color: '#ffffff' })
          .setOrigin(0.5, 0)
      );
      row.push(
        this.add
          .text(
            colX[1],
            y,
            `${m.boxer1.name} (${m.boxer1.ranking})`,
            { font: '20px Arial', color: '#ffffff' }
          )
          .setOrigin(0.5, 0)
      );
      row.push(
        this.add
          .text(
            colX[2],
            y,
            `${m.boxer2.name} (${m.boxer2.ranking})`,
            { font: '20px Arial', color: '#ffffff' }
          )
          .setOrigin(0.5, 0)
      );
      const titles = Array.from(
        new Set([...(m.boxer1.titles || []), ...(m.boxer2.titles || [])])
      )
        .map((t) => `${t}🏆`)
        .join(' ');
      row.push(
        this.add
          .text(colX[3], y, titles, { font: '20px Arial', color: '#ffffff' })
          .setOrigin(0.5, 0)
      );
      row.push(
        this.add
          .text(colX[4], y, this.formatResult(m), {
            font: '20px Arial',
            color: '#ffffff',
          })
          .setOrigin(0.5, 0)
      );
      const simTxt = this.add
        .text(colX[5] - 15, y, '🎲', { font: '20px Arial', color: '#00ff00' })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true });
      simTxt
        .on('pointerup', () => this.simulate(m))
        .on('pointerover', () => this.showTooltip('Simulate match', simTxt))
        .on('pointerout', () => this.hideTooltip());
      row.push(simTxt);
      const playTxt = this.add
        .text(colX[5] + 15, y, '📺', { font: '20px Arial', color: '#00ff00' })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true });
      playTxt
        .on('pointerup', () => this.playMatch(m, i))
        .on('pointerover', () => this.showTooltip('View match', playTxt))
        .on('pointerout', () => this.hideTooltip());
      row.push(playTxt);
      this.rows.push(row);
      rowIdx++;
    });

    this.renderPlayerInfo();
  }

  showTooltip(text, obj) {
    if (!this.tooltip) return;
    this.tooltip.setText(text);
    this.tooltip.setPosition(obj.x, obj.y - 5);
    this.tooltip.setVisible(true);
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.setVisible(false);
  }

  async simulatePendingMatches() {
    const pending = this.matches.filter((m) => !m.result && !m.player);
    for (const m of pending) {
      await simulateMatch(m, 500);
      this.render();
    }
  }

  async simulate(match) {
    if (match.player) {
      await this.simulatePendingMatches();
    }
    await simulateMatch(match, 500);
    this.render();
  }

  async playMatch(match, index) {
    if (match.player) {
      await this.simulatePendingMatches();
      const matchData = {
        ...match,
        red: match.boxer1,
        blue: match.boxer2,
        matchIndex: index,
        returnScene: 'Ranking',
      };
      clearPendingMatch();
      this.scene.start('MatchIntroScene', matchData);
      return;
    }
    const { purse, winnerBonus, titlesOnTheLine } = getMatchPreview(
      match.boxer1,
      match.boxer2
    );
    const matchData = {
      ...match,
      red: match.boxer1,
      blue: match.boxer2,
      aiLevel1: 'default',
      aiLevel2: 'default',
      matchIndex: index,
      returnScene: 'Calendar',
      purse,
      winnerBonus,
      titlesOnTheLine,
    };
    this.scene.start('MatchIntroScene', matchData);
  }

  renderPlayerInfo() {
    if (!this.playerInfo || !this.playerMatch) return;
    const titles = Array.isArray(this.playerMatch.titlesOnTheLine)
      ? this.playerMatch.titlesOnTheLine.map((t) => `${t.code}🏆`).join(' ')
      : '';
    this.playerTitles.setText(titles);
    this.playerTitles.setVisible(titles.length > 0);

    const info = `${this.playerMatch.date} ${this.playerMatch.boxer1.name} (${this.playerMatch.boxer1.ranking}) vs ${this.playerMatch.boxer2.name} (${this.playerMatch.boxer2.ranking})`;
    const result = this.formatResult(this.playerMatch);
    this.playerInfo.setText(result ? `${info} ${result}` : info);

    const arena = this.playerMatch.arena || {};
    const parts = [this.playerMatch.time, arena.Name, arena.City, arena.Country].filter((v) => v);
    this.playerDetails.setText(parts.join(', '));
  }
}

