import {
  generateMonthlyMatches,
  simulateMatch,
  getCurrentMatches,
  setCurrentMatches,
  getLastParticipants,
} from './calendar.js';
import { getPendingMatch, clearPendingMatch } from './next-match.js';
import { getMatchLog } from './match-log.js';
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

    this.title = this.add
      .text(width / 2, 20, 'Upcoming Matches', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    this.render();
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
    const colX = [width * 0.1, width * 0.3, width * 0.5, width * 0.7, width * 0.85, width * 0.95];

    const headers = ['Date', 'Boxer 1', 'Boxer 2', 'Result', 'Sim', 'Play'];
    const headerRow = headers.map((h, idx) =>
      this.add
        .text(colX[idx], startY, h, { font: '24px Arial', color: '#ffff00' })
        .setOrigin(0.5, 0)
    );
    this.rows.push(headerRow);

    this.matches.forEach((m, i) => {
      const y = startY + (i + 1) * rowH;
      const row = [];
      row.push(
        this.add
          .text(colX[0], y, m.date, { font: '24px Arial', color: '#ffffff' })
          .setOrigin(0.5, 0)
      );
      row.push(
        this.add
          .text(colX[1], y, m.boxer1.name, { font: '24px Arial', color: '#ffffff' })
          .setOrigin(0.5, 0)
      );
      row.push(
        this.add
          .text(colX[2], y, m.boxer2.name, { font: '24px Arial', color: '#ffffff' })
          .setOrigin(0.5, 0)
      );
      row.push(
        this.add
          .text(colX[3], y, this.formatResult(m), {
            font: '24px Arial',
            color: '#ffffff',
          })
          .setOrigin(0.5, 0)
      );
      if (!m.result) {
        const simTxt = this.add
          .text(colX[4], y, 'Sim', { font: '24px Arial', color: '#00ff00' })
          .setOrigin(0.5, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => this.simulate(m));
        row.push(simTxt);
        const playLabel = m.player ? 'Play' : 'Watch';
        const playTxt = this.add
          .text(colX[5], y, playLabel, { font: '24px Arial', color: '#00ff00' })
          .setOrigin(0.5, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => this.playMatch(m, i));
        row.push(playTxt);
      }
      this.rows.push(row);
    });
  }

  async simulatePendingMatches() {
    const pending = this.matches.filter((m) => !m.result && !m.player);
    for (const m of pending) {
      await simulateMatch(m, 3000);
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
    const matchData = {
      ...match,
      red: match.boxer1,
      blue: match.boxer2,
      aiLevel1: 'default',
      aiLevel2: 'default',
      matchIndex: index,
      returnScene: 'Calendar',
    };
    this.scene.start('MatchIntroScene', matchData);
  }
}

